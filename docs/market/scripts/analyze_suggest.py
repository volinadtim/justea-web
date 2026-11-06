# -*- coding: utf-8 -*-
"""Сводка по собранным подсказкам: частота появления запроса в выдаче подсказок
и средняя позиция. Подсказки Яндекса упорядочены по популярности, поэтому
«сколько раз запрос показался» + «на какой позиции» — прокси-оценка спроса.
"""
import json, sys, collections, pathlib, re

SRC = pathlib.Path(sys.argv[1])
rows = collections.defaultdict(lambda: {"hits": 0, "pos_sum": 0, "engines": set(),
                                        "groups": set(), "seeds": set()})
nerr = 0
for line in SRC.open(encoding="utf-8"):
    d = json.loads(line)
    if "error" in d:
        nerr += 1
        continue
    for i, s in enumerate(d["suggestions"]):
        s = s.strip().lower()
        if not s:
            continue
        r = rows[s]
        r["hits"] += 1
        r["pos_sum"] += i
        r["engines"].add(d["engine"])
        r["groups"].add(d["group"])
        r["seeds"].add(d["seed"])

print(f"уникальных подсказок: {len(rows)}  ошибок запросов: {nerr}")
out = []
for q, r in rows.items():
    out.append({"query": q, "hits": r["hits"], "avg_pos": round(r["pos_sum"] / r["hits"], 2),
                "engines": sorted(r["engines"]), "groups": sorted(r["groups"]),
                "seed_count": len(r["seeds"])})
out.sort(key=lambda x: (-x["hits"], x["avg_pos"]))

dst = SRC.parent / "suggest-aggregated.json"
dst.write_text(json.dumps(out, ensure_ascii=False, indent=0), encoding="utf-8")
print("->", dst, dst.stat().st_size)

print("\n=== ТОП-40 по числу появлений ===")
for r in out[:40]:
    print(f"{r['hits']:4} поз{r['avg_pos']:5.1f}  {','.join(r['engines'])[:12]:12} {r['query'][:70]}")

print("\n=== ТОП-25 по группам ===")
for g in ["ceremony", "brewing", "teaware", "types", "varieties", "health", "commercial", "info"]:
    sel = [r for r in out if g in r["groups"]][:25]
    print(f"\n--- {g} ---")
    for r in sel:
        print(f"  {r['hits']:4} {r['query'][:68]}")
