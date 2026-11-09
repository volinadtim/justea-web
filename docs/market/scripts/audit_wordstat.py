# -*- coding: utf-8 -*-
"""Проверка снятых данных Вордстата на уход в чужую тему.

Вордстат лемматизирует запрос, и короткий сид может схлопнуться в другое
слово («матча» -> «матч»). Скрипт считает по каждому сиду долю строк с
чайным маркером: низкая доля = сид неоднозначный, его данные подозрительны.
"""
import json, pathlib, re, collections, sys

RAW = pathlib.Path(__file__).resolve().parent.parent / "wordstat-raw"
SRC = RAW / "wordstat-shows.jsonl"

TEA = re.compile(r"ча[йяёюе]|чайн|заварив|заварк|улун|пуэр|латте|порошок|венчик"
                 r"|церемон|гайван|типот|сенча|гёкуро|гекуро|ходзич|генмайч|гэммайч"
                 r"|кукич|купаж|терруар|типс|пролив|гунфу|чабан|чахай|чаван")


def norm(t):
    return t.lower().replace("ё", "е").strip()


def keeps_seed(seed, phrase):
    """Вордстат возвращает фразы, содержащие запрос. Если лемма «уехала»
    в другое слово, исходной строки сида в ответе не будет: «матча» -> «матч»,
    «ассам» -> «асса». Это надёжнее тематического маркера, потому что сама
    строка «да хун пао» слова «чай» не содержит, но сидом остаётся."""
    return norm(seed) in norm(phrase)

by_seed = collections.defaultdict(lambda: {"rows": 0, "tea": 0, "keep": 0,
                                           "shows": 0, "ok_shows": 0, "top": []})
for line in SRC.open(encoding="utf-8"):
    d = json.loads(line)
    if d["region"] != "рф":
        continue
    b = by_seed[d["seed"]]
    for r in d["rows"]:
        b["rows"] += 1
        b["shows"] += r["shows"]
        ok = keeps_seed(d["seed"], r["phrase"]) or bool(TEA.search(norm(r["phrase"])))
        if ok:
            b["keep"] += 1
            b["ok_shows"] += r["shows"]
    b["top"] = [r["phrase"] for r in d["rows"][:3]]

rows = []
for seed, b in by_seed.items():
    if not b["rows"]:
        continue
    share = b["keep"] / b["rows"]
    share_shows = b["ok_shows"] / b["shows"] if b["shows"] else 0
    rows.append((share, share_shows, seed, b))
rows.sort()

print(f"{'строк по теме':>14} {'показов по теме':>16}  {'сид':26} топ-3 выдачи")
bad = []
for share, ss, seed, b in rows:
    flag = ""
    if ss < 0.40:
        flag = "  <-- УВЕЛО В ЧУЖУЮ ТЕМУ"
        bad.append(seed)
    print(f"{share*100:13.0f}% {ss*100:15.0f}%  {seed[:26]:26} {', '.join(b['top'])[:56]}{flag}")

print(f"\nВсего сидов: {len(rows)}. Подозрительных: {len(bad)}")
if bad:
    print("Их данные нельзя использовать как есть:")
    for s in bad:
        print(f"  - {s}")
    print("\nДля таких сидов нужен уточнённый вариант запроса "
          "(например «матча чай» вместо «матча»).")
