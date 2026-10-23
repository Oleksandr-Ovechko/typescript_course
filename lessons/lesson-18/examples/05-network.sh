#!/usr/bin/env bash
# Урок 18 · Второй контейнер и сеть · приложение и Postgres
#
# Что здесь: localhost внутри контейнера — сам контейнер · по имени без своей
# сети — ENOTFOUND · своя сеть: docker network create / connect / --network ·
# база готова не сразу — пауза · данные базы в именованном томе переживают
# пересоздание контейнера.
#
#   bash lessons/lesson-18/examples/05-network.sh

source "$(dirname "$0")/_common.sh" network
docker build -q -t runlog . >/dev/null
URL_LOCAL=postgres://runlog:runlog@localhost:5432/runlog
URL=postgres://runlog:runlog@runlog-db:5432/runlog

say "localhost — это сам контейнер"
run docker run -d --name runlog-db -e POSTGRES_USER=runlog -e POSTGRES_PASSWORD=runlog postgres:18-alpine
run sleep 5
echo "\$ docker run --rm --init -e DATABASE_URL=$URL_LOCAL runlog"
docker run --rm --init -e DATABASE_URL=$URL_LOCAL runlog 2>&1 | grep -E 'Error: connect' || true
cat <<'TEXT'
  DATABASE_URL — адрес базы: пользователь, пароль, хост, порт, имя базы.
  localhost внутри контейнера — сам этот контейнер, runlog. Базы в нём нет.
  У каждого контейнера свой localhost.
TEXT

say "По имени — без своей сети не работает"
echo "\$ docker run --rm --init -e DATABASE_URL=$URL runlog"
docker run --rm --init -e DATABASE_URL=$URL runlog 2>&1 | grep -E '^Error' || true
cat <<'TEXT'
  Контейнеры, запущенные без --network, попадают в общую сеть по умолчанию,
  а в ней друг друга по имени не находят.
TEXT

say "Своя сеть"
run docker network create runlog-net
run docker network connect runlog-net runlog-db
run docker run -d --init --name runlog --network runlog-net -p 3000:3000 -e DATABASE_URL=$URL runlog
wait_http localhost:3000/
run docker logs runlog
run curl -s -X POST 'localhost:3000/runs?case=C19633&status=passed'
run curl -s localhost:3000/runs
cat <<'TEXT'
  network create — создать сеть; network connect — подключить к ней уже
  работающий контейнер; --network — запустить новый сразу в ней. Внутри
  своей сети контейнеры находят друг друга по имени. Наружу опубликован
  только порт приложения; к базе ходит только runlog, по внутренней сети.
TEXT

DB=(docker run -d --name runlog-db --network runlog-net -e POSTGRES_USER=runlog -e POSTGRES_PASSWORD=runlog)
APP=(docker run -d --init --name runlog --network runlog-net -p 3000:3000 -e DATABASE_URL=$URL runlog)

say "Без паузы приложение падает"
run docker rm -f -v runlog runlog-db
run "${DB[@]}" postgres:18-alpine
run "${APP[@]}"
sleep 3
run docker ps -a --filter name='^runlog$' --format '{{.Names}}  {{.Status}}'
docker logs runlog 2>&1 | grep -E 'Error: connect' | head -1 || true
cat <<'TEXT'
  Новая база пару секунд готовится, а runlog подключается к ней сразу при
  старте — и падает. Руками — подождать (sleep 5); compose умеет ждать
  сам (06-compose.sh).
TEXT

say "Данные базы — в томе"
run docker rm -f -v runlog runlog-db
run "${DB[@]}" -v runlog-pgdata:/var/lib/postgresql postgres:18-alpine
run sleep 5
run "${APP[@]}"
wait_http localhost:3000/
run curl -s -X POST 'localhost:3000/runs?case=C19633&status=passed'
run docker rm -f runlog runlog-db
run "${DB[@]}" -v runlog-pgdata:/var/lib/postgresql postgres:18-alpine
run sleep 5
run "${APP[@]}"
wait_http localhost:3000/
run curl -s localhost:3000/runs
cat <<'TEXT'
  Контейнер базы удалён и создан заново — результат на месте: Postgres хранит
  данные в /var/lib/postgresql (страница образа), а там теперь именованный
  том. -v у docker rm удаляет безымянные тома контейнера; именованные —
  только docker volume rm.
TEXT
