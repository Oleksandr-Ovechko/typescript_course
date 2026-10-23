#!/usr/bin/env bash
# Урок 18 · docker compose · всё то же — одним файлом
#
# Что здесь: compose.yaml для runlog и Postgres — строка файла против флага
# docker run · up и гонка при старте · healthcheck и depends_on · down и down -v ·
# restart: on-failure — compose поднимает упавшее сам.
#
#   bash lessons/lesson-18/examples/06-compose.sh
#   cd /tmp/wl-docker-examples/compose/runlog      # compose.yaml остаётся

source "$(dirname "$0")/_common.sh" compose

say "compose.yaml"
cat > compose.yaml <<'EOF'
services:
  app:
    build: .
    init: true
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://runlog:runlog@db:5432/runlog

  db:
    image: postgres:18-alpine
    environment:
      POSTGRES_USER: runlog
      POSTGRES_PASSWORD: runlog
    volumes:
      - pgdata:/var/lib/postgresql

volumes:
  pgdata:
EOF
run cat compose.yaml
cat <<'TEXT'
  services — два контейнера (два docker run); build: . — docker build по
  Dockerfile рядом; image — готовый образ; init — --init; ports — -p;
  environment — -e; volumes в сервисе — -v; volumes внизу — объявить
  именованный том. Хост db в DATABASE_URL — имя сервиса: compose сам
  создаёт сеть, и сервисы находят друг друга по имени.
TEXT

say "up — и гонка"
tty 'docker compose up -d'
sleep 3
run docker compose ps -a --format 'table {{.Name}}\t{{.Status}}'
docker compose logs app 2>&1 | grep -E 'Error: connect' | head -1 || true
cat <<'TEXT'
  up — собрать, создать сеть, том, контейнеры и запустить; -d — в фоне.
  Имена — папка_что: runlog_default, runlog-app-1. app упал: имя db нашлось,
  но база ещё не готова — гонка, как в 05-network.sh.
TEXT

say "healthcheck и depends_on"
cat > compose.yaml <<'EOF'
services:
  app:
    build: .
    init: true
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://runlog:runlog@db:5432/runlog
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:18-alpine
    environment:
      POSTGRES_USER: runlog
      POSTGRES_PASSWORD: runlog
    volumes:
      - pgdata:/var/lib/postgresql
    healthcheck:
      test: ["CMD", "pg_isready", "-h", "localhost", "-U", "runlog"]
      interval: 2s
      retries: 15

volumes:
  pgdata:
EOF
docker compose down -v >/dev/null 2>&1
tty 'docker compose up -d'
run docker compose ps --format 'table {{.Name}}\t{{.Status}}'
cat <<'TEXT'
  healthcheck — как проверить, что сервис готов, а не просто запущен:
  pg_isready раз в 2 секунды, до 15 попыток. -h localhost — проверять по
  сети: через файл-сокет pg_isready говорит «готов» ещё во время первой
  настройки базы. depends_on … service_healthy — не запускать app, пока db
  не здоров. down -v перед up — начать с чистого листа.
TEXT

say "down и down -v"
wait_http localhost:3000/
run curl -s -X POST 'localhost:3000/runs?case=C19633&status=passed'
tty 'docker compose down'
docker compose up -d >/dev/null 2>&1; wait_http localhost:3000/
run curl -s localhost:3000/runs
tty 'docker compose down -v'
docker compose up -d >/dev/null 2>&1; wait_http localhost:3000/
run curl -s localhost:3000/runs
cat <<'TEXT'
  down удаляет контейнеры и сеть, тома не трогает — данные на месте.
  down -v удаляет и тома — данные пропали. Каждый день хватает: up -d, ps,
  logs -f <сервис>, down, exec <сервис> <команда>.
TEXT

say "restart: on-failure — вместо healthcheck"
docker compose down -v >/dev/null 2>&1
sed -i -e '/depends_on:/,/condition: service_healthy/d' -e '/healthcheck:/,/retries: 15/d' compose.yaml
sed -i 's/^    init: true$/    init: true\n    restart: on-failure/' compose.yaml
run cat compose.yaml
docker compose up -d >/dev/null 2>&1
sleep 7
run docker compose ps -a --format 'table {{.Name}}\t{{.Status}}'
run docker inspect runlog-app-1 --format '{{.RestartCount}}'
cat <<'TEXT'
  Приложение падало на гонке — Docker поднимал его снова, пока база не
  стала готова. docker inspect — все сведения о контейнере, --format —
  одно поле. Работает, но healthcheck честнее. Это и есть оркестрация:
  за контейнерами следит программа. На кластере из многих машин то же
  делает Kubernetes.
TEXT
