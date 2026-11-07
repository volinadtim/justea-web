# -*- coding: utf-8 -*-
"""Снятие частотностей Яндекс.Вордстата по голове семантического ядра.

Вордстат без авторизации не отдаёт ни одной цифры, поэтому нужны куки
авторизованной сессии. Контракт внутреннего API снят с живой страницы
(перехват XHR в реальном Chromium), документирован в wordstat-raw/README.md:

    POST /wordstat/api/getTable
      {"currentDevice":"desktop,phone,tablet","dbname":"rus",
       "filters":{"region":"<id>","tableType":"popular"},
       "searchValue":"<фраза>","startDate":"дд.мм.гггг","endDate":"дд.мм.гггг"}
    -> {"table":{"info":{"period":{...}},"isQueryInvalid":bool,
                 "tableData":{"popular":[{"text":"...","value":"12345"},...]}}}

    POST /wordstat/api/getGraph   (+ "currentGraphType":"month")
    -> {"graph":{"images":{"timeSeries":{"preparedValues":{"absolute":[
          {"year":2025,"month":0,"y":4014},...]}}}}}   # month: 0 = январь

Один getTable отдаёт до 200 фраз с точными частотами, поэтому по ~130 сидам
покрываются тысячи запросов — отдельный запрос на каждую фразу не нужен.

Запросы идут ТОЛЬКО мимо прокси: сессия Яндекса создана на домашнем IP,
через зарубежный выход она оборвётся. Капчу не обходим: при `showcaptcha`
или пустом ответе скрипт останавливается.

Файл с куками НЕ копируется в репозиторий и его значения не логируются.

    python3 wordstat.py <файл-с-куками> [--regions 2,213,225] [--graph N]
"""
import argparse, csv, collections, json, pathlib, random, re, sys, time, urllib.parse
import requests

ROOT = pathlib.Path(__file__).resolve().parent.parent          # docs/market
REPO = ROOT.parent.parent                                      # корень репозитория
CORE = ROOT / "semantic-core.csv"
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")
API = "https://wordstat.yandex.ru/wordstat/api"
DEVICES = "desktop,phone,tablet"

# id регионов Яндекса
REGION_NAMES = {"2": "спб", "213": "мск", "225": "рф", "1": "мск_обл",
                "10174": "спб_обл"}
NEEDED = ("Session_id", "sessionid2")


# ----------------------------------------------------------------- куки

def load_cookies(path: pathlib.Path) -> dict:
    """JSON от Cookie-Editor (в т.ч. несколько массивов подряд) или Netscape
    cookies.txt -> {name: value}. Значения наружу не отдаём и не печатаем."""
    text = path.read_text(encoding="utf-8-sig", errors="replace").strip()
    jar: dict[str, str] = {}

    def take(items):
        for c in items:
            if isinstance(c, list):
                take(c)
            elif isinstance(c, dict) and "name" in c and "value" in c:
                dom = (c.get("domain") or "").lstrip(".")
                if dom and "yandex" not in dom:
                    continue
                jar[c["name"]] = c["value"]

    if text.startswith(("[", "{")):
        dec, idx = json.JSONDecoder(), 0
        while idx < len(text):
            try:
                obj, end = dec.raw_decode(text, idx)
            except json.JSONDecodeError:
                break
            take(obj if isinstance(obj, list) else [obj])
            idx = end
            while idx < len(text) and text[idx] in " \t\r\n,":
                idx += 1
    else:
        for line in text.splitlines():                          # Netscape
            if not line.strip() or line.lstrip().startswith("#"):
                continue
            p = line.split("\t")
            if len(p) >= 7 and "yandex" in p[0]:
                jar[p[5]] = p[6].strip()

    missing = [n for n in NEEDED if n not in jar]
    if missing:
        sys.exit(f"В файле нет обязательных куки: {', '.join(missing)}.\n"
                 f"Нашлось имён: {len(jar)}.\n"
                 f"Session_id помечена HttpOnly — её видит расширение "
                 f"(Cookie-Editor / Get cookies.txt), но не консоль браузера.")
    return jar


def make_session(jar: dict) -> requests.Session:
    s = requests.Session()
    s.trust_env = False                      # никакого прокси: только домашний IP
    s.headers.update({"User-Agent": UA, "Accept-Language": "ru,en;q=0.8",
                      "Accept": "application/json, text/plain, */*",
                      "Content-Type": "application/json",
                      "Origin": "https://wordstat.yandex.ru"})
    for k, v in jar.items():
        s.cookies.set(k, v, domain=".yandex.ru")
    return s


def check_auth(s: requests.Session) -> str:
    r = s.get("https://wordstat.yandex.ru/", timeout=30)
    if "showcaptcha" in r.url:
        sys.exit("Яндекс отдал капчу. Останавливаюсь — капчу не обхожу.")
    m = re.search(r'"displayName"\s*:\s*"([^"]*)"', r.text)
    if not m or not m.group(1):
        sys.exit("Сессия не авторизована: в ответе нет displayName. "
                 "Куки устарели — переэкспортируйте.")
    # NB: поле "login":"" есть и у авторизованной сессии, это НЕ признак входа
    return m.group(1)


# ----------------------------------------------------------------- API

def _referer(s, phrase, region, view):
    s.headers["Referer"] = (f"https://wordstat.yandex.ru/?region={region}"
                            f"&view={view}&words={urllib.parse.quote(phrase)}")


def get_table(s, phrase, region, table_type="popular", page=0, tries=3):
    body = {"currentDevice": DEVICES, "dbname": "rus",
            "filters": {"region": str(region), "tableType": table_type},
            "searchValue": phrase,
            "startDate": "01.11.2024", "endDate": "31.10.2026"}
    if page:
        body["phPage"] = page
    for attempt in range(tries):
        try:
            _referer(s, phrase, region, "table")
            r = s.post(f"{API}/getTable", json=body, timeout=60)
            if "showcaptcha" in r.url:
                raise RuntimeError("captcha")
            if r.status_code == 200:
                return r.json()["table"]
            last = f"getTable {r.status_code}: {r.text[:120]}"
        except RuntimeError:
            raise
        except Exception as e:                    # таймаут, обрыв, битый JSON
            last = f"{type(e).__name__}: {e}"[:150]
        if attempt == tries - 1:
            raise RuntimeError(last)
        time.sleep(5 + attempt * 10 + random.random() * 3)


def get_graph(s, phrase, region, tries=3):
    body = {"currentDevice": DEVICES, "currentGraphType": "month",
            "dbname": "rus", "filters": {"region": str(region)},
            "searchValue": phrase,
            "startDate": "01.11.2024", "endDate": "31.10.2026"}
    for attempt in range(tries):
        try:
            _referer(s, phrase, region, "graph")
            r = s.post(f"{API}/getGraph", json=body, timeout=60)
            if "showcaptcha" in r.url:
                raise RuntimeError("captcha")
            if r.status_code == 200:
                return r.json()["graph"]
            last = f"getGraph {r.status_code}: {r.text[:120]}"
        except RuntimeError:
            raise
        except Exception as e:
            last = f"{type(e).__name__}: {e}"[:150]
        if attempt == tries - 1:
            raise RuntimeError(last)
        time.sleep(5 + attempt * 10 + random.random() * 3)


# ----------------------------------------------------------------- сиды

def seeds_from_core(max_seeds: int) -> list[str]:
    """Сиды — КОРОТКИЕ головные фразы. Это принципиально: getTable возвращает
    подзапросы, содержащие сид, поэтому «пуэр» отдаёт 200 строк, а «как
    заваривать да хун пао в заварнике» — ноль. Длинные фразы из ядра в сиды не
    годятся, их частотности приходят внутри таблиц коротких сидов.

    Состав: названия сортов и типов, встречающиеся в ядре как целевые, плюс
    фиксированные головы по завариванию, церемонии, здоровью и посуде.
    """
    rows = list(csv.DictReader(CORE.open(encoding="utf-8-sig"), delimiter=";"))

    # 1. названия сортов берём КАНОНИЧЕСКИЕ — из каталога и файла кандидатов.
    #    Выводить их из самих запросов нельзя: там попадаются артефакты
    #    алфавитного расширения подсказок («цзинь цзюнь мэй а», «улун мао се»).
    teas = json.loads((REPO / "data" / "teas.json").read_text(encoding="utf-8"))
    cand = json.loads((REPO / "docs" / "tea-catalog-candidates.json")
                      .read_text(encoding="utf-8"))
    names = {t["slug"]: t["name"] for t in teas}
    for t in cand["teas"]:
        names.setdefault(t["slug"], t["name"])
    names.setdefault("matcha", "матча")
    # обиходные написания, которыми реально ищут
    COMMON = {"bai-hao-yin-zhen": "серебряные иглы", "gyokuro": "гёкуро",
              "milk-oolong": "молочный улун", "shu-pu-erh": "шу пуэр",
              "sheng-pu-erh": "шэн пуэр", "tie-guan-yin": "те гуань инь",
              "gaba": "габа чай", "keemun": "кимун", "genmaicha": "генмайча"}

    # вес сорта в ядре — сколько целевого спроса на него приходится
    weight: dict[str, int] = collections.Counter()
    for r in rows:
        if r["связанный_сорт"] and r["цель_justea"] != "нет":
            weight[r["связанный_сорт"]] += int(r["подсказки_попаданий"])

    by_slug = {s_: (COMMON.get(s_) or names.get(s_, "")).lower()
               for s_ in weight if s_ in COMMON or s_ in names}
    by_slug = {k: v for k, v in by_slug.items() if v}
    varieties = [by_slug[s_] for s_, _ in weight.most_common() if s_ in by_slug]

    # 2. типы чая
    types = ["зелёный чай", "чёрный чай", "белый чай", "жёлтый чай", "улун",
             "пуэр", "хэй ча", "матча", "китайский чай", "японский чай"]

    # 3. заваривание
    brewing = ["как заваривать чай", "как заваривать пуэр", "как заваривать улун",
               "как заваривать зелёный чай", "как заваривать белый чай",
               "как заваривать матчу", "гунфу ча", "проливы чая",
               "температура заваривания чая", "пропорции чая",
               "сколько заваривать чай", "холодное заваривание чая",
               "заваривание чая в термосе"]

    # 4. посуда
    teaware = ["гайвань", "исинский чайник", "типот", "чахай", "чабань",
               "чайник для заваривания чая", "венчик для матчи"]

    # 5. церемония — основное гео пользователя
    ceremony = ["чайная церемония", "чайная церемония спб",
                "чайная церемония санкт-петербург", "чайная церемония москва",
                "чайная церемония в подарок", "чайная церемония на двоих",
                "мастер класс чайная церемония", "обучение чайной церемонии",
                "чайный клуб", "чайный клуб спб", "чайная спб",
                "китайская чайная церемония", "японская чайная церемония",
                "чаепитие"]

    # 6. здоровье и эффект
    health = ["польза и вред чая", "чай и давление", "кофеин в чае",
              "пуэр эффект", "чай для бодрости", "чай перед сном",
              "зелёный чай польза", "матча польза"]

    # 7. коммерция и гео — чтобы видеть локальный коммерческий спрос
    commercial = ["купить чай", "китайский чай купить", "чай спб",
                  "чайный магазин спб", "чай оптом"]

    seeds: list[str] = []
    seen: set[str] = set()
    # сначала церемония (основная задача), потом сорта, потом остальное
    for group in (ceremony, types, varieties, brewing, health, teaware, commercial):
        for q in group:
            q = q.strip().lower()
            if q and q not in seen:
                seen.add(q); seeds.append(q)

    # «как заваривать <сорт>» для самых весомых сортов — отдельный шаблон спроса
    top_slugs = [s_ for s_, _ in weight.most_common(30) if s_ in by_slug]
    for s_ in top_slugs:
        q = f"как заваривать {by_slug[s_]}"
        if q not in seen:
            seen.add(q); seeds.append(q)

    return seeds[:max_seeds]


# ----------------------------------------------------------------- main

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("cookies", type=pathlib.Path)
    ap.add_argument("--regions", default="2,213,225",
                    help="id регионов через запятую (2=СПб, 213=Москва, 225=Россия)")
    ap.add_argument("--seeds", type=int, default=140, help="сколько сид-фраз")
    ap.add_argument("--graph", type=int, default=45,
                    help="для скольких головных фраз снять месячную динамику (гео #1)")
    ap.add_argument("--pause", type=float, default=1.6)
    ap.add_argument("--out", type=pathlib.Path, default=ROOT / "wordstat-raw")
    a = ap.parse_args()

    s = make_session(load_cookies(a.cookies))
    print(f"Авторизован как: {check_auth(s)}", flush=True)

    regions = [x.strip() for x in a.regions.split(",") if x.strip()]
    seeds = seeds_from_core(a.seeds)
    a.out.mkdir(parents=True, exist_ok=True)
    shows_f = a.out / "wordstat-shows.jsonl"
    graph_f = a.out / "wordstat-graph.jsonl"

    done = set()
    if shows_f.exists():
        for line in shows_f.open(encoding="utf-8"):
            d = json.loads(line)
            done.add((d["seed"], d["region_id"]))
        print(f"Уже снято ранее: {len(done)} пар (сид, регион) — пропускаю", flush=True)

    print(f"Сидов: {len(seeds)} × регионов: {len(regions)} = "
          f"{len(seeds)*len(regions)} вызовов getTable, "
          f"~{len(seeds)*len(regions)*(a.pause+0.8)/60:.0f} мин", flush=True)

    phrases_seen = set()
    with shows_f.open("a", encoding="utf-8") as fh:
        for i, seed in enumerate(seeds, 1):
            for rid in regions:
                if (seed, rid) in done:
                    continue
                try:
                    t = get_table(s, seed, rid)
                except RuntimeError as e:
                    if "captcha" in str(e):
                        print("\nКапча. Останавливаюсь — обходить не буду.", flush=True)
                        return
                    print(f"  ! {seed[:40]} / {rid}: {e}", flush=True)
                    continue
                except Exception as e:
                    print(f"  ! {seed[:40]} / {rid}: {type(e).__name__}", flush=True)
                    continue
                rows = t["tableData"].get("popular") or []
                per = t["info"].get("period", {})
                fh.write(json.dumps({
                    "seed": seed, "region_id": rid,
                    "region": REGION_NAMES.get(rid, rid),
                    "period_start": per.get("startDate"), "period_end": per.get("endDate"),
                    "query_invalid": t.get("isQueryInvalid"),
                    "has_next_page": t["info"].get("hasNextPage"),
                    "rows": [{"phrase": x["text"], "shows": int(x["value"])}
                             for x in rows if str(x.get("value", "")).isdigit()],
                    "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                }, ensure_ascii=False) + "\n")
                fh.flush()
                phrases_seen.update(x["text"] for x in rows)
                time.sleep(a.pause + random.random() * a.pause)
            if i % 20 == 0:
                print(f"  getTable {i}/{len(seeds)} сидов, "
                      f"уникальных фраз набрано: {len(phrases_seen)}", flush=True)

    # месячная динамика по головным фразам в основном гео
    if a.graph > 0:
        main_region = regions[0]
        gdone = set()
        if graph_f.exists():
            for line in graph_f.open(encoding="utf-8"):
                gdone.add(json.loads(line)["phrase"])
        print(f"\nМесячная динамика: {a.graph} фраз, гео {main_region} "
              f"({REGION_NAMES.get(main_region, main_region)})", flush=True)
        with graph_f.open("a", encoding="utf-8") as fh:
            for j, ph in enumerate(seeds[:a.graph], 1):
                if ph in gdone:
                    continue
                try:
                    g = get_graph(s, ph, main_region)
                except RuntimeError as e:
                    if "captcha" in str(e):
                        print("Капча на динамике. Останавливаюсь.", flush=True)
                        break
                    print(f"  ! динамика {ph[:40]}: {e}", flush=True)
                    continue
                except Exception as e:
                    print(f"  ! динамика {ph[:40]}: {type(e).__name__}", flush=True)
                    continue
                pts = (g.get("images", {}).get("timeSeries", {})
                        .get("preparedValues", {}).get("absolute") or [])
                fh.write(json.dumps({
                    "phrase": ph, "region_id": main_region,
                    "region": REGION_NAMES.get(main_region, main_region),
                    # month в ответе 0-индексный: 0 = январь
                    "monthly": [{"year": p["year"], "month": p["month"] + 1,
                                 "shows": p["y"]} for p in pts],
                    "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                }, ensure_ascii=False) + "\n")
                fh.flush()
                time.sleep(a.pause + random.random() * a.pause)
                if j % 15 == 0:
                    print(f"  getGraph {j}/{a.graph}", flush=True)

    print(f"\nГотово.\n  {shows_f}\n  {graph_f}\n"
          f"Дальше: python3 merge_wordstat.py", flush=True)


if __name__ == "__main__":
    main()
