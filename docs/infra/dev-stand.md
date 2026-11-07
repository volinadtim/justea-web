# Dev-стенд dev.justea.ru

Стенд, чтобы смотреть изменения до выкатки на прод. Живёт на том же VPS
(89.104.68.81), рядом с продом, но изолированно.

| | прод | dev-стенд |
|---|---|---|
| домен | justea.ru | dev.justea.ru |
| каталог на сервере | `/opt/justea-web` | `/opt/justea-web-dev` |
| compose-проект | `justea-web` | `justea-web-dev` |
| compose-файл | `docker-compose.yml` | `docker-compose.dev-stand.yml` |
| порт апстрима | `127.0.0.1:3001` | `127.0.0.1:3002` |
| nginx-конфиг | `host-proxy.conf` | `host-justea-dev.conf` |
| сертификат | `/etc/letsencrypt/live/justea.ru` | `/etc/letsencrypt/live/dev.justea.ru` |
| что выкатывается | только `master` (GitHub Actions) | любая ветка, руками |
| индексация | разрешена | запрещена жёстко, плюс basic auth |

Прод-плеи (`setup.yml`, `deploy-fast.yml`) и прод-конфиги (`host.conf`,
`host-justea-ssl.conf`, `host-http.conf`) стенд не трогает совсем. Если vhost
стенда окажется сломан, плей снимает его симлинк и падает, не делая `nginx
reload` — прод остаётся живым.

## Что нужно один раз, перед первым запуском

1. **DNS.** Запись `A` для `dev.justea.ru` → `89.104.68.81`. Без неё certbot не
   выпустит сертификат, и плей честно об этом скажет.
2. **Пароль basic auth.** В репозитории его нет и быть не должно. Задаётся
   скриптом со скрытым вводом:

   ```bash
   ./infra/scripts/set-dev-stand-password.sh
   ```

   Скрипт пишет пароль в `~/.justea/dev-stand.env` с правами 600 — вне
   репозитория. Пустой ввод означает «сгенерируй случайный»: тогда пароль не
   появляется на экране вообще, посмотреть его потом можно через
   `cat ~/.justea/dev-stand.env`. Пароль не передаётся аргументом, поэтому не
   попадает и в историю команд.

   Альтернатива, если удобнее файлом переменных ansible: скопировать
   `infra/ansible/dev-stand.secrets.example.yml` в
   `infra/ansible/dev-stand.secrets.yml` (он в `.gitignore`) и вписать пароль
   туда, а плеям передавать `-e @infra/ansible/dev-stand.secrets.yml`.
3. **Ansible.** `pip install -r infra/ansible/requirements.txt` и
   `ansible-galaxy collection install community.docker ansible.posix`.

## Первый запуск

```bash
. ~/.justea/dev-stand.env
```

```bash
ansible-playbook -i infra/ansible/inventory.ini infra/ansible/dev-stand-setup.yml -e dev_basic_auth_password="$JUSTEA_DEV_PASSWORD"
```

Плей: проверит, что nginx/certbot/docker на сервере есть и что порт 3002 свободен,
создаст `/opt/justea-web-dev`, сгенерирует `/etc/nginx/.htpasswd-justea-dev`,
поставит временный HTTP-vhost, выпустит сертификат для `dev.justea.ru` и
переставит vhost на SSL-вариант. Приложения после него ещё нет — дальше выкатка.

## Выкатить ветку

```bash
ansible-playbook -i infra/ansible/inventory.ini infra/ansible/dev-stand-deploy.yml -e dev_ref=agent/design
```

`dev_ref` — ветка, тег или SHA; по умолчанию `master`. Код берётся из локальной
копии репозитория через `git archive`, поэтому:

- на сервере не нужен доступ к GitHub и никаких ключей деплоя;
- выкатить можно любую ветку, даже ту, которой нет в master;
- в сборку попадает ровно содержимое коммита, без случайных локальных файлов.

Перед выкаткой плей сам делает `git fetch origin --prune` в локальной копии
(отключается `-e dev_fetch=false`) и ищет ref сначала локально, потом как
`origin/<ref>`. Какой коммит поехал — видно в выводе плея и на сервере в
`/opt/justea-web-dev/DEPLOYED_REF`.

`NEXT_PUBLIC_SITE_URL=https://dev.justea.ru` подставляется и в build-arg, и в
окружение контейнера — иначе canonical, og:url и sitemap указывали бы на прод.

## Закрытость от индексации

Двумя независимыми способами, потому что одного мало:

1. `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet` на уровне `server` в
   nginx, с `always` — попадает в любой ответ, включая 401, 404 и страницы
   Next.js, у которых своя мета.
2. `/robots.txt` отдаёт сам nginx: `User-agent: * / Disallow: /`, и отдаёт **без
   пароля** — краулер должен прочитать запрет, а не получить 401.

Так сделано, потому что приложение на своём `/robots.txt` отдаёт `Allow: /`
(см. `app/robots.ts`): на мету приложения полагаться нельзя, запрет держит nginx.
Если добавляешь в vhost стенда новый `location`, **не ставь в него `add_header`** —
nginx не наследует `add_header` в location, где есть свой, и `X-Robots-Tag`
пропадёт именно на этом пути.

## Доступ

HTTP Basic auth на весь хост, логин по умолчанию `dev`, файл паролей
`/etc/nginx/.htpasswd-justea-dev` (apr1, `root:www-data`, `0640`).

Посмотреть пароль, чтобы зайти на стенд: `cat ~/.justea/dev-stand.env`.

Сменить пароль — тем же скриптом, потом повторить setup:

```bash
./infra/scripts/set-dev-stand-password.sh && . ~/.justea/dev-stand.env
```

```bash
ansible-playbook -i infra/ansible/inventory.ini infra/ansible/dev-stand-setup.yml -e dev_basic_auth_password="$JUSTEA_DEV_PASSWORD"
```

nginx читает файл паролей на каждый запрос, reload не нужен.

## Логи и состояние

```bash
ssh root@89.104.68.81 'docker compose -p justea-web-dev logs -f --tail=200'
```

```bash
ssh root@89.104.68.81 'docker compose -p justea-web-dev ps; cat /opt/justea-web-dev/DEPLOYED_REF'
```

Логи nginx — общие с продом: `/var/log/nginx/access.log`, `error.log`
(запросы стенда отличаются по `Host: dev.justea.ru`).

## Откат

Откат стенда — это просто выкатка другого ref:

```bash
ansible-playbook -i infra/ansible/inventory.ini infra/ansible/dev-stand-deploy.yml -e dev_ref=master
```

## Когда стенд сломан

- **Сборка упала.** Плей падает на шаге сборки контейнера, старый контейнер
  продолжает работать: стенд показывает предыдущую версию. Смотри вывод плея,
  правь ветку, выкатывай снова.
- **Контейнер не поднимается.** Плей падает на ожидании ответа
  `http://127.0.0.1:3002/` (20 попыток по 3 секунды). Причина — в логах:
  `docker compose -p justea-web-dev logs --tail=100`.
- **502 Bad Gateway.** Контейнер лежит или слушает не тот порт. Проверь
  `docker compose -p justea-web-dev ps` и что в compose-файле стенда порт 3002.
- **Порт 3002 занят чем-то чужим.** Плей setup предупреждает об этом. Поменяй
  порт сразу в трёх местах: `dev_port` в `infra/ansible/dev-stand.vars.yml`,
  `ports` в `infra/docker/docker-compose.dev-stand.yml`, `proxy_pass` в
  `infra/nginx/host-justea-dev.conf` и `host-justea-dev-http.conf`.
- **nginx не перечитывается.** Плей сам делает `nginx -t`, и если конфиг стенда
  сломан — снимает его симлинк и падает с выводом теста. Прод при этом не
  затронут. Руками: `nginx -t`, потом `systemctl reload nginx`.
- **Сертификат истёк.** Обновляет общий certbot-таймер, hook перечитывает nginx.
  Проверить: `certbot certificates`.
- **Стенд нужно погасить целиком.**

  ```bash
  ssh root@89.104.68.81 'docker compose -p justea-web-dev down && rm -f /etc/nginx/sites-enabled/host-justea-dev.conf && nginx -t && systemctl reload nginx'
  ```

  Прод от этого не зависит.

## Проверка руками, что стенд закрыт

```bash
curl -I https://dev.justea.ru/            # 401 + X-Robots-Tag
curl -s https://dev.justea.ru/robots.txt  # Disallow: /
curl -I -u dev:ПАРОЛЬ https://dev.justea.ru/   # 200 + X-Robots-Tag
```

## Проверка локально, без VPS

Можно поднять стенд на ноутбуке и убедиться, что заголовки и пароль работают,
не выезжая на сервер:

```bash
cd infra/docker && NEXT_PUBLIC_SITE_URL=https://dev.justea.ru docker compose -f docker-compose.dev-stand.yml build
```

Дальше приложение запускается с `PORT=3002`, а рядом — контейнер `nginx` в том же
сетевом namespace (`--network container:<имя>`) с примонтированным
`host-justea-dev.conf`, самоподписанным сертификатом в
`/etc/letsencrypt/live/dev.justea.ru/` и сгенерированным `.htpasswd`. Тогда
`127.0.0.1:3002` из конфига работает ровно как на VPS, и конфиг проверяется тот
самый, что уедет на сервер. Синтаксис отдельно:

```bash
docker run --rm -v "$PWD/infra/nginx/host-justea-dev-http.conf:/etc/nginx/conf.d/default.conf:ro" nginx:1.27-alpine nginx -t
```
