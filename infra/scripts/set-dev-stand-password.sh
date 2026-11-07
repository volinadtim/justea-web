#!/usr/bin/env bash
#
# Задаёт пароль basic auth для dev-стенда dev.justea.ru.
#
# Пароль нигде не появляется: ни на экране (ввод со скрытым эхом), ни в истории
# команд (скрипт не принимает его аргументом), ни в репозитории. Он пишется
# только в ~/.justea/dev-stand.env с правами 600.
#
#   ./infra/scripts/set-dev-stand-password.sh
#
# Дальше перед запуском плеев:
#
#   . ~/.justea/dev-stand.env
#
# Пустой ввод = сгенерировать случайный пароль, не печатая его на экран.
# Посмотреть значение потом: cat ~/.justea/dev-stand.env

set -eu

ENV_DIR="${HOME}/.justea"
ENV_FILE="${ENV_DIR}/dev-stand.env"
MIN_LEN=12
GEN_LEN=24

die() {
    printf '%s\n' "$*" >&2
    exit 1
}

restore_echo() {
    stty echo 2>/dev/null || true
}
trap 'restore_echo; printf "\nОтменено, файл не изменён.\n" >&2; exit 130' INT TERM

[ -t 0 ] || die "Нужен терминал: пароль вводится со скрытым эхом. Запусти скрипт вручную."

if [ -e "${ENV_FILE}" ]; then
    printf 'Файл %s уже есть, пароль в нём будет заменён.\n' "${ENV_FILE}"
fi

printf 'Пароль для dev.justea.ru (не меньше %d символов).\n' "${MIN_LEN}"
printf 'Пустой ввод — сгенерировать случайный, он не будет показан.\n'
printf 'Пароль: '
if ! IFS= read -rs password; then
    printf '\n'
    die "Ввод прерван, файл не изменён."
fi
printf '\n'

if [ -z "${password}" ]; then
    password=$(LC_ALL=C tr -dc 'A-Za-z0-9' < /dev/urandom | head -c "${GEN_LEN}" || true)
    [ "${#password}" -eq "${GEN_LEN}" ] || die "Не удалось сгенерировать пароль."
    generated=yes
else
    generated=no
    [ "${#password}" -ge "${MIN_LEN}" ] || \
        die "Слишком короткий пароль: нужно не меньше ${MIN_LEN} символов. Стенд смотрит в интернет."
    printf 'Повтори пароль: '
    if ! IFS= read -rs confirm; then
        printf '\n'
        die "Ввод прерван, файл не изменён."
    fi
    printf '\n'
    [ "${password}" = "${confirm}" ] || die "Пароли не совпали, файл не изменён."
    unset confirm
fi

# Экранируем одинарные кавычки, чтобы файл корректно читался через `.`
escaped=${password//\'/\'\\\'\'}

umask 077
mkdir -p "${ENV_DIR}"
cat > "${ENV_FILE}" <<EOF
# Пароль basic auth dev-стенда dev.justea.ru. Создан set-dev-stand-password.sh.
# В git не попадает: лежит вне репозитория. Права 600.
export JUSTEA_DEV_PASSWORD='${escaped}'
EOF
chmod 600 "${ENV_FILE}"

unset password escaped

printf '\nПароль записан в %s (права 600).\n' "${ENV_FILE}"
if [ "${generated}" = yes ]; then
    printf 'Пароль сгенерирован (%d символов) и на экран не выводился.\n' "${GEN_LEN}"
    printf 'Посмотреть, когда понадобится зайти на стенд: cat %s\n' "${ENV_FILE}"
fi
printf '\nДальше:\n'
printf '  . %s\n' "${ENV_FILE}"
printf '  ansible-playbook -i infra/ansible/inventory.ini infra/ansible/dev-stand-setup.yml -e dev_basic_auth_password="$JUSTEA_DEV_PASSWORD"\n'
