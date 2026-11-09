# -*- coding: utf-8 -*-
"""Сводка по Google Trends: средний/последний уровень, тренд, сезонность по месяцам,
топ-регионы, related queries (top/rising)."""
import json, sys, statistics, collections, pathlib, datetime

RAW = pathlib.Path(sys.argv[1])
d = json.loads(RAW.read_text(encoding="utf-8"))

def series(entry, widget_id="TIMESERIES"):
    w = entry["data"].get(widget_id)
    if not w: return None
    tl = w["default"]["timelineData"]
    kws = entry["keywords"]
    out = {k: [] for k in kws}
    times = []
    for pt in tl:
        times.append(datetime.datetime.utcfromtimestamp(int(pt["time"])))
        for i, k in enumerate(kws):
            out[k].append(pt["value"][i] if i < len(pt["value"]) else None)
    return times, out

def trend(vals):
    v = [x for x in vals if x is not None]
    if len(v) < 8: return None
    first, last = v[:len(v)//4], v[-len(v)//4:]
    a, b = statistics.mean(first), statistics.mean(last)
    return a, b, (None if a == 0 else round((b - a) / a * 100, 1))

for label in d:
    e = d[label]
    s = series(e)
    print(f"\n{'='*78}\n{label}  geo={e['geo'] or 'мир'}  {e['timeframe']}")
    if e["errors"]: print(f"  !! ошибки: {e['errors']}")
    if s:
        times, vals = s
        print(f"  точек: {len(times)}  с {times[0]:%Y-%m} по {times[-1]:%Y-%m}")
        for k, v in vals.items():
            t = trend(v)
            vv = [x for x in v if x is not None]
            if not vv: continue
            tr = f"первая четверть {t[0]:.0f} -> последняя {t[1]:.0f} ({t[2]:+.0f}%)" if t and t[2] is not None else "н/д"
            print(f"    {k:14} сред={statistics.mean(vv):5.1f} макс={max(vv):3} посл={vv[-1]:3}  {tr}")
        # сезонность по месяцам (нормировка на среднее)
        for k, v in vals.items():
            bym = collections.defaultdict(list)
            for t_, x in zip(times, v):
                if x is not None: bym[t_.month].append(x)
            if not bym: continue
            avg = statistics.mean([x for x in v if x is not None]) or 1
            idx = {m: round(statistics.mean(xs) / avg * 100) for m, xs in sorted(bym.items())}
            print(f"    сезонность {k:14} " + " ".join(f"{m:02d}:{i:3}" for m, i in idx.items()))
    # гео
    for wid in e["data"]:
        if wid.startswith("GEO_MAP"):
            gl = e["data"][wid]["default"].get("geoMapData", [])
            top = [(g["geoName"], g["value"][0]) for g in gl if g.get("hasData", [False])[0]][:8]
            if top: print(f"    [{wid}] топ-гео: " + ", ".join(f"{n}={v}" for n, v in top))
    for wid in sorted(e["data"]):
        if wid.startswith("RELATED_QUERIES"):
            rl = e["data"][wid]["default"]["rankedList"]
            for i, lst in enumerate(rl):
                kind = "TOP  " if i == 0 else "RISE "
                items = [(x["query"], x["formattedValue"]) for x in lst["rankedKeyword"]][:12]
                print(f"    [{wid}] {kind}" + "; ".join(f"{q} ({v})" for q, v in items))
