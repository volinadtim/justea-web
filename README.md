# Justea

Справочник по завариванию чая: проливы, температура, пропорции, поиск и избранное.

## Стек

- [Next.js 16](https://nextjs.org/) (App Router)
- [React 19](https://react.dev/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [XState 5](https://xstate.js.org/) — таймер проливов

## Локальный запуск

Пакетный менеджер — **pnpm** (версия закреплена в `packageManager`, включается через Corepack):

```bash
corepack enable
pnpm install
pnpm dev
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
pnpm dev     # режим разработки
pnpm build   # production-сборка
pnpm start   # запуск собранного приложения
pnpm lint    # ESLint
```

## Структура

```
app/           — страницы и компоненты Next.js
data/teas.json — каталог чаёв
lib/           — поиск, избранное, XState-машины
public/teas/   — фотографии чаёв
```

## Деплой на VPS (justea.ru)

Автодеплой через GitHub Actions → Ansible → Docker на `89.104.68.81`.
Хостовый nginx маршрутизирует трафик по доменам на портах 80/443.

### Первичная настройка (один раз)

1. В reg.ru направьте A-записи `justea.ru` и `www.justea.ru` на `89.104.68.81`.
2. На сервере уже должен работать videohub (хостовый nginx проксирует оба домена).
3. Локально:

```bash
pip install -r infra/ansible/requirements.txt
ansible-galaxy collection install community.docker ansible.posix
ansible-playbook -i infra/ansible/inventory.ini infra/ansible/setup.yml
```

4. Добавьте секрет `VPS_SSH_PRIVATE_KEY` в GitHub → Settings → Secrets.

### Обычный деплой

Пуш в `master` запускает `.github/workflows/deploy.yml`, или вручную:

```bash
ansible-playbook -i infra/ansible/inventory.ini infra/ansible/deploy-fast.yml
```

### Структура infra

```
infra/docker/          — Dockerfile и docker-compose (порт 3001)
infra/nginx/           — конфиг хостового nginx (justea.ru + videohub)
infra/ansible/         — playbooks деплоя и SSL
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
pnpm add -g vercel
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
