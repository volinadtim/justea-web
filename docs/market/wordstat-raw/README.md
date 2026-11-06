# Сырые данные и как они собраны

Собрано 2026-11-06 агентом justea-market. Серверное время по заголовку HTTP `Date`
(`google.com`): `Fri, 06 Nov 2026 19:18:36 GMT`. Локальные часы машины спешат на ~21 минуту,
поэтому таймстампы внутри `suggest-raw.jsonl` (локальный `time.time()`) сдвинуты вперёд
на эту величину — для относительных интервалов это неважно, для датировки берите 2026-11-06.

## Файлы

| Файл | Содержание |
|---|---|
| `suggest-raw.jsonl` | 10 260 ответов API подсказок: по строке на запрос. Поля: `engine`, `group`, `seed`, `part` (что отправляли), `suggestions` (что вернулось, в исходном порядке), `ts`. При ошибке вместо `suggestions` — `error`. Ошибок: 0 |
| `suggest-aggregated.json` | 16 477 уникальных фраз: `query`, `hits` (в скольких выдачах встретилась), `avg_pos` (средняя позиция, 0 = первая), `engines`, `groups`, `seed_count` |
| `google-trends-raw.json` | сырые ответы widget-API Google Trends, 13 срезов. У каждого среза `keywords`, `geo`, `timeframe`, `data` (по виджетам), `errors` |
| `google-trends-derived.json` | выжимка: средний уровень, тренд за период, сезонный индекс по месяцам, топ-регионы, related queries (топ и растущие) |
| `google-trends-summary.txt` | та же выжимка в читаемом виде |

## Источники и сетевые выходы

| Источник | Эндпоинт | Выход | Результат |
|---|---|---|---|
| Подсказки Яндекса | `suggest.yandex.ru/suggest-ya.cgi` (`srv=morda_ru_desktop`, `wiz=TrWth`, `uil=ru`, `n=10`) | **RU-direct** (домашний IP, СПб) | 7 560 запросов, 0 ошибок, 252 с |
| Подсказки Google | `www.google.com/complete/search` (`client=chrome`, `hl=ru`, `gl=ru`) | VPN-proxy | 2 700 запросов, 0 ошибок, 447 с |
| Google Trends | `trends.google.com/trends/api/{explore,widgetdata/*}` | VPN-proxy | 13 срезов; 2 виджета не добрались (429/500), помечены в `errors` |
| **Яндекс Вордстат** | — | — | **не собрано: нужен вход в аккаунт.** Проверено: `wordstat.yandex.ru/?words=пуэр` отдаёт 200, но в состоянии страницы `"login":""` и ни одного числа |
| Baidu Index, 5118 | — | — | **не собрано:** хосты открываются, данные за логином с китайским номером |
| Yahoo! JAPAN | — | — | **не собрано:** 403 через прокси; с домашнего IP открывается, но частотности без аккаунта не даёт |

Правила выбора выхода — `~/.claude/network.md`. Запросы к `*.yandex.ru` идут мимо прокси
автоматически через `NO_PROXY`; в `harvest_suggest.py` для Яндекса дополнительно выставлен
`Session.trust_env = False`, чтобы прокси не подхватился ни при каких настройках окружения.

## Как собирался сид-лист

180 сид-фраз в 8 группах (`../scripts/seeds.py`): типы чая, сорта, заваривание, посуда,
церемония, здоровье, коммерция, общая справка. Источники сидов: `data/teas.json` (8 сортов
каталога), `docs/tea-catalog-candidates.json` (340 кандидатов), `docs/tea-brewing-science-ru.md`,
плюс узнаваемые рыночные формулировки.

Каждый сид расширялся префиксами:
- сам сид;
- сид + 8 вопросных слов (`как`, `что`, `сколько`, `какой`, `чем`, `где`, `почему`, `зачем`);
- сид + 6 маркеров (`купить`, `цена`, `отзывы`, `польза`, `рецепт`, `своими руками`);
- сид + каждая из 27 букв алфавита — **только для Яндекса** (у Google это расширение не делалось,
  чтобы не упереться в лимиты).

Итого 7 560 префиксов для Яндекса и 2 700 для Google.

## Важное ограничение

`hits` в `suggest-aggregated.json` — **не частотность.** Это число префиксов, из которых
подсказка всплыла, и оно прямо зависит от того, как построен сид-лист. Сравнивать `hits`
можно внутри одного кластера; между кластерами — нельзя, потому что сидов в группах разное
количество (сортов 45, церемонии 22). Абсолютные частотности появятся только с Вордстатом.

## Как воспроизвести

Скрипты — в `../scripts/`. Нужен только `requests`.

```bash
cd docs/market/scripts
python3 harvest_suggest.py ../wordstat-raw/suggest-raw.jsonl   # ~12 мин
python3 analyze_suggest.py ../wordstat-raw/suggest-raw.jsonl   # -> suggest-aggregated.json
python3 trends.py ../wordstat-raw/google-trends-raw.json       # ~6 мин
python3 trends_retry.py                                        # добор упавших виджетов
python3 trends_derived.py                                      # -> google-trends-derived.json
python3 analyze_trends.py ../wordstat-raw/google-trends-raw.json > ../wordstat-raw/google-trends-summary.txt
python3 build_core.py                                          # -> ../semantic-core.csv
```

`trends_retry.py` и `trends_derived.py` содержат абсолютные пути к файлам этого репозитория —
при переносе поправить константу `RAW`/`ROOT` в начале файла.
