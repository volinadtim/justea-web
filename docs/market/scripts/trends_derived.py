# -*- coding: utf-8 -*-
"""Машиночитаемая выжимка из сырых данных Google Trends: уровень, тренд,
сезонный индекс по месяцам, топ-гео, related queries."""
import json, statistics, collections, pathlib, datetime

ROOT = pathlib.Path("/home/volin/projects/justea-corp/justea-web-market/docs/market/wordstat-raw")
raw = json.loads((ROOT / "google-trends-raw.json").read_text(encoding="utf-8"))
out = {"_meta": {
    "источник": "Google Trends, публичный widget-API (trends.google.com/trends/api)",
    "снято": "2026-11-06",
    "как_читать": ("value — относительный индекс Google Trends внутри одного среза: 100 = пик "
                   "по всем словам и всей шкале времени этого среза. Между срезами числа "
                   "НЕ сравнимы. сезонный_индекс = средний уровень месяца / средний уровень "
                   "за весь период × 100."),
    "оговорка_cn": ("Для geo=CN Google Trends непригоден: Google в Китае заблокирован, "
                    "выборка крошечная и шумная (видно по нулям в отдельных месяцах). "
                    "Корректный источник по Китаю — Baidu Index / 5118, нужен вход в аккаунт."),
}, "срезы": {}}

for label, e in raw.items():
    rec = {"гео": e["geo"] or "мир", "таймфрейм": e["timeframe"],
           "слова": e["keywords"], "ошибки": e["errors"], "ряды": {}, "гео_топ": {}, "related": {}}
    w = e["data"].get("TIMESERIES")
    if w:
        tl = w["default"]["timelineData"]
        times = [datetime.datetime.fromtimestamp(int(p["time"]), datetime.UTC) for p in tl]
        rec["период"] = f"{times[0]:%Y-%m-%d}..{times[-1]:%Y-%m-%d}"
        for i, k in enumerate(e["keywords"]):
            v = [p["value"][i] for p in tl if i < len(p["value"])]
            if not v: continue
            q = len(v) // 4
            a, b = statistics.mean(v[:q]), statistics.mean(v[-q:])
            bym = collections.defaultdict(list)
            for t_, x in zip(times, v): bym[t_.month].append(x)
            avg = statistics.mean(v) or 1
            rec["ряды"][k] = {
                "средний_уровень": round(avg, 1), "максимум": max(v), "последняя_точка": v[-1],
                "первая_четверть_периода": round(a, 1), "последняя_четверть_периода": round(b, 1),
                "изменение_проц": None if a == 0 else round((b - a) / a * 100, 1),
                "сезонный_индекс": {f"{m:02d}": round(statistics.mean(xs) / avg * 100)
                                     for m, xs in sorted(bym.items())},
            }
    for wid, wd in e["data"].items():
        if wid.startswith("GEO_MAP"):
            gl = wd["default"].get("geoMapData", [])
            top = [{"регион": g["geoName"], "индекс": g["value"][0]}
                   for g in gl if g.get("hasData", [False])[0]][:12]
            if top: rec["гео_топ"][wid] = top
        if wid.startswith("RELATED_QUERIES"):
            rl = wd["default"].get("rankedList", [])
            d = {}
            for i, lst in enumerate(rl):
                key = "топ" if i == 0 else "растущие"
                items = [{"запрос": x["query"], "значение": x["formattedValue"]}
                         for x in lst.get("rankedKeyword", [])][:20]
                if items: d[key] = items
            if d: rec["related"][wid] = d
    out["срезы"][label] = rec

dst = ROOT / "google-trends-derived.json"
dst.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
print("->", dst, dst.stat().st_size)
