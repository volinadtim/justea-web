# -*- coding: utf-8 -*-
"""Добор виджетов Google Trends, упавших по 429/500 в основном прогоне."""
import json, sys, time, random, pathlib, requests

RAW = pathlib.Path("/home/volin/projects/justea-corp/justea-web-market/docs/market/wordstat-raw/google-trends-raw.json")
res = json.loads(RAW.read_text(encoding="utf-8"))
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
S = requests.Session(); S.headers.update({"User-Agent": UA, "Accept-Language": "ru,en;q=0.8"})
S.get("https://trends.google.com/trends/?geo=RU", timeout=25)

def _j(t): return json.loads(t[t.find("{"):])

def explore(kws, geo, tf, tz=-180):
    req = {"comparisonItem": [{"keyword": k, "geo": geo, "time": tf} for k in kws], "category": 0, "property": ""}
    r = S.get("https://trends.google.com/trends/api/explore",
              params={"hl": "ru", "tz": tz, "req": json.dumps(req, ensure_ascii=False)}, timeout=30)
    r.raise_for_status(); return _j(r.text)["widgets"]

def widget(w, tz=-180):
    path = "multiline" if w["id"].startswith("TIMESERIES") else \
           "comparedgeo" if w["id"].startswith("GEO_MAP") else "relatedsearches"
    r = S.get(f"https://trends.google.com/trends/api/widgetdata/{path}",
              params={"hl": "ru", "tz": tz, "req": json.dumps(w["request"], ensure_ascii=False),
                      "token": w["token"]}, timeout=30)
    if r.status_code != 200: raise RuntimeError(f"{path} {r.status_code}")
    return _j(r.text)

for label, e in res.items():
    if not e["errors"]:
        continue
    missing = [err.split(":")[0] for err in e["errors"] if not err.startswith("explore")]
    if not missing:
        continue
    print(label, "добираю:", missing, flush=True)
    try:
        ws = {w["id"]: w for w in explore(e["keywords"], e["geo"], e["timeframe"])}
    except Exception as ex:
        print("  explore упал:", ex); continue
    still = []
    for mid in missing:
        w = ws.get(mid)
        if not w:
            still.append(f"{mid}: виджета нет в новом explore"); continue
        for attempt in range(4):
            try:
                e["data"][mid] = widget(w); print("  ok", mid, flush=True); break
            except Exception as ex:
                if attempt == 3: still.append(f"{mid}: {ex}"); print("  fail", mid, ex, flush=True)
                else: time.sleep(12 + attempt * 12 + random.random() * 5)
        time.sleep(6 + random.random() * 4)
    e["errors"] = [er for er in e["errors"] if er.startswith("explore")] + still
    time.sleep(10 + random.random() * 5)

RAW.write_text(json.dumps(res, ensure_ascii=False, indent=1), encoding="utf-8")
print("\nитог по ошибкам:")
for label, e in res.items():
    print(f"  {label:18} widgets={len(e['data'])} errors={e['errors']}")
