#!/usr/bin/env bash
# Урок 18 · Чужие образы · Node и Postgres без установки
#
# Что здесь: docker run --rm · команда внутри контейнера · новый контейнер —
# чистый лист · Postgres по документации образа: -e, -d, --name · docker ps -a,
# logs, exec, stop, rm · остановка не стирает файлы контейнера, удаление — стирает.
#
#   bash lessons/lesson-18/examples/01-first-containers.sh

source "$(dirname "$0")/_common.sh" first-containers

say "Первый запуск"
run docker run --rm node:24-alpine node --version
cat <<'TEXT'
  docker run — создать контейнер из образа и запустить; --rm — удалить его,
  когда команда закончится; node:24-alpine — образ; node --version — что
  выполнить внутри. Node в контейнере свой, не тот, что у вас на машине.
  Интерактивно — docker run --rm -it node:24-alpine (консоль Node)
  или … node:24-alpine sh (командная строка Alpine; bash там нет).
TEXT

say "Новый контейнер — чистый лист"
run docker run --rm node:24-alpine sh -c 'echo привет > /tmp/note.txt; cat /tmp/note.txt'
run docker run --rm node:24-alpine cat /tmp/note.txt
cat <<'TEXT'
  Второй контейнер начал с чистого образа — файла, записанного в первом,
  в нём нет. Поэтому данные, которые жалко, кладут в тома (04-volumes.sh).
TEXT

say "Postgres: без пароля не стартует"
run docker run --name runlog-db postgres:18-alpine
run docker ps -a --filter name=runlog-db --format '{{.Names}}  {{.Status}}'
run docker rm -v runlog-db
cat <<'TEXT'
  Чужой образ ждёт настроек — какие, написано на его странице:
  hub.docker.com/_/postgres, «Environment Variables». Контейнер с ошибкой
  остался остановленным: docker ps показывает только работающие, -a — все.
  -v у docker rm — удалить и безымянный том контейнера: образ Postgres
  создаёт такой на каждый контейнер, под данные базы (/var/lib/postgresql).
TEXT

say "Postgres: как просит документация"
run docker run -d --name runlog-db -e POSTGRES_PASSWORD=runlog postgres:18-alpine
sleep 4
docker logs runlog-db 2>&1 | tail -1
run docker exec runlog-db psql -U postgres -c 'select version();'
cat <<'TEXT'
  -d — в фоне (команда вернула ID контейнера); -e — переменная окружения;
  docker logs — что контейнер напечатал; docker exec — выполнить команду
  в уже работающем контейнере (psql лежит в том же образе).
TEXT

say "Остановка не стирает — удаление стирает"
run docker exec runlog-db sh -c 'echo привет > /tmp/note.txt'
run docker stop runlog-db
run docker start runlog-db
run docker exec runlog-db cat /tmp/note.txt
run docker rm -f -v runlog-db
run docker run --rm postgres:18-alpine cat /tmp/note.txt
cat <<'TEXT'
  stop + start — тот же контейнер, файл на месте. rm — контейнера больше нет,
  и новый из того же образа файла не видит. Пропадает при удалении, а не при
  остановке; --rm удаляет сам, поэтому кажется, что «пропало при остановке».
  Данные самой базы — особый случай: они в безымянном томе, и docker rm без -v
  оставляет его висеть (docker volume ls -f dangling=true); новый контейнер
  получает новый, пустой.
TEXT
