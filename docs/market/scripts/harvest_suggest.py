# -*- coding: utf-8 -*-
"""Харвест поисковых подсказок Яндекса и Google по сид-списку.

Яндекс: suggest.yandex.ru/suggest-ya.cgi — RU-direct (домашний IP), подсказки упорядочены
по популярности. Google: www.google.com/complete/search?client=chrome — через VPN-proxy.
Выход: JSONL, одна строка на запрос к API.
"""
import json, re, sys, time, random, urllib.parse, pathlib, threading
from concurrent.futures import ThreadPoolExecutor
import requests

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from seeds import GROUPS

OUT = pathlib.Path(sys.argv[1])
OUT.parent.mkdir(parents=True, exist_ok=True)

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"

# Яндекс идёт мимо прокси (NO_PROXY содержит .ru), Google — через прокси по умолчанию.
ya_sess = requests.Session(); ya_sess.trust_env = False  # никакого прокси вовсе
ya_sess.headers["User-Agent"] = UA
g_sess = requests.Session()  # берёт HTTPS_PROXY из env
g_sess.headers["User-Agent"] = UA

lock = threading.Lock()
fh = OUT.open("w", encoding="utf-8")
stats = {"ya_ok": 0, "ya_err": 0, "g_ok": 0, "g_err": 0}


def write(rec):
    with lock:
        fh.write(json.dumps(rec, ensure_ascii=False) + "\n")


def yandex(part):
    url = "https://suggest.yandex.ru/suggest-ya.cgi"
    p = {"srv": "morda_ru_desktop", "wiz": "TrWth", "uil": "ru", "part": part, "n": 10}
    r = ya_sess.get(url, params=p, timeout=15)
    r.raise_for_status()
    txt = r.text
    # suggest.apply(["part",[...],[...]],[])
    m = re.search(r"suggest\.apply\((\[.*)\)\s*$", txt.strip(), re.S)
    if not m:
        raise ValueError("unparsed: " + txt[:200])
    raw = m.group(1)
    # аккуратно вытащим первый JSON-массив
    dec = json.JSONDecoder()
    arr, _ = dec.raw_decode(raw)
    sugg = [s for s in arr[1] if isinstance(s, str)] if len(arr) > 1 else []
    return sugg


def google(part):
    url = "https://www.google.com/complete/search"
    p = {"client": "chrome", "hl": "ru", "gl": "ru", "q": part}
    r = g_sess.get(url, params=p, timeout=20)
    r.raise_for_status()
    data = json.loads(r.text)
    return [s for s in data[1] if isinstance(s, str)]


def job(engine, group, seed, part):
    fn = yandex if engine == "yandex" else google
    for attempt in range(3):
        try:
            sugg = fn(part)
            write({"engine": engine, "group": group, "seed": seed, "part": part,
                   "suggestions": sugg, "ts": time.time()})
            stats[("ya" if engine == "yandex" else "g") + "_ok"] += 1
            return
        except Exception as e:
            if attempt == 2:
                write({"engine": engine, "group": group, "seed": seed, "part": part,
                       "error": f"{type(e).__name__}: {e}"[:200], "ts": time.time()})
                stats[("ya" if engine == "yandex" else "g") + "_err"] += 1
            else:
                time.sleep(1.5 * (attempt + 1) + random.random())


QUESTIONS = ["как", "что", "сколько", "какой", "чем", "где", "почему", "зачем"]
MARKERS = ["купить", "цена", "отзывы", "польза", "рецепт", "своими руками"]
ALPHABET = list("абвгдежзиклмнопрстуфхцчшэюя")

base, alpha = [], []
for group, seeds in GROUPS.items():
    for seed in seeds:
        base.append((group, seed, seed))                 # сам сид
        for q in QUESTIONS:
            base.append((group, seed, f"{seed} {q}"))     # вопросные хвосты
        for mk in MARKERS:
            base.append((group, seed, f"{seed} {mk}"))
        for ch in ALPHABET:
            alpha.append((group, seed, f"{seed} {ch}"))    # алфавитное расширение

YA_TASKS = base + alpha      # Яндекс — полный охват (основной источник по RU)
G_TASKS = base                # Google — без алфавита
print(f"yandex parts: {len(YA_TASKS)}  google parts: {len(G_TASKS)}", flush=True)

def run(engine, tasks, workers, pause):
    def w(t):
        job(engine, *t)
        time.sleep(pause + random.random() * pause)
    with ThreadPoolExecutor(max_workers=workers) as ex:
        for i, _ in enumerate(ex.map(w, tasks), 1):
            if i % 500 == 0:
                print(f"  {engine} {i}/{len(tasks)} {stats}", flush=True)

t0 = time.time()
run("yandex", YA_TASKS, 6, 0.08)
print("yandex done", stats, f"{time.time()-t0:.0f}s", flush=True)
run("google", G_TASKS, 4, 0.15)
print("google done", stats, f"{time.time()-t0:.0f}s", flush=True)
fh.close()
print("OUT", OUT, OUT.stat().st_size, "bytes")
