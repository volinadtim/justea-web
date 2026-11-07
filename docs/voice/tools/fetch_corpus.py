#!/usr/bin/env python3
"""Скачивает тексты авторов-образцов и вынимает из HTML чистый текст.

Источники перечислены в sources.json: для каждого указан автор, издание,
произведение, URL и способ извлечения. Скачанное кладётся в ./corpus рядом
с готовым manifest.json, который читает measure.py.

Запуск:
    python3 fetch_corpus.py [каталог]     # по умолчанию ./corpus

Повторный запуск не перекачивает уже скачанное. Дата обращения берётся из
заголовка HTTP Date и пишется в manifest.json — локальным часам не доверяем.
"""

import html
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

UA = "justea-voice/1.0 (+https://justea.ru) corpus fetcher"
HERE = os.path.dirname(os.path.abspath(__file__))


# ilibrary.ru ограничивает частоту по IP: отдаёт один запрос и глушит
# следующий на несколько минут. Поэтому держим паузу между запросами к одному
# хосту и длинные паузы между попытками. Выгрузка идёт медленно — это нормально.
POLITE_DELAY = 3.0
_last_request = {}


def get(url, tries=4):
    host = urllib.parse.urlsplit(url).netloc
    last = None
    for attempt in range(tries):
        waited = time.monotonic() - _last_request.get(host, 0)
        if waited < POLITE_DELAY:
            time.sleep(POLITE_DELAY - waited)
        _last_request[host] = time.monotonic()
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.read(), r.headers.get("Date")
        except Exception as exc:  # сеть, таймаут, 5xx, глушение по частоте
            last = exc
            time.sleep(10 + 20 * attempt)
    raise last


def drop_noise(markup):
    """Убирает <script>, <style> и <noscript>. Нужно до снятия тегов: их
    содержимое — тоже текст, и CSS, попавший в выборку, добавляет к счёту
    точки с запятой и двоеточия. На royallib.com это завышало точку с запятой
    у Пришвина в шесть раз, пока не поймали."""
    return re.sub(r"<(script|style|noscript)[^>]*>.*?</\1>", " ", markup,
                  flags=re.S | re.I)


def strip_tags(fragment):
    return html.unescape(re.sub(r"<[^>]+>", "", fragment)).strip()


def paragraphs(markup, pattern):
    markup = drop_noise(markup)
    return "\n".join(p for p in (strip_tags(m) for m in re.findall(pattern, markup, re.S)) if p)


# --- извлечение текста, по одному способу на источник -----------------------

def ilibrary(body):
    """ilibrary.ru: абзацы в <z>, страницы p.1, p.2, …"""
    return paragraphs(body.decode("cp1251", "replace"), r"<z>(.*?)</z>")


def azlib(body):
    """az.lib.ru: абзацы в <dd>."""
    return paragraphs(body.decode("cp1251", "replace"), r"<dd>(.*?)(?=<dd>|</div>|$)")


# служебные хвосты royallib.com внутри читалки: лимит скачиваний, подвал
ROYALLIB_TAIL = re.compile(r"(Вы скачали \d+ книг|© Электронная библиотека RoyalLib)")


def royallib(body):
    """royallib.com: абзацы в <p> внутри #rl2Text, без служебного подвала.

    Подвал сайта лежит в том же контейнере, что и текст, и попадает в выборку:
    «Контактный e-mail: …» добавляет двоеточия, а счётчик скачиваний — цифры.
    Обрезаем по первому служебному абзацу."""
    markup = body.decode("utf-8", "replace")
    start = markup.find('id="rl2Text"')
    text = paragraphs(markup[start:] if start >= 0 else markup, r"<p[^>]*>(.*?)</p>")
    cut = ROYALLIB_TAIL.search(text)
    return text[:cut.start()].strip() if cut else text


def wikisource(body):
    """Викитека, action=render: абзацы в <p>, без номеров страниц и сносок."""
    markup = body.decode("utf-8", "replace")
    markup = re.sub(r"<table[^>]*>.*?</table>", "", markup, flags=re.S | re.I)
    markup = re.sub(r'<span class="pagenum[^"]*"[^>]*>.*?</span>', "", markup, flags=re.S)
    markup = re.sub(r"<sup[^>]*>.*?</sup>", "", markup, flags=re.S)
    return paragraphs(markup, r"<p[^>]*>(.*?)</p>")


def gutenberg_html(body):
    """Project Gutenberg, HTML-издание: длинное тире приходит как &mdash;."""
    markup = body.decode("utf-8", "replace")
    start = markup.find("*** START")
    end = markup.find("*** END")
    if start >= 0:
        markup = markup[start:end if end > start else None]
    return paragraphs(markup, r"<p[^>]*>(.*?)</p>")


def gutenberg_txt(body):
    """Project Gutenberg, txt-издание: тире заменено на `--`, поэтому его
    и держим отдельным изданием — это материал для сверки, не для образцов."""
    text = body.decode("utf-8", "replace")
    start = text.find("*** START")
    end = text.find("*** END")
    if start >= 0:
        text = text[text.find("\n", start):end if end > start else None]
    return text.strip()


EXTRACTORS = {
    "ilibrary": ilibrary,
    "azlib": azlib,
    "royallib": royallib,
    "wikisource": wikisource,
    "gutenberg_html": gutenberg_html,
    "gutenberg_txt": gutenberg_txt,
}


def ilibrary_pages(url_template):
    """ilibrary.ru делит произведение на страницы; собираем все.

    Если страница в середине не отдалась, возвращаем пустой текст, а не то,
    что успели собрать. Недокачанное произведение опаснее отсутствующего:
    оно молча попадёт в выборку и испортит частоты. На «Даме с собачкой» так
    и вышло — в корпус попала половина рассказа, и у Чехова разошлись числа
    по двум источникам, хотя текст у них один."""
    parts, page = [], 1
    while page < 200:
        url = url_template.format(page=page)
        try:
            body, date = get(url, tries=3)
        except Exception:
            print(f"  страница {page} не отдалась, произведение пропущено: {url}",
                  file=sys.stderr)
            return "", None
        chunk = ilibrary(body)
        if not chunk:
            if page == 1:
                return "", None
            print(f"  страница {page} без текста, произведение пропущено: {url}",
                  file=sys.stderr)
            return "", None
        parts.append(chunk)
        markup = body.decode("cp1251", "replace")
        if f"p.{page + 1}/" not in markup:
            return "\n".join(parts), date
        page += 1
    return "\n".join(parts), None


def write_manifest(out_dir, texts):
    """Пишем манифест после каждого файла: ilibrary.ru подтормаживает, и
    прерванная выгрузка не должна терять уже скачанное."""
    with open(os.path.join(out_dir, "manifest.json"), "w") as f:
        json.dump({"texts": texts}, f, ensure_ascii=False, indent=1)


def main():
    out_dir = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "corpus"))
    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(HERE, "sources.json")) as f:
        sources = json.load(f)

    texts = []
    for entry in sources["sources"]:
        path = os.path.join(out_dir, entry["file"])
        if os.path.exists(path) and os.path.getsize(path) > 0:
            print(f"есть: {entry['file']}", flush=True)
            texts.append({k: entry[k] for k in ("author", "edition", "work", "file", "url")})
            write_manifest(out_dir, texts)
            continue
        try:
            if entry["extract"] == "ilibrary":
                text, date = ilibrary_pages(entry["url"])
            else:
                body, date = get(entry["url"])
                text = EXTRACTORS[entry["extract"]](body)
        except Exception as exc:
            print(f"НЕ СКАЧАНО: {entry['file']} — {type(exc).__name__}: {exc}", file=sys.stderr)
            continue
        if not text:
            print(f"НЕ ИЗВЛЕЧЕНО: {entry['file']}", file=sys.stderr)
            continue
        with open(path, "w") as f:
            f.write(text)
        record = {k: entry[k] for k in ("author", "edition", "work", "file", "url")}
        record["fetched"] = date
        record["chars"] = len(text)
        texts.append(record)
        print(f"скачано: {entry['file']} {len(text)} знаков, Date={date}", flush=True)
        write_manifest(out_dir, texts)

    write_manifest(out_dir, texts)
    print(f"\nманифест: {os.path.join(out_dir, 'manifest.json')}")


if __name__ == "__main__":
    main()
