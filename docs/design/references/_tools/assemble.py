#!/usr/bin/env python3
"""Собирает папку референсов: новые снимки + уцелевшие старые + _report.json."""
import json, os, shutil, subprocess, sys

NEW = 'new'
R = '../refs/docs/design/references'
sites = json.load(open('sites.json'))
shots = json.load(open(os.path.join(NEW, '_shots.json')))
old = {s['n']: s for s in json.load(open(os.path.join(R, '_report.json')))}

# по какому сайту снимки берём из прошлого сбора (сайт закрыт бот-проверкой)
KEEP_OLD = {
    '11-meileaf.com': {
        'files': ['home-desktop', 'key-desktop', 'home-mobile', 'key-mobile'],
        'why': 'сайт закрыт проверкой Cloudflare «подтвердите, что вы не робот»',
    },
    '30-coffeeadastra.com': {
        'files': ['home-mobile', 'key-mobile'],
        'why': 'сайт закрыт проверкой Cloudflare «подтвердите, что вы не робот»',
    },
}
# у coffeeadastra из прошлого сбора уцелели только мобильные кадры,
# и ключевой там — раздел статей, а не отдельная статья
OVERRIDE_KEY = {
    '30-coffeeadastra.com': ('https://coffeeadastra.com/category/events/', 'раздел статей'),
}
RENAMED = {'21-vivino.com': '21-winefolly.com', '25-mold.is': '25-thisismold.com'}

TAKE = {
    24: ('Чтение длинных текстов: ширина строки, межстрочный интервал и ритм заголовков без '
         'картинок. На главной сейчас стоит арт-проект «One Minute Park», сам журнал — '
         'в разделах People и Guides.'),
    25: ('Журнал о будущем еды: длинные материалы с крупной типографикой и фотографией во всю '
         'ширину. Издание закрылось в июне 2025, архив открыт — смотреть ключевую страницу, '
         'на главной прощальное письмо.'),
}

last = {}
for s in shots:
    last[(s['id'], s['kind'], s['view'])] = s

for oldname, newname in RENAMED.items():
    p = os.path.join(R, oldname)
    if os.path.isdir(p):
        shutil.rmtree(p)

report = []
for site in sites:
    sid = site['id']
    dst = os.path.join(R, sid)
    os.makedirs(dst, exist_ok=True)
    keep = KEEP_OLD.get(sid)
    taken, missing = {}, {}
    date = key_date = None

    for kind in ('home', 'key'):
        for view in ('desktop', 'mobile'):
            name = f'{kind}-{view}'
            rec = last.get((sid, kind, view))
            src = os.path.join(NEW, sid, f'{name}.jpg')
            if rec and rec['ok'] and os.path.exists(src):
                shutil.copyfile(src, os.path.join(dst, f'{name}.jpg'))
                taken[name] = f'{name}.jpg'
                if view == 'desktop':
                    if kind == 'home':
                        date = rec['date']
                    else:
                        key_date = rec['date']
            elif keep and name in keep['files'] and os.path.exists(os.path.join(dst, f'{name}.jpg')):
                taken[name] = f'{name}.jpg'
            elif rec and not rec['ok']:
                missing[name] = (keep or {}).get('why') or rec['why']
                p = os.path.join(dst, f'{name}.jpg')
                if os.path.exists(p):
                    os.remove(p)
            else:
                sys.exit(f'нет записи о съёмке {sid} {name} — прогон не закончен, '
                         f'ничего не трогаю')

    if keep:                      # даты прошлого сбора
        date = date or old[site['n']].get('date')
        key_date = key_date or old[site['n']].get('date')
    if not date:
        for view in ('mobile',):
            rec = last.get((sid, 'home', view))
            if rec and rec['ok']:
                date = rec['date']

    key_url, key_kind = site['keyUrl'], site['keyKind']
    if sid in OVERRIDE_KEY:
        key_url, key_kind = OVERRIDE_KEY[sid]

    report.append({
        'n': site['n'], 'cat': site['cat'], 'id': sid, 'url': site['url'],
        'title': site['title'], 'take': TAKE.get(site['n'], site['take']),
        'keyUrl': key_url, 'keyKind': key_kind,
        'date': date, 'keyDate': key_date,
        'shots': taken, 'missing': missing,
    })

json.dump(report, open(os.path.join(R, '_report.json'), 'w'), ensure_ascii=False, indent=1)
n_shots = sum(len(r['shots']) for r in report)
print(f'сайтов {len(report)}, снимков {n_shots}, пропусков {len(report) * 4 - n_shots}')
for r in report:
    if r['missing']:
        print('  ', r['id'], list(r['missing']))
