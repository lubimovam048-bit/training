#!/bin/sh
# Выгрузка сайта sims-bday на хостинг Beget по SFTP.
# Запуск: ./deploy.sh   (или: make deploy)
# Пароль берётся из файла .deploy-password рядом с этим скриптом (файл в .gitignore).
set -eu

ROOT=$(cd "$(dirname "$0")" && pwd)
PASS_FILE="$ROOT/.deploy-password"

# Режим askpass: ssh вызывает этот же скрипт, чтобы прочитать пароль из файла.
if [ "${DEPLOY_ASKPASS:-}" = 1 ]; then
  head -n 1 "$PASS_FILE" | tr -d '\r\n'
  exit 0
fi

HOST=marinkwz.beget.tech
PORT=22
LOGIN=marinkwz
LOCAL_DIR="$ROOT/sims-bday"
REMOTE_DIR=sims-party/public_html

if [ ! -s "$PASS_FILE" ]; then
  echo "Нет пароля. Запишите его одной строкой в файл: $PASS_FILE" >&2
  exit 1
fi
if [ ! -d "$LOCAL_DIR" ]; then
  echo "Не найдена папка сайта: $LOCAL_DIR" >&2
  exit 1
fi

# Команды для sftp: создать недостающие папки по пути, затем залить всё содержимое сайта.
# sftp в пакетном режиме (-b) запрещает вход по паролю, поэтому команды идут через stdin.
cmds=$(mktemp)
log=$(mktemp)
trap 'rm -f "$cmds" "$log"' EXIT
path=""
for part in $(printf '%s' "$REMOTE_DIR" | tr '/' ' '); do
  path="${path:+$path/}$part"
  printf -- '-mkdir "%s"\n' "$path"
done > "$cmds"
printf 'lcd "%s"\nput -r . "%s"\nbye\n' "$LOCAL_DIR" "$REMOTE_DIR" >> "$cmds"

echo "Заливаю $LOCAL_DIR → $LOGIN@$HOST:$REMOTE_DIR"
status=0
DEPLOY_ASKPASS=1 SSH_ASKPASS="$ROOT/deploy.sh" SSH_ASKPASS_REQUIRE=force DISPLAY="${DISPLAY:-:0}" \
  sftp -P "$PORT" \
    -o StrictHostKeyChecking=accept-new \
    -o PreferredAuthentications=password,keyboard-interactive \
    -o NumberOfPasswordPrompts=1 \
    "$LOGIN@$HOST" < "$cmds" > "$log" 2>&1 || status=$?

# Ошибки, кроме отказа создать папку, которая уже есть (строки «remote mkdir …»).
errors=$(grep -iE "couldn't|permission denied|not found|no such file|failure|connection closed|lost connection" "$log" \
  | grep -v "^remote mkdir" || true)

if [ "$status" -ne 0 ] || [ -n "$errors" ]; then
  cat "$log" >&2
  echo "Выгрузка не удалась." >&2
  exit 1
fi

echo "Готово: залито файлов — $(find "$LOCAL_DIR" -type f | wc -l | tr -d ' ')."
