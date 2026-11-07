# -*- coding: utf-8 -*-
"""Переносит снятые частотности Вордстата в semantic-core.csv и собирает
отдельный файл по фразам, которых в ядре не было.

Вход:  wordstat-raw/wordstat-shows.jsonl, wordstat-raw/wordstat-graph.jsonl
Выход: semantic-core.csv (колонки frequency*, wordstat_*),
       wordstat-raw/wordstat-frequencies.csv  — все снятые фразы,
       wordstat-raw/wordstat-seasonality.csv  — месячная динамика.
"""
import csv, json, pathlib, collections, statistics, sys, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
RAW = ROOT / "wordstat-raw"
CORE = ROOT / "semantic-core.csv"
SHOWS = RAW / "wordstat-shows.jsonl"
GRAPH = RAW / "wordstat-graph.jsonl"
BATCHES = RAW / "orchestrator-batches"   # доборы, снятые оркестратором вручную

if not SHOWS.exists():
    sys.exit(f"Нет {SHOWS} — сначала запустите wordstat.py")

# Вордстат лемматизирует запрос, и для некоторых сидов это уводит в чужую тему.
# Самый злой случай: «матча» сводится к «матч», и сид возвращает 200 строк
# футбола на 147 млн показов («матч», «кхл матчи», «расписание матчей»).
# Так же уходят «ассам» -> «асса» («биг асс», «тромбо асс», «асса фильм»)
# и «банча» -> «банч» («банч код», «банчить»). Проверка — audit_wordstat.py.
# Такие строки нельзя пускать ни в ядро, ни в выгрузку.
AMBIGUOUS_SEEDS = {"матча", "ассам", "банча"}
TEA_MARKER = re.compile(r"ча[йяёюе]|чайн|заварив|заварк|улун|пуэр|матч[ае] (?:чай|латте|порош)"
                        r"|латте|порошок|венчик|церемон|гайван|типот|сенча|гёкуро|гекуро"
                        r"|ходзич|генмайч|гэммайч|кукич|банча|купаж|терруар|типс")


def is_contaminated(seed: str, phrase: str) -> bool:
    """Строка из неоднозначного сида без чайного маркера — чужая тема."""
    return seed in AMBIGUOUS_SEEDS and not TEA_MARKER.search(phrase.lower())


# ----------------------------------------------------- частотности
def wordkey(q: str) -> str:
    """Ключ без порядка слов и без ё.

    Широкое соответствие Вордстата порядок слов игнорирует: «черный или
    зеленый чай» и «зеленый или черный чай» — одна и та же цифра, в выдачу
    попадает только одна из форм. Поэтому фразу ядра ищем сначала по строке,
    а потом по множеству слов. Проверено: на 19 329 строках ядра такой
    поиск даёт 1 207 дополнительных попаданий и ни одного конфликта
    (двух разных снятых фраз с одним ключом)."""
    return " ".join(sorted(q.lower().replace("ё", "е").split()))


shows: dict[str, dict[str, int]] = collections.defaultdict(dict)
seeds_of: dict[str, set] = collections.defaultdict(set)
periods, dates = set(), set()
dropped = [0]
for line in SHOWS.open(encoding="utf-8"):
    d = json.loads(line)
    if d.get("period_start") and d.get("period_end"):
        periods.add((d["period_start"], d["period_end"]))
    dates.add(d["ts"][:10])
    for r in d["rows"]:
        if is_contaminated(d["seed"], r["phrase"]):
            dropped[0] += 1
            continue
        shows[r["phrase"]][d["region"]] = r["shows"]
        seeds_of[r["phrase"]].add(d["seed"])

import datetime
def fmt(ms):
    return datetime.datetime.fromtimestamp(ms / 1000, datetime.UTC).strftime("%Y-%m-%d")
period_txt = "; ".join(f"{fmt(a)}..{fmt(b)}" for a, b in sorted(periods)) or "н/д"
snap_date = sorted(dates)[-1] if dates else ""
print(f"Снято фраз: {len(shows)}  период Вордстата: {period_txt}  дата съёма: {snap_date}")
if dropped[0]:
    print(f"Отброшено как чужая тема (лемматизация неоднозначного сида): {dropped[0]} строк")

# ------------------------------------------- доборы оркестратора
# Куки Вордстата у оркестратора, часть фраз снимает он — руками в интерфейсе,
# по России («все регионы»). Эти цифры не затирают мой прогон: они ставятся
# только там, где у фразы замера нет. Период у них свой, на месяц позже,
# поэтому в источнике он помечен отдельно (сверка — report.md §9.6).
manual: dict[str, dict] = {}
if BATCHES.is_dir():
    for f in sorted(BATCHES.glob("*.csv")):
        for r in csv.DictReader(f.open(encoding="utf-8-sig"), delimiter=";"):
            v = r["показов_в_месяц"].strip()
            if not v:
                continue
            manual[r["запрос"]] = {"shows": int(v), "date": r["дата_съёма"],
                                  "period": r["период"]}
    print(f"Доборов оркестратора: {len(manual)} фраз из "
          f"{len(list(BATCHES.glob('*.csv')))} пачек")

# индекс по множеству слов: только там, где ключ однозначен
by_words: dict[str, list[str]] = collections.defaultdict(list)
for ph in shows:
    by_words[wordkey(ph)].append(ph)

manual_by_words: dict[str, list[str]] = collections.defaultdict(list)
for ph in manual:
    manual_by_words[wordkey(ph)].append(ph)

# ----------------------------------------------------- в ядро
rows = list(csv.DictReader(CORE.open(encoding="utf-8-sig"), delimiter=";"))
hit = norm_hit = manual_hit = 0
for r in rows:
    s = shows.get(r["запрос"])
    note = ""
    if not s:
        cand = by_words.get(wordkey(r["запрос"]), [])
        if len(cand) == 1:
            s = shows[cand[0]]
            note = ", порядок слов"
            norm_hit += 1
    if not s:
        # своего замера нет — берём добор оркестратора, если он есть
        m = manual.get(r["запрос"])
        if not m:
            mc = manual_by_words.get(wordkey(r["запрос"]), [])
            m = manual[mc[0]] if len(mc) == 1 else None
        if not m:
            continue
        r["wordstat_рф"] = str(m["shows"])
        r["frequency"] = str(m["shows"])
        r["frequency_source"] = "yandex-wordstat (рф, добор оркестратора)"
        r["frequency_date"] = m["date"]
        manual_hit += 1
        hit += 1
        continue
    hit += 1
    r["wordstat_спб"] = s.get("спб", "")
    r["wordstat_мск"] = s.get("мск", "")
    r["wordstat_рф"] = s.get("рф", "")
    # основное гео проекта — СПб; если по нему нет, берём РФ
    r["frequency"] = s.get("спб", s.get("рф", ""))
    geo = "спб" if "спб" in s else "рф"
    r["frequency_source"] = f"yandex-wordstat ({geo}{note})"
    r["frequency_date"] = snap_date

with CORE.open("w", encoding="utf-8-sig", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0].keys()), delimiter=";",
                       lineterminator="\n")
    w.writeheader(); w.writerows(rows)
print(f"Из доборов оркестратора заполнено: {manual_hit} строк")
print(f"В ядре заполнено: {hit} строк из {len(rows)} (из них {norm_hit} по нормализованному порядку слов)")

# ----------------------------------------------------- все снятые фразы
in_core = {r["запрос"] for r in rows}
dst = RAW / "wordstat-frequencies.csv"
with dst.open("w", encoding="utf-8-sig", newline="") as f:
    w = csv.writer(f, delimiter=";", lineterminator="\n")
    w.writerow(["запрос", "wordstat_спб", "wordstat_мск", "wordstat_рф",
                "есть_в_ядре", "найден_по_сидам", "период", "дата_съёма"])
    for ph, s in sorted(shows.items(), key=lambda kv: -(kv[1].get("рф") or 0)):
        w.writerow([ph, s.get("спб", ""), s.get("мск", ""), s.get("рф", ""),
                    "да" if ph in in_core else "нет",
                    " | ".join(sorted(seeds_of[ph])[:3]), period_txt, snap_date])
new = sum(1 for ph in shows if ph not in in_core)
print(f"-> {dst}  ({len(shows)} фраз, из них новых для ядра: {new})")

# ----------------------------------------------------- сезонность
if GRAPH.exists():
    MON = ["", "янв", "фев", "мар", "апр", "май", "июн",
           "июл", "авг", "сен", "окт", "ноя", "дек"]
    out = RAW / "wordstat-seasonality.csv"
    with out.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f, delimiter=";", lineterminator="\n")
        w.writerow(["запрос", "регион", "средние_показы_в_месяц"]
                   + [f"индекс_{MON[i]}" for i in range(1, 13)]
                   + ["пик", "провал", "месяцев_в_ряду"])
        n = 0
        for line in GRAPH.open(encoding="utf-8"):
            d = json.loads(line)
            pts = d["monthly"]
            if not pts:
                continue
            vals = [p["shows"] for p in pts]
            avg = statistics.mean(vals) or 1
            bym = collections.defaultdict(list)
            for p in pts:
                bym[p["month"]].append(p["shows"])
            idx = {mo: round(statistics.mean(v) / avg * 100)
                   for mo, v in bym.items()}
            full = [idx.get(i, "") for i in range(1, 13)]
            known = {k: v for k, v in idx.items()}
            peak = MON[max(known, key=known.get)] if known else ""
            low = MON[min(known, key=known.get)] if known else ""
            w.writerow([d["phrase"], d["region"], round(avg)] + full
                       + [peak, low, len(pts)])
            n += 1
    print(f"-> {out}  ({n} фраз)")
