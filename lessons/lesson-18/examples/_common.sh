#!/usr/bin/env bash
# Урок 18 · Общая часть всех примеров. Сама по себе не запускается:
# каждый пример подключает её строкой
#
#   source "$(dirname "$0")/_common.sh" <имя-папки>
#
# Что делает: сносит и заново собирает /tmp/wl-docker-examples/<имя-папки>/runlog —
# копию учебного приложения из lessons/lesson-18/runlog (папка называется runlog:
# по ней docker compose называет сеть и тома). Перед примером и после него удаляет
# контейнеры runlog и runlog-db, сеть runlog-net, тома runlog-* и runlog_*.
# Образы node:24-alpine и postgres:18-alpine не трогает — скачает, если их нет.
#
# Занимает порт 3000: не запускайте, пока на нём работает что-то своё.
# Файлы за пределами /tmp не трогает; Docker — только то, что назван выше.

set -euo pipefail
NAME="${1:?_common.sh: передайте имя папки}"
APP_SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")/../runlog" && pwd)"
SANDBOX="/tmp/wl-docker-examples/$NAME"

command -v docker >/dev/null || { echo "Нужен Docker: docker --version" >&2; exit 1; }

say() { printf '\n━━ %s ━━\n' "$1"; }
# Показать команду и выполнить её; ошибка команды пример не прерывает.
show() {
  local out="\$" a
  for a in "$@"; do
    if [[ $a =~ ^[A-Za-z0-9_./:=@%+,-]+$ ]]; then out+=" $a"
    elif [[ $a != *"'"* ]]; then out+=" '$a'"
    else out+=" \"$a\""; fi
  done
  echo "$out"
}
run() { show "$@"; "$@" 2>&1 || echo "[код возврата: $?]"; }
# Как в терминале шириной 100: у сборки и compose — только последний кадр.
tty() {
  echo "\$ $1"
  script -qc "stty cols 100; $1" /dev/null | sed 's/\x1b\[[0-9;?]*[a-zA-Z]//g; s/\r/\n/g' \
    | grep -v '^\s*$' | awk '/^\[\+\] /{blk=""} {blk=blk $0 "\n"} END{printf "%s", blk}' \
    | grep -vE 'exporting (manifest|config|attestation)|manifest list|unpacking to|=> => resolve docker|Info → ' || true
}
wait_http() { for _ in $(seq 1 40); do curl -s -o /dev/null "$1" && return 0; sleep 0.25; done; echo "не поднялся: $1"; }

cleanup() {
  docker rm -f runlog runlog-db >/dev/null 2>&1 || true
  if [ -f "$SANDBOX/runlog/compose.yaml" ]; then (cd "$SANDBOX/runlog" && docker compose down -v >/dev/null 2>&1) || true; fi
  docker network rm runlog-net >/dev/null 2>&1 || true
  docker volume rm runlog-modules runlog-pgdata >/dev/null 2>&1 || true
}
trap cleanup EXIT
cleanup

if [ -d "$SANDBOX/runlog/node_modules" ]; then
  # на Linux точку подключения тома создаёт Docker от root — убрать тоже им
  docker run --rm -v "$SANDBOX/runlog":/w node:24-alpine rmdir /w/node_modules >/dev/null 2>&1 || true
fi
rm -rf "$SANDBOX" && mkdir -p "$SANDBOX"
cp -r "$APP_SRC" "$SANDBOX/runlog" && rm -rf "$SANDBOX/runlog/node_modules"
cd "$SANDBOX/runlog"
