#!/usr/bin/env python3
"""Собирает index.html галереи референсов из _report.json и _works/_works.json."""
import json, os, sys, html
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from urllib.parse import quote

R = sys.argv[1]
report = json.load(open(os.path.join(R, '_report.json')))
works = json.load(open(os.path.join(R, '_works', '_works.json')))

MONTHS = ['января','февраля','марта','апреля','мая','июня','июля','августа',
          'сентября','октября','ноября','декабря']

def ru_date(s):
    if not s:
        return None
    try:
        d = parsedate_to_datetime(s).astimezone(timezone.utc)
    except Exception:
        return None
    return f'{d.day} {MONTHS[d.month - 1]} {d.year}, {d:%H:%M} UTC'

def plural(n, one, few, many):
    n10, n100 = n % 10, n % 100
    if n10 == 1 and n100 != 11:
        return one
    if 2 <= n10 <= 4 and not 12 <= n100 <= 14:
        return few
    return many

def e(s):
    return html.escape(s or '', quote=True)

def short(url, limit=72):
    u = (url or '').replace('https://', '').replace('http://', '').rstrip('/')
    return u if len(u) <= limit else u[:limit - 1] + '…'

SHOT_LABELS = [
    ('home-desktop', 'Главная · 1440', 'd'),
    ('key-desktop',  'Ключевая · 1440', 'd'),
    ('home-mobile',  'Главная · 390', 'm'),
    ('key-mobile',   'Ключевая · 390', 'm'),
]

def shots_block(base, shots, misses):
    out = []
    for key, label, cls in SHOT_LABELS:
        f = (shots or {}).get(key)
        if f:
            src = f'{quote(base)}/{quote(f)}'
            out.append(
                f'<figure class="shot shot--{cls}">'
                f'<a href="{src}" target="_blank" rel="noopener">'
                f'<img loading="lazy" src="{src}" alt="{e(label)}" /></a>'
                f'<figcaption>{e(label)}</figcaption></figure>')
        else:
            why = (misses or {}).get(key) or 'сайт не отдал страницу'
            out.append(
                f'<figure class="shot shot--{cls} shot--none">'
                f'<div class="noshot"><b>{e(label)}</b><span>{e(why)}</span></div></figure>')
    return '<div class="shots">' + ''.join(out) + '</div>'

# ---------- реальные сайты ----------
cats, order = {}, []
for s in report:
    cats.setdefault(s['cat'], []).append(s)
    if s['cat'] not in order:
        order.append(s['cat'])

site_html = []
for cat in order:
    items = cats[cat]
    rows = []
    for s in items:
        date = ru_date(s.get('date'))
        key_date = ru_date(s.get('keyDate'))
        head = [f'<span class="ref__n">{s["n"]:02d}</span>',
                f'<h3 class="ref__title">{e(s["title"])}</h3>',
                f'<a class="ref__url" href="{e(s["url"])}" target="_blank" rel="noopener">{e(short(s["url"], 40))}</a>']
        if date:
            head.append(f'<span class="ref__date">снято {e(date)}</span>')
        key = ''
        if s.get('keyUrl'):
            kd = f' · снято {e(key_date)}' if key_date and key_date != date else ''
            key = (f'<p class="ref__key">Ключевая страница ({e(s.get("keyKind") or "")}): '
                   f'<a href="{e(s["keyUrl"])}" target="_blank" rel="noopener">{e(short(s["keyUrl"]))}</a>{kd}</p>')
        rows.append(f'''    <article class="ref" id="{e(s["id"])}">
        <header class="ref__head">
            {"".join(head)}
        </header>
        <p class="ref__take">{e(s["take"])}</p>
        {key}
        {shots_block(s["id"], s.get("shots"), s.get("missing"))}
    </article>''')
    anchor = 'cat-' + quote(cat)
    site_html.append(f'''<section class="cat" id="{anchor}">
    <h2 class="cat__title">{e(cat)} <span class="cat__count">{len(items)}</span></h2>
{chr(10).join(rows)}
</section>''')

# ---------- дизайнерские работы ----------
wcats, worder = {}, []
for w in works:
    wcats.setdefault(w['theme'], []).append(w)
    if w['theme'] not in worder:
        worder.append(w['theme'])

work_html = []
for theme in worder:
    items = wcats[theme]
    rows = []
    for w in items:
        figs = ''.join(
            f'<figure class="shot"><a href="_works/{quote(w["id"])}/{quote(f)}" target="_blank" rel="noopener">'
            f'<img loading="lazy" src="_works/{quote(w["id"])}/{quote(f)}" alt="{e(w["title"])}" /></a></figure>'
            for f in w['images'])
        note = ''
        if len(w['images']) < 3:
            note = ('<p class="missing">Со страницы работы забрана '
                    f'{len(w["images"])} {plural(len(w["images"]), "картинка", "картинки", "картинок")} '
                    'из трёх — остальные площадка не отдала.</p>')
        rows.append(f'''    <article class="ref">
        <header class="ref__head">
            <h3 class="ref__title">{e(w["title"])}</h3>
            <a class="ref__url" href="{e(w.get("href") or w["url"])}" target="_blank" rel="noopener">{e(w["source"])}</a>
            <span class="ref__author">автор: <a href="{e(w["authorUrl"])}" target="_blank" rel="noopener">{e(w["author"])}</a></span>
        </header>
        <div class="shots shots--work">{figs}</div>
        {note}
    </article>''')
    work_html.append(f'''<section class="cat" id="wcat-{quote(theme)}">
    <h2 class="cat__title">{e(theme)} <span class="cat__count">{len(items)}</span></h2>
{chr(10).join(rows)}
</section>''')

n_sites = len(report)
n_shots = sum(len(s.get('shots') or {}) for s in report)
n_miss = n_sites * 4 - n_shots
n_works = len(works)
n_wimg = sum(len(w['images']) for w in works)
built = datetime.now(timezone.utc).strftime('%d.%m.%Y')
toc = ''.join(f'<a href="#cat-{quote(c)}">{e(c)}</a>' for c in order)

miss_note = ''
if n_miss:
    rows = []
    for s in report:
        for key, label, _ in SHOT_LABELS:
            if not (s.get('shots') or {}).get(key):
                why = (s.get('missing') or {}).get(key) or 'сайт не отдал страницу'
                rows.append(f'<li>{e(s["title"])} — {e(label.lower())}: {e(why)}</li>')
    miss_note = (f'<p class="lead">Не снялось {n_miss} '
                 f'{plural(n_miss, "кадр", "кадра", "кадров")} из {n_sites * 4}; '
                 'в карточке на их месте стоит пометка с причиной:</p>'
                 f'<ul class="lead misslist">{"".join(rows)}</ul>')

STYLE = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'gallery.css')).read()

doc = f'''<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Justea — референсы дизайна</title>
<style>
{STYLE}</style>
</head>
<body>
<div class="wrap">

<h1>Референсы дизайна для Justea</h1>
<p class="lead">
    Подборка собрана по задаче пользователя: выбрать образец, по которому дальше
    делается сайт (повторяем минимум на 60 %). Это <strong>материал для выбора,
    а не предложение</strong> — своих вариантов редизайна здесь нет, оценок
    «лучший/худший» тоже.
</p>
<p class="lead">
    Снимки сделаны в светлой теме, desktop 1440×900 и mobile 390×844, без
    прокрутки — то, что видно при открытии страницы. У каждого сайта снята
    главная и одна ключевая страница; какая именно — сказано ссылкой в карточке.
    Дата снимка берётся из заголовка <code>Date</code> ответа самого сайта.
    Строка «что можно взять» — одна мысль о том, чем сайт полезен именно Justea,
    не похвала.
</p>
{miss_note}
<p class="meta">
    {n_sites} {plural(n_sites, "сайт", "сайта", "сайтов")} · {n_shots}
    {plural(n_shots, "снимок", "снимка", "снимков")} ·
    {n_works} {plural(n_works, "дизайнерская работа", "дизайнерские работы", "дизайнерских работ")} ·
    {n_wimg} {plural(n_wimg, "картинка", "картинки", "картинок")}. Страница собрана {built}.
</p>

<div class="toc">
    <a href="#sites">Реальные сайты</a>
    <a href="#works">Дизайнерские работы</a>
    {toc}
</div>

<section class="part" id="sites">
    <div class="part__head">
        <h2>Реальные сайты</h2>
        <p>{n_sites} {plural(n_sites, "сайт", "сайта", "сайтов")}: чайные магазины и справочники,
        кофе, вино и саке, редакционные издания, страницы записи на занятия и тексты с таблицами.</p>
    </div>
{chr(10).join(site_html)}
</section>

<section class="part" id="works">
    <div class="part__head">
        <h2>Дизайнерские работы</h2>
        <p>{n_works} {plural(n_works, "концепт или кейс", "концепта и кейса", "концептов и кейсов")}
        с дизайнерских площадок. Картинки — те, что опубликованы на странице самой работы;
        у каждой есть ссылка на работу и на автора.</p>
    </div>
{chr(10).join(work_html)}
</section>

<footer>
    Собрал агент justea-design, {built}. Все права на изображения принадлежат их
    владельцам; подборка служебная, для выбора образца.
</footer>

</div>
</body>
</html>
'''
open(os.path.join(R, 'index.html'), 'w').write(doc)
print(f'index.html: {n_sites} сайтов, {n_shots} снимков, {n_miss} пропусков, '
      f'{n_works} работ, {n_wimg} картинок')
