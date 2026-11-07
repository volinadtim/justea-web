#!/usr/bin/env python3
"""Собирает data/tea-types.json из brew-mistakes.json и misconceptions.json.

Зачем скрипт, а не правка руками
--------------------------------
Контейнер — ПРОИЗВОДНОЕ от моих файлов в docs/sources/. Если его править руками,
решение начинает жить в двух местах, и правка одного не чинит другое. Это уже
случалось в проекте дважды за день (inbox #15: ответ про ISO доехал до переписки,
но не до реестра; и запись catalog с другой схемой id). Поэтому:

    контейнер не редактируют — его перегенерируют.

Запуск из корня репозитория:

    python3 docs/sources/build-tea-types.py          # записать data/tea-types.json
    python3 docs/sources/build-tea-types.py --check  # только проверить, ничего не писать

Что проверяется перед записью (всё — требования из types/tea.ts у justea-seo)
----------------------------------------------------------------------------
* каждый `replaces` указывает на существующий `id` — валидатор seo падает на
  ссылке в пустоту, иначе отменяемое правило молча осталось бы рядом с отменяющим;
* `consequence` начинается с заглавной буквы — на странице это отдельное
  предложение после `change`;
* `change` не содержит нормы («чем нужно», «слишком», «неверно», «ошибка»):
  по Cao 2022 нормы нет, и такая формулировка вернула бы её;
* ни в `change`, ни в `consequence` нет темы здоровья («антиоксидант», «польза»):
  для читателя это значит «полезно» — тема, которой у нас нет;
* `confidence` из {high, medium, derived}, и при `high` обязательны источники:
  high без источника — это derived, назвавшийся измеренным;
* каждый идентификатор источника существует в catalog.json.

Ошибка любой проверки — выход с кодом 1 и без записи файла.
"""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "docs" / "sources"
OUT = ROOT / "data" / "tea-types.json"

CATEGORIES = ["all", "green", "black", "oolong", "white", "yellow", "dark"]
CONFIDENCE = {"high", "medium", "derived"}

NORM = re.compile(r"(чем нужно|слишком|неверн|перегре|правильн|ошибк|норма|нормативн)", re.I)
HEALTH = re.compile(r"(антиоксидант|польз|здоров|antioxid)", re.I)

COMMENT = (
    "СОБРАН СКРИПТОМ, РУКАМИ НЕ ПРАВИТЬ. Источник — docs/sources/brew-mistakes.json и "
    "docs/sources/misconceptions.json у justea-sources; сборщик — docs/sources/build-tea-types.py. "
    "Правка здесь будет потеряна при следующей сборке, и, что хуже, разойдётся с источником — "
    "решение начнёт жить в двух местах. Нужно изменить факт: правьте brew-mistakes.json и "
    "перезапустите сборку. Ключ all — для того, что от категории не зависит вовсе (навеска в обе "
    "стороны и вода): заводить такие записи по шести категориям значит завести шесть мест для "
    "одной правки. Записи уровня СОРТА (исключения с replaces и заблуждения о конкретном чае) "
    "сюда НЕ идут — им место в data/teas.json. Форма полей — types/tea.ts, BrewOutcome и "
    "Misconception. Рамка: блок не утверждает «вы заварили неправильно» — по Cao 2022 "
    "рекомендованная навеска различается в 1,7 раза между новичком и ежедневно пьющим, и обе "
    "названы рекомендуемыми."
)


def fail(problems):
    print("СБОРКА НЕ ВЫПОЛНЕНА, проблем: %d" % len(problems), file=sys.stderr)
    for p in problems:
        print("  • " + p, file=sys.stderr)
    sys.exit(1)


def main():
    check_only = "--check" in sys.argv

    brew = json.loads((SRC / "brew-mistakes.json").read_text(encoding="utf-8"))
    misc = json.loads((SRC / "misconceptions.json").read_text(encoding="utf-8"))
    catalog = json.loads((SRC / "catalog.json").read_text(encoding="utf-8"))["sources"]

    records = brew["categoryRecords"]
    ids = {r["id"] for r in records}
    problems = []

    # --- проверки записей уровня категории
    for r in records:
        rid = r["id"]
        scope = r["scope"]
        if scope not in CATEGORIES:
            problems.append("%s: scope %r не из %s" % (rid, scope, CATEGORIES))
        if not rid.startswith("brew/%s/" % scope):
            problems.append("%s: id не согласован со scope %r" % (rid, scope))
        if not r["consequence"][:1].isupper():
            problems.append("%s: consequence не с заглавной буквы" % rid)
        for field in ("change", "consequence"):
            text = r.get(field) or ""
            if NORM.search(text):
                problems.append("%s: %s содержит норму — %r" % (rid, field, NORM.search(text).group(0)))
            if HEALTH.search(text):
                problems.append("%s: %s содержит тему здоровья — %r" % (rid, field, HEALTH.search(text).group(0)))
        conf = r.get("confidence")
        if conf not in CONFIDENCE:
            problems.append("%s: confidence %r не из %s" % (rid, conf, sorted(CONFIDENCE)))
        if conf == "high" and not r.get("sources"):
            problems.append("%s: confidence high без источников" % rid)
        for s in r.get("sources", []):
            if s not in catalog:
                problems.append("%s: источника %r нет в catalog.json" % (rid, s))

    # --- проверки исключений уровня сорта: сюда не попадают, но replaces обязан указывать на запись
    for e in brew.get("teaExceptions", []):
        if e["replaces"] not in ids:
            problems.append("исключение %s: replaces %r не находит записи" % (e["slug"], e["replaces"]))

    # --- заблуждения уровня категории
    cat_misc = [m for m in misc["misconceptions"]
                if m.get("applies_to_type") and not m.get("applies_to_slug")]
    for m in cat_misc:
        if m["applies_to_type"] not in CATEGORIES:
            problems.append("заблуждение %r: тип %r не из %s" % (m["claim"][:30], m["applies_to_type"], CATEGORIES))
        if not m.get("sources"):
            problems.append("заблуждение %r: нет источников (обязательны)" % m["claim"][:30])
        for s in m.get("sources", []):
            if s not in catalog:
                problems.append("заблуждение %r: источника %r нет в catalog.json" % (m["claim"][:30], s))

    if problems:
        fail(problems)

    # --- сборка
    out = {"$comment": COMMENT}
    for cat in CATEGORIES:
        out[cat] = {
            "brewOutcomes": [
                {
                    "id": r["id"],
                    "change": r["change"],
                    "consequence": r["consequence"],
                    "sources": r.get("sources", []),
                    "confidence": r["confidence"],
                }
                for r in records if r["scope"] == cat
            ],
            "misconceptions": [
                {
                    "claim": m["claim"],
                    "correction": m["correction"],
                    "sources": m["sources"],
                    "kind": m["kind"],
                }
                for m in cat_misc if m["applies_to_type"] == cat
            ],
        }

    counts = ", ".join(
        "%s %d/%d" % (c, len(out[c]["brewOutcomes"]), len(out[c]["misconceptions"]))
        for c in CATEGORIES
    )
    if check_only:
        print("проверки пройдены; было бы записано (brewOutcomes/misconceptions): " + counts)
        return

    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("записан %s" % OUT.relative_to(ROOT))
    print("brewOutcomes/misconceptions по категориям: " + counts)


if __name__ == "__main__":
    main()
