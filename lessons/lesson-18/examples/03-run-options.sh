#!/usr/bin/env bash
# Урок 18 · Параметры запуска · процесс №1, --init, -d, --name, -p, -e, --memory
#
# Что здесь: почему Ctrl+C не останавливает node server.ts в контейнере и почему
# останавливает npm start · --init · в фоне и с именем · порт: машина:контейнер ·
# переменная окружения · своя команда вместо CMD · ограничения памяти и процессора.
#
#   bash lessons/lesson-18/examples/03-run-options.sh

source "$(dirname "$0")/_common.sh" run-options
docker build -q -t runlog . >/dev/null

# Нажать Ctrl+C через 2 секунды после старта и посмотреть, жив ли контейнер.
ctrl_c() {
  local name=$1; shift
  ( (sleep 2; printf '\003'; sleep 3) | script -qc "docker run --rm --name $name $*" /dev/null | sed 's/\r//' ) &
  sleep 6
  local alive=нет
  [ -n "$(docker ps -q --filter name="^$name\$")" ] && alive=да
  docker rm -f "$name" >/dev/null 2>&1 || true
  wait
  echo
  echo "  через 4 с после Ctrl+C контейнер работает: $alive"
}

say "Ctrl+C и процесс №1"
echo '$ docker run --rm runlog            # и Ctrl+C'
ctrl_c runlog runlog
sed 's/^CMD .*/CMD ["npm", "start"]/' Dockerfile > Dockerfile.npm
docker build -q -f Dockerfile.npm -t runlog:npm . >/dev/null
echo '$ docker run --rm runlog:npm        # CMD ["npm", "start"], и Ctrl+C'
ctrl_c runlog runlog:npm
echo '$ docker run --rm --init runlog     # и Ctrl+C'
ctrl_c runlog --init runlog
docker image rm runlog:npm >/dev/null
cat <<'TEXT'
  Программа в контейнере — процесс номер 1. Сигнал «остановись» (его шлёт
  Ctrl+C и docker stop) Linux доставляет процессу №1, только если тот сам
  попросил. node server.ts не просил — Ctrl+C ничего не делает, docker stop
  ждёт 10 секунд и убивает. npm просил: с CMD ["npm", "start"] Ctrl+C
  срабатывает, с ошибками npm в выводе. --init ставит процессом №1
  посредника docker-init, а он передаёт сигналы как надо.
TEXT

say "В фоне, с именем"
run docker run -d --init --name runlog runlog
sleep 1
run docker logs runlog
run docker rm -f runlog

say "Порт: -p машина:контейнер"
docker run -d --init --name runlog runlog >/dev/null; sleep 1
run curl -s localhost:3000/
docker rm -f runlog >/dev/null
docker run -d --init --name runlog -p 3000:3000 runlog >/dev/null; wait_http localhost:3000/
run curl -s localhost:3000/
run curl -s -X POST 'localhost:3000/runs?case=C19633&status=passed'
run curl -s localhost:3000/runs
docker rm -f runlog >/dev/null
docker run -d --init --name runlog -p 8080:3000 runlog >/dev/null; wait_http localhost:8080/
run curl -s localhost:8080/
run curl -s localhost:3000/
docker rm -f runlog >/dev/null
cat <<'TEXT'
  У контейнера своя сеть: без -p его порт 3000 снаружи не виден, хотя в
  Dockerfile написано EXPOSE 3000. Слева в -p — порт вашей машины, справа —
  контейнера. curl -X POST — метод запроса, без -X — GET. Код 7 у curl —
  «не удалось подключиться».
TEXT

say "Переменная: -e"
docker run -d --init --name runlog -p 3000:4000 -e PORT=4000 runlog >/dev/null; wait_http localhost:3000/
run docker logs runlog
docker rm -f runlog >/dev/null

say "Своя команда вместо CMD"
run docker run --rm runlog node --version
run docker run --rm runlog ls

say "Ограничения"
docker run -d --init --name runlog --memory 64m --cpus 0.5 runlog >/dev/null; sleep 1
run docker stats --no-stream --format 'table {{.Name}}\t{{.MemUsage}}\t{{.CPUPerc}}' runlog
docker rm -f runlog >/dev/null
cat <<'TEXT'
  По умолчанию контейнер ничем не ограничен. --memory и --cpus — потолок
  для этого контейнера. Настройки Resources в Docker Desktop — другое:
  это потолок для всей машины Docker, под всеми контейнерами сразу.
TEXT
