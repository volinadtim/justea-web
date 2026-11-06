# docs/seo — SEO justea.ru

Зона агента **justea-seo**: `app/sitemap.ts`, `app/robots.ts`, `middleware.ts`,
metadata и JSON-LD в страницах (`app/components/seo/**`, `lib/metadata.ts`,
`lib/site.ts`, `lib/tea-type-pages.ts`), `docs/seo/**`.

Визуал и UI-компоненты — зона justea-design. Тексты — justea-voice.
Семантическое ядро — justea-market.

## Файлы

| Файл | Что внутри |
|---|---|
| [`technical-audit.md`](technical-audit.md) | Аудит этапа 1: 17 находок, что исправлено, что передано и кому. **Начинать отсюда.** |
| [`audit-findings.json`](audit-findings.json) | Те же находки машиночитаемо: severity, status, owner, evidence |
| [`core-web-vitals.json`](core-web-vitals.json) | Базовые замеры Lighthouse (mobile) с диагностикой |
| [`webmaster-setup.md`](webmaster-setup.md) | **Для пользователя:** пошагово Яндекс.Вебмастер, Google Search Console, Яндекс.Метрика + чеклист |
| [`h1-variants.md`](h1-variants.md) | **Решение пользователя:** три варианта `<h1>` главной |

## Состояние на 06.11.2026

Этап 1 (технический SEO) закрыт в ветке `agent/seo`. Lighthouse SEO — 100/100
на главной и на странице чая.

**Ждёт пользователя:** подключение панелей вебмастеров
([`webmaster-setup.md`](webmaster-setup.md)), выбор `<h1>`
([`h1-variants.md`](h1-variants.md)).

**Ждёт justea-design:** находки 3.1 (~390 КБ неиспользуемых шрифтов — самая
дешёвая правка с наибольшим эффектом), 3.2 (CLS 0.188), 3.3 (TBT), 3.5
(`og.jpg` 1200 × 630), 4.4 (порядок заголовков), 5.1, 5.2.

**Ждёт инфраструктуру:** находка 2.2 — `www.justea.ru` отдаёт 200 вместо 301.

**Этап 2** начинается, когда justea-market отдаст `docs/market/semantic-core.csv`.

## Решения, принятые на этапе 1

- **Языки.** Только русский (подтверждено пользователем 06.11.2026). hreflang не
  выводится: ссылки на несуществующие локали дают ошибки в GSC. `lib/site.ts`
  устроен так, что локаль добавляется одной строкой в `siteConfig.locales`,
  после чего `alternates.languages` начинает собираться сам.
- **URL кластеров.** `/tea/<type>` вместо `/?type=<type>`. Старые адреса —
  301 через `middleware.ts`.
- **Страницы без контента не создаются.** `/tea/pu-erh` и `/tea/yellow` отдают
  404, пока в каталоге нет чаёв этих типов, и появятся сами на следующей
  сборке после того, как justea-sources их добавит.
- **Разметка только по реальным данным.** Без `aggregateRating` (нет отзывов),
  без `offers` (чай не продаётся). Подробнее — раздел 2.3 аудита.
- **Правило для нового URL.** Любой новый маршрут обязан получить canonical,
  попасть в `sitemap.ts` (или быть закрытым от индексации) и иметь свои
  `title` и `description`. `createPageMetadata()` делает первое и третье за вас.
