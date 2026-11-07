# -*- coding: utf-8 -*-
"""Доходит ли текстовое поле до читателя.

Запуск из корня репозитория, после `pnpm run build`:
    python3 docs/voice/tools/check-field-reach.py

Метод justea-catalog: искать не упоминание поля в коде, а его ЗНАЧЕНИЯ в
собранных страницах. Значение ищется на СВОЕЙ странице — иначе короткие
дескрипторы вроде «Каштан» ложно находятся на чужих.
"""
import json, re, html, os, sys

def visible(p):
    s = open(p, encoding="utf-8", errors="replace").read()
    s = re.sub(r"<script\b.*?</script>", " ", s, flags=re.S | re.I)
    s = re.sub(r"<style\b.*?</style>", " ", s, flags=re.S | re.I)
    return html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", s)))

def raw(p):
    return re.sub(r"\s+", " ", open(p, encoding="utf-8", errors="replace").read())

def norm(t):
    return re.sub(r"\s+", " ", t).strip()

def collect(node, path, out):
    if isinstance(node, dict):
        for k, v in node.items():
            if k.startswith("$"):
                continue
            collect(v, f"{path}.{k}" if path else k, out)
    elif isinstance(node, list):
        for v in node:
            collect(v, path + "[]", out)
    elif isinstance(node, str) and node.strip():
        out.append((path, node))

teas = json.load(open("data/teas.json"))
tally = {}
for t in teas:
    page = f".next/server/app/{t['slug']}.html"
    if not os.path.exists(page):
        print("нет страницы:", t["slug"], file=sys.stderr); continue
    v, r = visible(page), raw(page)
    items = []
    collect(t, "", items)
    for path, val in items:
        n = norm(val)
        if len(n) < 4:
            continue
        st = "виден" if n in v else ("разметка" if n in r else "нет")
        c = tally.setdefault(path, {"виден": 0, "разметка": 0, "нет": 0})
        c[st] += 1

print("%-44s %6s %9s %5s  %s" % ("поле", "виден", "разметка", "нет", "вердикт"))
for path in sorted(tally):
    c = tally[path]
    tot = sum(c.values())
    if c["виден"] == tot: verdict = "ВИДЕН"
    elif c["виден"]: verdict = "виден частично (%d из %d)" % (c["виден"], tot)
    elif c["разметка"]: verdict = "только в разметке"
    else: verdict = "НЕ ДОХОДИТ"
    print("%-44s %6d %9d %5d  %s" % (path, c["виден"], c["разметка"], c["нет"], verdict))
