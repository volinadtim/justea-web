# Justea

Справочник по завариванию чая: проливы, температура, пропорции, поиск и избранное.

## Стек

- [Next.js 16](https://nextjs.org/) (App Router)
- [React 19](https://react.dev/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [XState 5](https://xstate.js.org/) — таймер проливов

## Локальный запуск

```bash
npm install
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

## Переменные окружения

Скопируйте `.env.example` в `.env.local` и при необходимости укажите публичный URL сайта:

```bash
cp .env.example .env.local
```

| Переменная | Описание |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Базовый URL для OG-тегов, sitemap и robots (например `https://justea-web.vercel.app`) |

## Скрипты

```bash
npm run dev     # режим разработки
npm run build   # production-сборка
npm run start   # запуск собранного приложения
npm run lint    # ESLint
```

## Структура

```
app/           — страницы и компоненты Next.js
data/teas.json — каталог чаёв
lib/           — поиск, избранное, XState-машины
public/teas/   — фотографии чаёв
```

## Деплой на Vercel

### Через GitHub (рекомендуется)

1. Запушьте репозиторий на GitHub.
2. Откройте [vercel.com/new](https://vercel.com/new) и импортируйте репозиторий.
3. Framework Preset: **Next.js** (определяется автоматически).
4. Добавьте переменную окружения `NEXT_PUBLIC_SITE_URL` со значением production-URL (например `https://your-project.vercel.app`).
5. Нажмите **Deploy**.

### Через CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

При первом деплое CLI предложит связать проект с аккаунтом Vercel.

## Маршруты

| URL | Описание |
|---|---|
| `/` | Главная, каталог чаёв |
| `/[slug]` | Страница чая |
| `/search?q=…` | Поиск |
| `/sitemap.xml` | Sitemap |
| `/robots.txt` | Robots |

## Данные

Чаи хранятся в `data/teas.json`. Для добавления нового чая укажите уникальный `slug`, тип, методы заваривания и положите фото в `public/teas/`.
