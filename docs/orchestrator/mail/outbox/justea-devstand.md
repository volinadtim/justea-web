# justea-devstand → orchestrator

## 2026-11-07 17:08 #1

Dev-стенд готов как код. PR: https://github.com/volinadtim/justea-web/pull/18
(ветка `agent/devstand`, 13 файлов, прод не тронут). На VPS ничего не
запускалось: ни `ansible-playbook`, ни `ssh`, ни выпуск сертификата.

### Что сделано

- `dev.justea.ru` рядом с продом, изолированно: compose-проект `justea-web-dev`
  на `127.0.0.1:3002` (прод держит 3001), каталог `/opt/justea-web-dev`, свой
  nginx-vhost отдельным файлом `host-justea-dev.conf` + симлинк, свой сертификат.
- Выкатка **произвольной ветки**: `dev-stand-deploy.yml -e dev_ref=agent/design`.
  Плей делает `git archive` нужного коммита из локальной копии и распаковывает
  на сервер — серверу не нужен доступ к GitHub, выкатить можно ветку, которой нет
  в master. Что поехало — в `/opt/justea-web-dev/DEPLOYED_REF`.
- `NEXT_PUBLIC_SITE_URL=https://dev.justea.ru` и в build-arg, и в окружение.
  Проверено: og:url, og:image и sitemap указывают на dev, прод-домена в HTML нет.
- Индексация закрыта двумя слоями: `X-Robots-Tag: noindex, nofollow, noarchive,
  nosnippet` на уровне `server` с `always` (попадает в 401, 404 и в страницы
  Next.js) плюс `/robots.txt` с `Disallow: /`, который отдаёт сам nginx и отдаёт
  **без пароля** — краулер должен прочитать запрет, а не получить 401.
  Это не перестраховка: `app/robots.ts` отдаёт `Allow: /`, проверено отдельно.
- HTTP Basic auth на весь хост. Пароля в репозитории нет: `.htpasswd`
  генерируется на сервере из `dev_basic_auth_password` (`openssl passwd -apr1
  -stdin`, `no_log`), в репозитории — только `.example`-файлы, настоящие в
  `.gitignore`.
- Плеи: `dev-stand-setup.yml` (первичная настройка + сертификат),
  `dev-stand-deploy.yml` (выкатка ветки), таски `dev-stand-{htpasswd,ssl,nginx}.yml`.
  Прод-плеи и прод-конфиги не изменены, с PR #15 (редирект www в
  `host-justea-ssl.conf`) конфликта нет.
- `docs/infra/dev-stand.md`: выкатка, логи, откат, что делать со сломанным стендом.

### Отдельно: прод защищён от сломанного конфига стенда

`tasks/dev-stand-nginx.yml` перед `reload` делает `nginx -t`; если тест не прошёл —
снимает симлинк vhost стенда и падает с выводом теста, **не перезагружая nginx**.
Прод не может упасть из-за конфига стенда.

### Как проверено без VPS

Собрал образ из `docker-compose.dev-stand.yml`, поднял приложение с `PORT=3002`,
рядом — контейнер `nginx:1.27-alpine` в том же сетевом namespace с
примонтированным настоящим `host-justea-dev.conf`, самоподписанным сертификатом
и `.htpasswd`, сгенерированным той же командой, что в плее. Вывод `curl -I` и
`nginx -t` — в PR. Все семь проверок прошли: 301 с заголовком, 401 без пароля
с заголовком, 200 с паролем с заголовком, 401 с неверным паролем, robots.txt
без пароля с `Disallow: /`, вложенная страница, 404 — везде `X-Robots-Tag`.
`ansible-playbook --syntax-check` проходит на обоих плеях.

Локально для этого пришлось поднять остановленную Colima-VM (docker-демона на
машине не было запущено). После проверки контейнеры удалены, VM возвращена
в состояние Stopped.

### Что нужно от пользователя

1. **DNS, одной операцией у регистратора:**
   тип `A`, имя `dev` (полное `dev.justea.ru`), значение `89.104.68.81`, TTL любой.
   AAAA не нужна. Без этой записи certbot не выпустит сертификат, плей честно
   об этом скажет и остановится.
2. **Пароль basic auth** — придумать и передать плею. В репозиторий не кладём.
   Я его не придумывал и нигде не зафиксировал. Если нужно, попроси у пользователя
   и передай мне — я заведу ввод со скрытым эхом, без записи в чат и в файлы.
3. **Разрешение запустить плеи на VPS** — первый запуск выпустит сертификат
   Let's Encrypt для `dev.justea.ru`. Без твоего «да» на VPS не хожу.

### Порядок первого запуска

1. Пользователь делает DNS-запись, ждём, пока резолвится.
2. `ansible-playbook -i infra/ansible/inventory.ini infra/ansible/dev-stand-setup.yml -e dev_basic_auth_password="$JUSTEA_DEV_PASSWORD"`
   — проверит nginx/certbot/docker и свободен ли 3002, создаст каталог, заведёт
   `.htpasswd`, поставит HTTP-vhost, выпустит сертификат, переставит vhost на SSL.
3. `ansible-playbook -i infra/ansible/inventory.ini infra/ansible/dev-stand-deploy.yml -e dev_ref=<ветка>`
   — соберёт и поднимёт контейнер, дождётся ответа на 3002.
4. Проверить: `curl -I https://dev.justea.ru/` → 401 + `X-Robots-Tag`,
   `curl -s https://dev.justea.ru/robots.txt` → `Disallow: /`.

### Чего я не делал

PR не мержил, в master не пушил, DNS не заводил, аккаунтов не регистрировал,
на VPS не заходил. Порт 3002 выбран как свободный по прод-конфигам (3001 прод,
9080 videohub) — на сервере это не проверялось, плей setup предупредит, если он
всё-таки занят.
