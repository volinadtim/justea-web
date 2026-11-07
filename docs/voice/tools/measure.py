#!/usr/bin/env python3
"""Считает частоты знаков препинания в текстах авторов-образцов.

Зачем: профиль пунктуации автора нужно знать числом, а не на слух, и числа
должны пересчитываться из тех же файлов любым, кто откроет репозиторий.

Запуск:
    python3 fetch_corpus.py              # скачать источники в ./corpus
    python3 measure.py corpus            # посчитать и напечатать таблицы

Вывод: markdown-таблицы в stdout и measurements.json рядом с корпусом.
Текст на вход — уже извлечённый из HTML (это делает fetch_corpus.py).
"""

import json
import os
import re
import sys
from collections import Counter

# Знаки, которые нас различают. Ключ — что считаем, значение — как это
# называется в отчёте.
MARKS = {
    "emdash": "—",
    "endash": "–",
    "hyphen": "-",
    "semicolon": ";",
    "colon": ":",
    "guillemet_open": "«",
    "german_open": "„",
    "straight_quote": '"',
    "exclam": "!",
    "question": "?",
}

SENT_END = re.compile(r"[.!?…]+[\s\"»“]*")
ELLIPSIS = re.compile(r"…|\.{3,}")
GUILLEMET = re.compile(r"«([^»]{1,80})»")


def counts(text):
    """Частоты на 10 000 знаков плюс длина предложения."""
    n = len(text)
    if n == 0:
        return None
    c = Counter(text)
    out = {"chars": n}
    for key, ch in MARKS.items():
        out[key] = round(c[ch] / n * 10000, 1)
    # «--» как замена длинного тире: считаем отдельно, это признак порчи ASCII
    out["double_hyphen"] = round(text.count("--") / n * 10000, 1)
    # Длинное тире в русском тексте разные издания набирают то знаком «—», то
    # «–»: на royallib.com это различается от книги к книге. Поэтому считаем и
    # сумму — иначе сравниваются наборщики, а не авторы. Составляющие оставлены
    # в выводе: по ним видно, какой знак выбрало издание.
    out["dash_ru"] = round((c["—"] + c["–"]) / n * 10000, 1)
    # «Ёлочки» у Пришвина — примета стиля: он берёт в них отдельное слово как
    # чужое. Но в книгах миниатюр издание набирает ЗАГЛАВНЫМИ и в кавычках
    # названия разделов («ВЕСНА СВЕТА»), и они попадают в тот же счёт. Считаем
    # отдельно закавыченное, которое не целиком прописное: это авторская
    # привычка, а не оглавление.
    quoted = GUILLEMET.findall(text)
    words = [q for q in quoted if not (len(q) > 2 and q == q.upper())]
    out["guillemet_word"] = round(len(words) / n * 10000, 1)
    # многоточие пишут и знаком «…», и тремя точками — в разных изданиях по-разному,
    # поэтому считаем оба вида как одно многоточие, иначе издание сравнивается с
    # набором, а не с автором
    out["ellipsis"] = round(len(ELLIPSIS.findall(text)) / n * 10000, 1)
    # «ё» нормируем на «е», иначе число зависит от размера выборки
    e = c["е"] + c["Е"]
    yo = c["ё"] + c["Ё"]
    out["yo_per_1000_e"] = round(yo / e * 1000, 1) if e else 0.0
    out["yo_abs"] = yo
    sentences = [s for s in SENT_END.split(text) if s.strip()]
    if sentences:
        words = [len(s.split()) for s in sentences]
        out["sentences"] = len(sentences)
        out["words_per_sentence"] = round(sum(words) / len(words), 1)
        out["chars_per_sentence"] = round(sum(len(s) for s in sentences) / len(sentences), 1)
    return out


# Признаки служебного текста: интерфейс читалки, CSS, скрипты, навигация.
# Такой текст выглядит как текст и молча разбавляет выборку: панель настроек
# royallib составляла четверть файла, и все частоты оказались занижены на
# четверть. Поэтому доля служебного считается при каждом замере.
SERVICE = re.compile(
    r"\d+px|\d+%|z-index|font-size|position:\s*fixed|\{[^}]*;[^}]*\}"
    r"|Оцените книгу|Поделиться книгой|Ширина текста|Конец книги"
    r"|Добавить в|Настройки|Оглавление",
    re.I)


def service_share(text):
    """Доля строк, похожих на интерфейс, а не на текст произведения."""
    lines = [l for l in text.split("\n") if l.strip()]
    if not lines:
        return 0.0
    bad = sum(1 for l in lines if SERVICE.search(l))
    return round(bad / len(lines) * 100, 1)


def load(corpus_dir):
    """Группирует файлы корпуса по автору и изданию через manifest.json."""
    manifest_path = os.path.join(corpus_dir, "manifest.json")
    with open(manifest_path) as f:
        manifest = json.load(f)
    groups = {}
    for entry in manifest["texts"]:
        path = os.path.join(corpus_dir, entry["file"])
        if not os.path.exists(path) or os.path.getsize(path) == 0:
            print(f"# пропущен (нет файла): {entry['file']}", file=sys.stderr)
            continue
        with open(path) as f:
            text = f.read()
        share = service_share(text)
        if share >= 2.0:
            print(f"# ВНИМАНИЕ: в {entry['file']} похоже на интерфейс {share}% строк — "
                  f"проверьте извлечение, иначе частоты будут занижены", file=sys.stderr)
        key = (entry["author"], entry["edition"])
        groups.setdefault(key, {"texts": [], "works": []})
        groups[key]["texts"].append(text)
        groups[key]["works"].append(entry.get("work", entry["file"]))
        if entry.get("profile"):
            prof = (entry["author"], "профиль")
            groups.setdefault(prof, {"texts": [], "works": []})
            groups[prof]["texts"].append(text)
            groups[prof]["works"].append(entry.get("work", entry["file"]))
    return {k: {"text": "\n".join(v["texts"]), "works": v["works"]} for k, v in groups.items()}


ROWS = [
    ("тире, всего", "dash_ru"),
    ("из них «—»", "emdash"),
    ("из них «–»", "endash"),
    ("`--` вместо тире", "double_hyphen"),
    ("точка с запятой", "semicolon"),
    ("двоеточие", "colon"),
    ("многоточие", "ellipsis"),
    ("кавычки «", "guillemet_open"),
    ("из них не оглавление", "guillemet_word"),
    ("кавычки „", "german_open"),
    ("прямые \"", "straight_quote"),
    ("восклицательный", "exclam"),
    ("«ё» на 1000 «е»", "yo_per_1000_e"),
    ("слов в предложении", "words_per_sentence"),
    ("знаков в предложении", "chars_per_sentence"),
]


def table(results, keys, title):
    print(f"\n### {title}\n")
    header = "| | " + " | ".join(f"{a} / {e}" for a, e in keys) + " |"
    print(header)
    print("|---|" + "---:|" * len(keys))
    print("| выборка, знаков | " + " | ".join(f"{results[k]['chars']:,}".replace(",", " ") for k in keys) + " |")
    for label, key in ROWS:
        cells = [str(results[k].get(key, "—")) for k in keys]
        print(f"| {label} | " + " | ".join(cells) + " |")


def main():
    corpus_dir = sys.argv[1] if len(sys.argv) > 1 else "corpus"
    groups = load(corpus_dir)
    results = {}
    for key, data in groups.items():
        m = counts(data["text"])
        if m:
            m["works"] = data["works"]
            results[key] = m

    by_author = {}
    for author, edition in results:
        by_author.setdefault(author, []).append((author, edition))

    for author, keys in by_author.items():
        keys = [k for k in keys if k[1] != "профиль"]
        if len(keys) > 1:
            table(results, sorted(keys, key=lambda k: k[1]), f"{author}: сверка изданий")

    main_keys = [k for k in results if k[1] == "профиль"]
    if main_keys:
        table(results, sorted(main_keys), "Основные профили")

    out = {f"{a} / {e}": v for (a, e), v in results.items()}
    path = os.path.join(corpus_dir, "measurements.json")
    with open(path, "w") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print(f"\n# записано: {path}", file=sys.stderr)


if __name__ == "__main__":
    main()
