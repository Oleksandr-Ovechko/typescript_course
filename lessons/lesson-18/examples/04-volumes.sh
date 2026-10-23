#!/usr/bin/env bash
# Урок 18 · Тома · папка с машины, именованный том, правка без пересборки
#
# Что здесь: -v папка:/app — папка машины поверх папки контейнера и почему
# пропадает node_modules · именованный том — где он лежит на самом деле ·
# node --watch: правка server.ts без docker build · что переживает удаление
# контейнера.
#
#   bash lessons/lesson-18/examples/04-volumes.sh
#   cd /tmp/wl-docker-examples/volumes/runlog      # копия остаётся

source "$(dirname "$0")/_common.sh" volumes
docker build -q -t runlog . >/dev/null

say "Папка с машины поверх /app"
echo "\$ docker run --rm --init -v \"\$PWD\":/app runlog"
docker run --rm --init -v "$PWD":/app runlog 2>&1 | grep -E '^Error' || true
cat <<'TEXT'
  -v папка_машины:папка_контейнера — подключить вашу папку поверх папки
  контейнера. Всё, что лежало в /app образа, больше не видно, — в том числе
  node_modules: пакеты ставил npm ci внутри образа, а в вашей папке их нет.
  $PWD — текущая папка (в PowerShell — ${PWD}).
TEXT

say "Именованный том для node_modules"
run docker run -d --init --name runlog -p 3000:3000 -v "$PWD":/app -v runlog-modules:/app/node_modules runlog
wait_http localhost:3000/
run curl -s localhost:3000/
run docker volume ls --filter name=runlog
run docker volume inspect runlog-modules --format '{{.Mountpoint}}'
run ls -la node_modules
cat <<'TEXT'
  Второй -v — не путь, а имя: это хранилище, которым управляет Docker. При
  первом подключении Docker заполнил его тем, что лежало в /app/node_modules
  образа. Лежит том у Docker (Mountpoint), а не в вашей папке: node_modules
  в папке — пустая, это только место подключения (на Linux — от root).
TEXT

say "Правка без пересборки — node --watch"
docker rm -f runlog >/dev/null
run docker run -d --init --name runlog -p 3000:3000 -v "$PWD":/app -v runlog-modules:/app/node_modules runlog node --watch server.ts
wait_http localhost:3000/
sed -i "s/service: 'runlog'/service: 'runlog-dev'/" server.ts
sleep 2
run curl -s localhost:3000/
run docker logs runlog
cat <<'TEXT'
  Команда после имени образа — вместо CMD. node --watch перезапускает
  программу, когда файл меняется; файл ваш, на вашей машине, — контейнер
  видит правку сразу, docker build не нужен.
TEXT

say "Что переживает удаление контейнера"
run docker rm -f runlog
run docker volume ls --filter name=runlog
run grep -c runlog-dev server.ts
cat <<'TEXT'
  Контейнера нет, а том и правка в server.ts остались: том живёт отдельно
  от контейнера, server.ts — файл вашей машины. Пропадает только то, что
  записано внутри контейнера мимо томов.
TEXT
