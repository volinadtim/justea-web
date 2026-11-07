# -*- coding: utf-8 -*-
"""Спрос по страницам из плана justea-seo — в точных показах Вордстата.

Зачем отдельный скрипт. Score в ядре (`подсказки_попаданий`) — не частотность,
его нельзя сравнивать между кластерами (report.md §10). Как только появились
точные показы, порядок страниц надо пересчитать по ним. Скрипт берёт план
страниц justea-seo (`docs/seo/pages.json`, ветка `agent/seo`), сопоставляет
каждой странице головные фразы и печатает измеренный спрос.

Головные фразы заданы здесь руками и намеренно: автоматически из подкластера
их не вывести — Вордстат отдаёт фразу **в широком соответствии**, то есть
показы «пуэр» уже включают «пуэр купить» и «как заваривать пуэр». Поэтому
суммировать строки подкластера нельзя (двойной счёт), и для страницы берётся
несколько непересекающихся головных фраз.

Выход: ../page-demand.csv
"""
import csv, json, pathlib, collections

ROOT = pathlib.Path(__file__).resolve().parent.parent
FREQ = ROOT / "wordstat-raw" / "wordstat-frequencies.csv"
CORE = ROOT / "semantic-core.csv"
OUT = ROOT / "page-demand.csv"

# страница -> (подкластеры ядра, головные фразы для точного замера)
# Страницы и их score — docs/seo/pages.json (justea-seo, 2026-11-06).
PAGES = [
    ("/", "главная", 0, ["brewing-howto"],
     ["как заваривать чай"]),
    ("/tea/green", "тип: зелёный", 109, ["type-green"],
     ["зеленый чай", "как заваривать зеленый чай"]),
    ("/tea/black", "тип: чёрный", 100, ["type-black"],
     ["черный чай", "как заваривать черный чай"]),
    ("/tea/white", "тип: белый", 41, ["type-white"],
     ["белый чай", "как заваривать белый чай"]),
    ("/tea/yellow", "тип: жёлтый", 29, ["type-yellow"],
     ["желтый чай", "как заваривать желтый чай"]),
    ("/tea/oolong", "тип: улун", 209, ["type-oolong"],
     ["улун", "как заваривать улун"]),
    ("/tea/pu-erh", "тип: пуэр", 298, ["type-puerh"],
     ["пуэр", "как заваривать пуэр"]),
    ("/tea/matcha", "тип: матча", 253, ["variety-matcha"],
     ["матча польза"]),
    ("/guides/infusions", "проливы", 251, ["brewing-infusions"],
     ["пролив пуэра", "сколько раз заваривать чай", "как заваривать чай проливом",
      "что такое пролив чая"]),
    ("/guides/time", "время заваривания", 112, ["brewing-time"],
     ["сколько заваривать чай"]),
    ("/guides/thermos", "в термосе", 109, ["brewing-thermos"],
     ["как заварить чай в термосе", "как заваривать пуэр в термосе"]),
    ("/guides/gaiwan", "гайвань", 98, ["brewing-gaiwan", "teaware-gaiwan"],
     ["гайвань"]),
    ("/guides/cold-brew", "холодное заваривание", 79, ["brewing-cold"],
     ["чай холодного заваривания", "холодное заваривание зеленого чая"]),
    ("/guides/temperature", "температура", 119, ["brewing-temperature"],
     ["температура заваривания чая", "температура воды для заваривания чая"]),
    ("/guides/proportions", "пропорции", 52, ["brewing-proportions"],
     ["сколько грамм чая заваривать", "пропорции заваривания чая"]),
    ("/guides/green-vs-black", "зелёный vs чёрный", 41, [],
     ["черный или зеленый чай", "чем отличается черный чай от зеленого"]),
    ("/guides/oolong-vs-puerh", "улун vs пуэр", 26, [],
     ["чем отличается пуэр от шу пуэр"]),
    ("/guides/assam-vs-darjeeling", "ассам vs дарджилинг", 6, [],
     ["ассам или дарджилинг"]),
    ("/ceremony", "церемония СПб", 461, ["ceremony-spb-core", "ceremony-club"],
     ["чайная церемония спб", "чайная церемония петербург"]),
    ("— отменено пользователем —", "кофеин", 215, ["health-caffeine"],
     ["кофеин в чае", "сколько кофеина в чае"]),
]


def load_freq():
    f = {}
    for r in csv.DictReader(FREQ.open(encoding="utf-8-sig"), delimiter=";"):
        f[r["запрос"]] = (r["wordstat_спб"], r["wordstat_мск"], r["wordstat_рф"])
    return f


def load_core():
    """Покрытие подкластера замером: сколько строк из ядра получили частотность."""
    cov = collections.defaultdict(lambda: [0, 0])
    for r in csv.DictReader(CORE.open(encoding="utf-8-sig"), delimiter=";"):
        if r["приоритет"].startswith("P0"):
            continue
        c = cov[r["подкластер"]]
        c[0] += 1
        if r["wordstat_спб"].strip() or r["wordstat_рф"].strip():
            c[1] += 1
    return cov


def main():
    freq, cov = load_freq(), load_core()
    rows = []
    for url, label, score, subs, heads in PAGES:
        spb = msk = rf = 0
        measured, missing = [], []
        for h in heads:
            v = freq.get(h)
            if not v:
                missing.append(h)
                continue
            measured.append(h)
            spb += int(v[0] or 0)
            msk += int(v[1] or 0)
            rf += int(v[2] or 0)
        n = sum(cov[s][0] for s in subs)
        m = sum(cov[s][1] for s in subs)
        rows.append({
            "url": url, "страница": label, "score_seo": score,
            "подкластеры": " ".join(subs),
            "головные_фразы_измерено": " | ".join(measured),
            "головные_фразы_без_замера": " | ".join(missing),
            "показов_спб": spb, "показов_мск": msk, "показов_рф": rf,
            "строк_в_ядре": n, "из_них_с_частотностью": m,
            "покрытие_замером": f"{m / n * 100:.0f}%" if n else "н/п",
        })

    rows.sort(key=lambda r: -r["показов_спб"])
    with OUT.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()), delimiter=";",
                           lineterminator="\n")
        w.writeheader()
        w.writerows(rows)

    print(f"{'url':30}{'score':>6}{'спб':>8}{'мск':>8}{'рф':>9}  покрытие")
    for r in rows:
        print(f"{r['url'][:30]:30}{r['score_seo']:6}{r['показов_спб']:8}"
              f"{r['показов_мск']:8}{r['показов_рф']:9}  {r['покрытие_замером']}"
              + ("  !без замера: " + r["головные_фразы_без_замера"]
                 if r["головные_фразы_без_замера"] else ""))
    print(f"\n-> {OUT}")


if __name__ == "__main__":
    main()
