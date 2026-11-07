#!/usr/bin/env python3
"""Падает, если текст, выведенный из оборота, вернулся в данные.

Зачем это отдельно от остальных проверок
----------------------------------------
Все прочие проверки проекта ловят ПРИСУТСТВИЕ запрещённого: аппарат
(`lib/plain-text.ts`), длинное тире, химию, параметр из метода оценки. Ни одна
не ловит ПОТЕРЮ ВЕРНОГО — и правильная версия строки, и ошибочная проходят их
одинаково. Поэтому откат правки проходит молча.

Дыра доказывается построением, а не случаем. Из 38 выведенных из оборота
текстов ЧЕТЫРЕ не ловит ни одна существующая проверка: подставьте любой в
данные, и фильтр, тире, химия и параметр из метода оценки промолчат. Это
проверяемо за минуту.

Повод завести файл был другой и оказался ошибочным: мне сообщили, что правка
приёма у Би Ло Чуня была в master и откатилась мержем. Автор сообщения сам его
отозвал — строка на месте, а коммиты, по которым он проследил откат, оказались
старше его собственного. Подтверждённого отката в проекте НЕТ, и механика
«мерж с устаревшей базой молча теряет верную строку» остаётся гипотезой.

Файл от этого не перестаёт быть нужным, но обоснован он отсутствием проверки,
а не происшествием. Разница практическая: иначе следующий пойдёт искать в
истории откат, которого не было.

Почему этот список не стареет, в отличие от файлов формулировок
--------------------------------------------------------------
Запись «вот как надо написать» живёт до первой лучшей версии: из 23 моих
формулировок через сутки применима была одна, а 21 откатила бы работу voice.
Запись «вот так больше никогда» не стареет: текст, выведенный из оборота за
неверный признак или за выдуманное происхождение, остаётся неверным навсегда.

Поэтому хранить надо не «что написать», а «что больше не писать».

Запуск из корня репозитория:

    python3 docs/sources/check-retired-texts.py              # origin/master
    python3 docs/sources/check-retired-texts.py --ref HEAD   # рабочая копия
"""

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REGISTRY = ROOT / "docs" / "sources" / "retired-texts.json"
SCAN = [ROOT / "data" / "teas.json", ROOT / "data" / "tea-types.json"]


def strings(node):
    """Все строки внутри структуры, с путями."""
    if isinstance(node, str):
        yield "", node
    elif isinstance(node, dict):
        for key, value in node.items():
            for path, text in strings(value):
                yield (key + "." + path if path else key), text
    elif isinstance(node, list):
        for i, value in enumerate(node):
            for path, text in strings(value):
                yield ("[%d]%s" % (i, "." + path if path else "")), text


def from_ref(ref, rel):
    """Содержимое файла в указанном ref, или None."""
    try:
        res = subprocess.run(["git", "show", "%s:%s" % (ref, rel)],
                             cwd=str(ROOT), capture_output=True, text=True, timeout=30)
    except (OSError, subprocess.TimeoutExpired):
        return None
    return res.stdout if res.returncode == 0 else None


def main():
    """По умолчанию проверяется origin/master, а не рабочая копия.

    Первый прогон этого скрипта нашёл регрессию в моей собственной ветке: в ней
    лежит `data/teas.json` того состояния, в котором ветку отрезали, и один
    выведенный из оборота текст там, разумеется, ещё есть. Это не регрессия
    прода, а устаревшая копия — но выглядело одинаково.

    Проверка, которая кричит о волках, перестаёт работать через два прогона.
    Поэтому ref печатается всегда, а рабочая копия проверяется только по
    явной просьбе: `--ref HEAD`.
    """
    ref = "origin/master"
    argv = sys.argv[1:]
    if "--ref" in argv:
        ref = argv[argv.index("--ref") + 1]

    registry = json.loads(REGISTRY.read_text(encoding="utf-8"))
    retired = {r["text"]: r for r in registry["retired"]}

    found = []
    checked = 0
    for path in SCAN:
        rel = str(path.relative_to(ROOT))
        if ref in ("HEAD", "working", "."):
            if not path.exists():
                continue
            raw = path.read_text(encoding="utf-8")
        else:
            raw = from_ref(ref, rel)
            if raw is None:
                print("⚠ %s:%s недоступен (нужен git fetch?)" % (ref, rel))
                continue
        data = json.loads(raw)
        for where, text in strings(data):
            checked += 1
            if text in retired:
                found.append((path.name, where, retired[text]))

    # Знаменатель печатается всегда: «ноль» без него — описание охвата,
    # а не результат. Правило оркестратора 2026-11-08.
    print("ref: %s" % ref)
    print("проверено строк: %d, выведенных из оборота текстов: %d" % (checked, len(retired)))

    if not found:
        print("✅ ни один выведенный из оборота текст не вернулся")
        return 0

    print("\n⚠ РЕГРЕССИЯ: вернулся текст, удалённый по причине", file=sys.stderr)
    for name, where, record in found:
        print("\n  %s :: %s" % (name, where), file=sys.stderr)
        print("    вид: %s" % record["kind"], file=sys.stderr)
        print("    причина удаления: %s" % record["reason"], file=sys.stderr)
        print("    текст: %s" % record["text"][:110], file=sys.stderr)
    print("\n  Это не новая работа, а откат. Проверьте мерж, а не текст.", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
