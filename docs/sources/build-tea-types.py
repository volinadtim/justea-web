#!/usr/bin/env python3
"""Собирает data/tea-types.json из brew-mistakes.json и misconceptions.json.

Зачем скрипт, а не правка руками
--------------------------------
Контейнер — ПРОИЗВОДНОЕ от моих файлов в docs/sources/. Если его править руками,
решение начинает жить в двух местах, и правка одного не чинит другое. Это уже
случалось в проекте дважды за день (inbox #15: ответ про ISO доехал до переписки,
но не до реестра; и запись catalog с другой схемой id). Поэтому:

    контейнер не редактируют — его перегенерируют.

На выходе файл форматируется по `.prettierrc` проекта **самим сборщиком** (просьба
justea-catalog: иначе `prettier --check` ругается, а править формат руками нельзя —
потеряется при следующей сборке). Prettier для этого не нужен: его нет в
devDependencies, и опираться на `npx`, который тянет пакет из сети, значило бы
сделать сборку зависимой от сети. Где prettier всё же доступен, сборщик прогоняет
`--check`, чтобы узнать о расхождении сразу, а не из чужой ветки.

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
* каждый идентификатор источника существует в catalog.json;
* публикуемые поля не нарушают #RULE2 — ни номеров стандартов, ни иероглифов,
  ни процентов, ни фамилий с годом, ни «по стандарту»: на странице аппарата нет.
  В непубликуемых полях (`sources`, `derivation`, `caveat`) он, наоборот,
  обязателен — проверка их не трогает намеренно.

Ошибка любой проверки — выход с кодом 1 и без записи файла.
"""

import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "docs" / "sources"
OUT = ROOT / "data" / "tea-types.json"

CATEGORIES = ["all", "green", "black", "oolong", "white", "yellow", "dark"]
CONFIDENCE = {"high", "medium", "derived"}

NORM = re.compile(r"(чем нужно|слишком|неверн|перегре|правильн|ошибк|норма|нормативн)", re.I)
HEALTH = re.compile(r"(антиоксидант|польз|здоров|antioxid)", re.I)

# #RULE2 — ограждение аппарата на выходе к читателю.
#
# ПАТТЕРНЫ ПЕРЕНЕСЕНЫ ИЗ lib/plain-text.ts, и он — источник истины, а не этот
# файл. Фильтр на отрисовке (`hasApparatus`) выбрасывает запись ЦЕЛИКОМ, если
# найдёт в ней аппарат, поэтому проверять здесь надо ровно его правилом: своя
# приблизительная версия пропускает то, что он вырежет, и запись молча не
# доходит до страницы.
#
# Так и случилось: правило мне передали как «номера стандартов, иероглифы,
# проценты, фамилии, обороты «по стандарту»», и по этому описанию мои записи
# проходили. В самом фильтре есть ещё и ХИМИЯ — катехины, теанин,
# аминокислоты, EGCG, ppm. Четыре исхода из девяти, те самые, в которых были
# измерения, фильтр вырезал, и блок «Что меняет вкус» выводился без них.
# Проверять надо реализацию правила, а не его пересказ.
#
# ⚠ РИСК РАСХОЖДЕНИЯ: список скопирован, а не импортирован — Python не читает
# TypeScript. Если lib/plain-text.ts изменится, эта копия устареет молча.
# Сверять глазами при каждом касании; хеш файла записан ниже.
PLAIN_TEXT_TS = "lib/plain-text.ts"
PLAIN_TEXT_CHECKED = "origin/master 2026-11-07"

APPARATUS = [
    r"GB\s?/?\s?T\s?\d",
    r"\bISO\b",
    r"\bDB\s?53\b",
    r"\bGOST\b|\bГОСТ\b",
    r"[\u3000-\u9fff\uff00-\uffef]",            # иероглифы и китайская пунктуация
    r"\d\s?%",
    r"полифенол|катехин|теанин|EGCG|аминокислот|\bppm\b|CaCO",
    r"\b[A-Z][a-z]+\s+(?:19|20)\d\d\b",         # «Cao 2022», только латиницей
    r"\bet al\b",
    r"уровн[ьея]\s+[ABC]\b",
    r"экспертн|нормативн|по стандарт|стандарт\w*",
    r"\bAssociation\b|\bInstitute\b|\bUniversity\b",
    r"официальн\w*\s+(?:япон|китай|тайван|индий)\w*",
    r"источник(?:ов|ах|а)\b|двух источник",
    r"префектур\w*\s+[А-ЯA-Z]",
]
RULE2 = [re.compile(pat, re.I) for pat in APPARATUS]


def apparatus(text):
    """Что из аппарата найдено в строке, или None. Правило lib/plain-text.ts."""
    for pat in RULE2:
        found = pat.search(text or "")
        if found:
            return found.group(0)
    return None



PUBLISHED = ("change", "consequence", "claim", "correction")

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


PRINT_WIDTH = 80  # .prettierrc проекта
INDENT = 2        # tabWidth


def _fmt(value, indent, prefix=0):
    """JSON в формате prettier: массив в одну строку, если влезает в printWidth.

    Почему свой принтер, а не вызов prettier: его нет в devDependencies проекта, и
    опираться на `npx`, который тянет пакет из сети, значит сделать сборку зависимой
    от сети. Формат JSON у prettier детерминирован и прост — два пробела отступа и
    схлопывание в одну строку, если результат влезает в printWidth, — поэтому его
    дешевле воспроизвести, чем тащить зависимость.

    Объекты оставляю развёрнутыми: с prettier 3.5 `objectWrap` по умолчанию
    `preserve`, то есть развёрнутый объект он принимает как есть. У массивов такой
    опции нет — короткие он схлопывает всегда, и именно на них ругался
    `prettier --check` (короткие `sources` разворачивались по строкам).

    ПРОВЕРЕНО: justea-catalog прогнал `prettier --check` на выходе этого принтера
    (2026-11-08) на версиях 3.4.2 и 3.6.2 — расхождений нет, «All matched files use
    Prettier code style!». Вторая версия важна: в 3.6 `objectWrap` уже по умолчанию
    `preserve`, то есть допущение про объекты верно и там.
    """
    pad = " " * indent
    inner = " " * (indent + INDENT)

    if isinstance(value, dict):
        if not value:
            return "{}"
        parts = []
        for k, v in value.items():
            key = json.dumps(k, ensure_ascii=False)
            # prefix — то, что уже занято в строке ключом и двоеточием: prettier
            # считает длину ВСЕЙ строки, а не только значения
            parts.append("%s%s: %s" % (inner, key, _fmt(v, indent + INDENT, len(key) + 2)))
        return "{\n" + ",\n".join(parts) + "\n" + pad + "}"

    if isinstance(value, list):
        if not value:
            return "[]"
        items = [_fmt(v, indent + INDENT) for v in value]
        oneline = "[" + ", ".join(items) + "]"
        # +1 на запятую после значения: она тоже на этой строке
        if "\n" not in oneline and indent + prefix + len(oneline) + 1 <= PRINT_WIDTH:
            return oneline
        return "[\n" + ",\n".join(inner + it for it in items) + "\n" + pad + "]"

    return json.dumps(value, ensure_ascii=False)


def _outcome(r):
    """BrewOutcome для контейнера.

    `onlyFor` выносится только если он задан: по правилу seo пустой массив означает
    «ни для кого», а не «для всех», поэтому опускать поле и опустошать его — разные
    вещи, и опускать правильно.
    """
    out = {
        "id": r["id"],
        "change": r["change"],
        "consequence": r["consequence"],
        "sources": r.get("sources", []),
        "confidence": r["confidence"],
    }
    if r.get("onlyFor"):
        out["onlyFor"] = r["onlyFor"]
    return out


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
            found = apparatus(text)
            if found:
                problems.append("%s: %s вырежет фильтр lib/plain-text.ts — %r. Аппарат "
                                "убирают из публикуемого текста, но ОСТАВЛЯЮТ в sources "
                                "и derivation; запись с аппаратом не доходит до "
                                "страницы ЦЕЛИКОМ" % (rid, field, found))
        conf = r.get("confidence")
        if conf not in CONFIDENCE:
            problems.append("%s: confidence %r не из %s" % (rid, conf, sorted(CONFIDENCE)))
        if conf == "high" and not r.get("sources"):
            problems.append("%s: confidence high без источников" % rid)
        for s in r.get("sources", []):
            if s not in catalog:
                problems.append("%s: источника %r нет в catalog.json" % (rid, s))
        if "onlyFor" in r and not r["onlyFor"]:
            problems.append("%s: onlyFor пустой — по правилу seo это «ни для кого». "
                            "Для всей категории поле надо УБРАТЬ, а не опустошать" % rid)

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
        for field in ("claim", "correction"):
            found = apparatus(m.get(field))
            if found:
                problems.append("заблуждение %r: %s вырежет фильтр — %r"
                                % (m["claim"][:30], field, found))
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
                _outcome(r)
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

    OUT.write_text(_fmt(out, 0) + "\n", encoding="utf-8")
    print("записан %s" % OUT.relative_to(ROOT))
    print("brewOutcomes/misconceptions по категориям: " + counts)
    run_prettier()


def run_prettier():
    """Проверяет, что наш формат совпадает с prettier — там, где prettier доступен.

    Форматирует файл уже сам сборщик (`_fmt`), поэтому здесь не `--write`, а
    `--check`: если наш принтер где-то разойдётся с prettier, мы узнаем об этом
    сразу, а не из чужой ветки. Отсутствие prettier — не ошибка: формат и так
    применён, проверить его просто нечем.
    """
    if not shutil.which("npx"):
        print("prettier недоступен (нет npx) — формат применён сборщиком, сверить нечем")
        return
    try:
        res = subprocess.run(
            ["npx", "--no-install", "prettier", "--check", str(OUT)],
            cwd=str(ROOT), capture_output=True, text=True, timeout=120,
        )
    except subprocess.TimeoutExpired:
        print("prettier не ответил за 120 с — формат применён сборщиком, сверить нечем")
        return
    if res.returncode == 0:
        print("prettier --check пройден")
    else:
        out = (res.stdout + res.stderr)
        missing = ("could not determine executable", "missing packages",
                   "not found", "could not resolve")
        if any(t in out.lower() for t in missing):
            print("prettier не установлен — формат применён сборщиком, сверить нечем")
        else:
            print("⚠ prettier --check НЕ пройден: наш принтер разошёлся с prettier.")
            print("  Это надо починить в _fmt, а не правкой файла руками.")
            for line in out.strip().splitlines()[:3]:
                print("  " + line)


if __name__ == "__main__":
    main()
