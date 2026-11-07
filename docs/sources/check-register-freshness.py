#!/usr/bin/env python3
"""Говорит, не уехали ли данные из-под отметок в field-register.json.

Зачем
-----
Замечание justea-seo: у проверки и у отметки разный срок годности. Проверка
доказывает своё утверждение заново при каждом запуске — изменятся данные, и она
упадёт. Отметка доказывает его один раз, а потом стоит, даже если под ней всё
переписали, и выглядит при этом ровно так же: «✅ проверено 2026-11-08».

Этот скрипт не делает отметку вечной — такого не бывает. Он делает её устаревание
ВИДИМЫМ, то есть ровно то, что сам реестр сделал с непроверенными полями: раньше
непроверенное было невидимо, теперь перечислено; раньше устаревшая отметка была
неотличима от свежей, теперь отличима.

Поэтому вывод «данные уехали» — это НЕ «проверка неверна». Это «проверка больше
ничего не доказывает про текущие данные, и заново её никто не прогонял».

Запуск из корня репозитория:

    python3 docs/sources/check-register-freshness.py
"""

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REGISTER = ROOT / "docs" / "sources" / "field-register.json"
DATA_PATH = "data/teas.json"


def current_blob(ref):
    """Хеш blob'а data/teas.json в указанном ref, или None если ref недоступен."""
    try:
        res = subprocess.run(["git", "rev-parse", "%s:%s" % (ref, DATA_PATH)],
                             cwd=str(ROOT), capture_output=True, text=True, timeout=30)
    except (OSError, subprocess.TimeoutExpired):
        return None
    return res.stdout.strip() if res.returncode == 0 else None


def main():
    reg = json.loads(REGISTER.read_text(encoding="utf-8"))
    scope = reg["meta"].get("scope_revision") or {}
    ref = scope.get("ref", "origin/master")
    recorded = scope.get("teas_json_blob")

    if not recorded:
        print("В реестре не записан хеш данных — сверять нечего.", file=sys.stderr)
        return 2

    now = current_blob(ref)
    if now is None:
        # Это не ошибка реестра: ref может быть не загружен в этой копии.
        print("⚠ %s недоступен (нужен git fetch?) — свежесть проверить нечем." % ref)
        print("  Записанный хеш: %s" % recorded)
        return 0

    rows = [(r.get("path"), r.get("checked"), r.get("data_revision"))
            for r in reg.get("checked", []) + reg.get("checked_now", [])]

    if now == recorded:
        print("✅ Данные те же, что при проверке (%s, blob %s)." % (ref, now[:12]))
        print("   Отметок, стоящих на этих данных: %d." % len(rows))
        stale = [p for p, _, rev in rows if rev and rev != recorded]
        if stale:
            print("   Но отдельные строки отмечены по ДРУГОЙ ревизии:")
            for p in stale:
                print("     • %s" % p)
        return 0

    print("⚠ ДАННЫЕ УЕХАЛИ из-под отметок.")
    print("   при проверке: %s" % recorded)
    print("   сейчас в %s: %s" % (ref, now))
    print()
    print("   Это не значит, что проверки были неверны. Это значит, что они")
    print("   больше ничего не доказывают про текущие данные. Под сомнением")
    print("   каждая отметка, стоящая на старой ревизии:")
    for path, checked, rev in rows:
        if rev == recorded or rev is None:
            print("     • %-58s отмечено %s" % (path, checked))
    print()
    print("   Что увидеть первым — какие поля вообще изменились:")
    print("     git diff %s..%s -- %s" % (recorded[:12], now[:12], DATA_PATH))
    return 1


if __name__ == "__main__":
    sys.exit(main())
