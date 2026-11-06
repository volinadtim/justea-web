# -*- coding: utf-8 -*-
"""Google Trends: interest-over-time и related queries через публичный widget-API.

Handshake: cookie с trends.google.com -> /trends/api/explore (токены виджетов) ->
/trends/api/widgetdata/{multiline,relatedsearches,comparedgeo}.
Выход: JSON с сырыми ответами. Идём через VPN-proxy (зарубежный сервис).
"""
import json, sys, time, random, pathlib
import requests

OUT = pathlib.Path(sys.argv[1]); OUT.parent.mkdir(parents=True, exist_ok=True)
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
S = requests.Session()
S.headers.update({"User-Agent": UA, "Accept-Language": "ru,en;q=0.8"})


def warm():
    S.get("https://trends.google.com/trends/?geo=RU", timeout=25)
    S.get("https://trends.google.com/", timeout=25)
    print("cookies:", list(S.cookies.get_dict().keys()), flush=True)


def _j(txt):
    # ответы начинаются с ")]}'," или ")]}'\n"
    i = txt.find("{")
    return json.loads(txt[i:])


def explore(keywords, geo, timeframe, tz=-180):
    req = {"comparisonItem": [{"keyword": k, "geo": geo, "time": timeframe} for k in keywords],
           "category": 0, "property": ""}
    r = S.get("https://trends.google.com/trends/api/explore",
              params={"hl": "ru", "tz": tz, "req": json.dumps(req, ensure_ascii=False)},
              timeout=30)
    if r.status_code != 200:
        raise RuntimeError(f"explore {r.status_code}: {r.text[:160]}")
    return _j(r.text)["widgets"]


def widget(w, kind, tz=-180):
    path = {"TIMESERIES": "multiline", "RELATED_QUERIES": "relatedsearches",
            "RELATED_TOPICS": "relatedsearches", "GEO_MAP": "comparedgeo"}[kind]
    r = S.get(f"https://trends.google.com/trends/api/widgetdata/{path}",
              params={"hl": "ru", "tz": tz, "req": json.dumps(w["request"], ensure_ascii=False),
                      "token": w["token"]}, timeout=30)
    if r.status_code != 200:
        raise RuntimeError(f"{path} {r.status_code}: {r.text[:160]}")
    return _j(r.text)


# что снимаем: (метка, [запросы], гео, таймфрейм)
QUERIES = [
    ("ru-types-5y",      ["зеленый чай", "черный чай", "пуэр", "матча", "улун"], "RU", "today 5-y"),
    ("ru-tea-ceremony",  ["чайная церемония", "чайный клуб", "гунфу ча"], "RU", "today 5-y"),
    ("ru-brewing",       ["как заваривать чай", "гайвань", "типот"], "RU", "today 5-y"),
    ("ru-tea-12m",       ["чай"], "RU", "today 12-m"),
    ("ru-tea-5y",        ["чай"], "RU", "today 5-y"),
    ("ru-matcha-5y",     ["матча"], "RU", "today 5-y"),
    ("us-types-5y",      ["green tea", "black tea", "puer tea", "matcha", "oolong tea"], "US", "today 5-y"),
    ("us-ceremony-5y",   ["tea ceremony", "gongfu cha", "gaiwan"], "US", "today 5-y"),
    ("jp-types-5y",      ["緑茶", "抹茶", "ほうじ茶", "烏龍茶", "紅茶"], "JP", "today 5-y"),
    ("jp-ceremony-5y",   ["茶道", "茶会"], "JP", "today 5-y"),
    ("cn-types-5y",      ["绿茶", "普洱茶", "乌龙茶", "白茶", "红茶"], "CN", "today 5-y"),
    ("cn-ceremony-5y",   ["茶道", "功夫茶"], "CN", "today 5-y"),
    ("world-tea-5y",     ["tea"], "", "today 5-y"),
]

warm()
res = {}
for label, kws, geo, tf in QUERIES:
    entry = {"keywords": kws, "geo": geo, "timeframe": tf, "fetched_at": None, "data": {}, "errors": []}
    try:
        ws = explore(kws, geo, tf)
        entry["fetched_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        for w in ws:
            kind = w.get("id", "").split("_")[0]
            if kind not in ("TIMESERIES", "RELATED", "GEO"):
                continue
            k = w["id"]
            try:
                if k.startswith("TIMESERIES"):
                    entry["data"][k] = widget(w, "TIMESERIES")
                elif k.startswith("RELATED_QUERIES"):
                    entry["data"][k] = widget(w, "RELATED_QUERIES")
                elif k.startswith("GEO_MAP"):
                    entry["data"][k] = widget(w, "GEO_MAP")
            except Exception as e:
                entry["errors"].append(f"{k}: {type(e).__name__}: {e}"[:220])
            time.sleep(1.2 + random.random())
    except Exception as e:
        entry["errors"].append(f"explore: {type(e).__name__}: {e}"[:300])
    res[label] = entry
    got = len(entry["data"]); err = len(entry["errors"])
    print(f"{label:18} widgets={got} errors={err} {entry['errors'][:1]}", flush=True)
    time.sleep(2.5 + random.random() * 2)

OUT.write_text(json.dumps(res, ensure_ascii=False, indent=1), encoding="utf-8")
print("OUT", OUT, OUT.stat().st_size)
