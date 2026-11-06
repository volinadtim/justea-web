# docs/seo — SEO justea.ru

Зона агента **justea-seo**: `app/sitemap.ts`, `app/robots.ts`, `middleware.ts`,
metadata и JSON-LD в страницах (`app/components/seo/**`, `lib/metadata.ts`,
`lib/site.ts`, `lib/tea-type-pages.ts`), `docs/seo/**`.

Визуал и UI-компоненты — зона justea-design. Тексты — justea-voice.
Семантическое ядро — justea-market.

## Файлы

| Файл | Что внутри |
|---|---|
| [`technical-audit.md`](technical-audit.md) | **Этап 1.** Аудит: 17 находок, что исправлено, что передано и кому. Начинать отсюда. |
| [`site-structure.md`](site-structure.md) | **Этап 2.** Структура сайта под кластеры запросов: какие страницы создать, URL, title, description, перелинковка |
| [`pages.json`](pages.json) | Карта страниц машиночитаемо: 24 страницы, URL, мета, спрос, приоритет, владелец текста |
| [`content-briefs.md`](content-briefs.md) | **Заказ justea-voice:** брифы на тексты всех новых страниц |
| [`audit-findings.json`](audit-findings.json) | Находки аудита машиночитаемо: severity, status, owner, evidence |
| [`core-web-vitals.json`](core-web-vitals.json) | Замеры Lighthouse, парная методика «до/после» |
| [`webmaster-setup.md`](webmaster-setup.md) | **Для пользователя:** пошагово Яндекс.Вебмастер, Google Search Console, Яндекс.Метрика + чеклист |
| [`h1-variants.md`](h1-variants.md) | **Решение пользователя:** три варианта `<h1>` главной |

## Состояние на 06.11.2026

Этапы 1 и 2 закрыты в ветке `agent/seo`.

Lighthouse: **SEO 100/100 и Performance 100/100** на главной и на странице чая
(парный замер, [`core-web-vitals.json`](core-web-vitals.json)). CLS 0.188 → 0,
шрифты 800 → 423 КБ.

**Ждёт пользователя:** подключение панелей вебмастеров
([`webmaster-setup.md`](webmaster-setup.md)), выбор `<h1>`
([`h1-variants.md`](h1-variants.md)), решение по `/health/effect` —
[`site-structure.md`](site-structure.md) §9.

**Ждёт justea-voice:** тексты по [`content-briefs.md`](content-briefs.md).
Без них новые разделы `/guides` и `/health` не выпускаются.

**Ждёт инфраструктуру:** находка 2.2 — `www.justea.ru` отдаёт 200 вместо 301.
**Единственная неисправленная находка критичной серьёзности.**

**Ждёт justea-sources и justea-design:** матча (448 score) не укладывается в
модель данных — нет типа `matcha`, и её взбивают, а не заваривают проливами.
См. [`site-structure.md`](site-structure.md) §6.

## Решения, принятые на этапе 1

- **Языки.** Только русский (подтверждено пользователем 06.11.2026). hreflang не
  выводится: ссылки на несуществующие локали дают ошибки в GSC. `lib/site.ts`
  устроен так, что локаль добавляется одной строкой в `siteConfig.locales`,
  после чего `alternates.languages` начинает собираться сам.
- **URL кластеров.** `/tea/<type>` вместо `/?type=<type>`. Старые адреса —
  301 через `middleware.ts`.
- **Страницы типов не зависят от наполнения каталога.** На этапе 1 было
  наоборот (`/tea/pu-erh` → 404), но ядро показало, что посылка неверна:
  странице типа листинг не нужен, её закрывает руководство по завариванию.
  Решение отменено, см. [`site-structure.md`](site-structure.md) §3.
- **Структура URL — единый источник правды здесь.** В `semantic-core.csv` URL
  намеренно нет: иначе получим два расходящихся источника.
- **Разметка только по реальным данным.** Без `aggregateRating` (нет отзывов),
  без `offers` (чай не продаётся). Подробнее — раздел 2.3 аудита.
- **Правило для нового URL.** Любой новый маршрут обязан получить canonical,
  попасть в `sitemap.ts` (или быть закрытым от индексации) и иметь свои
  `title` и `description`. `createPageMetadata()` делает первое и третье за вас.
