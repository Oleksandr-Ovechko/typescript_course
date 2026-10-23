#!/usr/bin/env bash
# Урок 18 · Свой образ · Dockerfile, слои, кэш, порядок строк
#
# Что здесь: Dockerfile и .dockerignore приложения runlog · docker build ·
# docker history — образ как стопка слоёв · правка кода: какие шаги берутся
# из кэша · тот же рецепт с одним COPY . . — и npm ci на каждую правку ·
# размер образа.
#
#   bash lessons/lesson-18/examples/02-own-image.sh
#   cd /tmp/wl-docker-examples/own-image/runlog      # копия остаётся

source "$(dirname "$0")/_common.sh" own-image

say "Рецепт"
run cat Dockerfile .dockerignore
cat <<'TEXT'
  FROM — основа (Node уже стоит); WORKDIR — папка внутри образа;
  COPY package*.json + RUN npm ci — пакеты; COPY . . — код; EXPOSE — только
  пометка «слушаю 3000», порт открывает -p при запуске; CMD — что запускать
  при старте контейнера. RUN выполняется при сборке, CMD — при каждом запуске.
  .dockerignore — что COPY не берёт.
TEXT

say "Сборка и слои"
tty 'docker build -t runlog .'
docker history runlog --format 'table {{.CreatedBy}}\t{{.Size}}' | head -8 || true
cat <<'TEXT'
  Каждый шаг Dockerfile — слой. Внизу — слои node:24-alpine, сверху наши:
  пакеты (~36 МБ) и код. <missing> в полном docker history значит только,
  что у слоя нет отдельного ID образа.
TEXT

say "Правка кода — что пересобирается"
echo "// правка $(date +%s%N)" >> server.ts
tty 'docker build -t runlog .' | grep -E '\[[2-5]/5\]' || true
cp "$APP_SRC/server.ts" server.ts
cat <<'TEXT'
  Шаг берётся из кэша, если не изменились он сам и всё, что выше. (Кэш ищет
  слой по содержимому файлов: правка каждый раз новая — date в комментарии.)
  Поменялся server.ts — заново только последний COPY . .; npm ci — из кэша.
TEXT

say "Тот же рецепт с одним COPY . . сверху"
cat > Dockerfile.naive <<'EOF'
FROM node:24-alpine
WORKDIR /app
COPY . .
RUN npm ci
EXPOSE 3000
CMD ["node", "server.ts"]
EOF
run cat Dockerfile.naive
docker build -q -f Dockerfile.naive -t runlog:naive . >/dev/null
echo "// правка $(date +%s%N)" >> server.ts
tty 'docker build -f Dockerfile.naive -t runlog:naive .' | grep -E '\[[2-4]/4\]' || true
cp "$APP_SRC/server.ts" server.ts
cat <<'TEXT'
  -f — какой файл рецепта взять. Здесь правка кода меняет COPY . ., а он
  выше npm ci — пакеты ставятся заново на каждую правку. Правило: что
  меняется редко — выше, что часто — ниже.
TEXT

say "Размер"
docker image rm runlog:naive >/dev/null
cat <<'TEXT'
  Тот же Dockerfile на основе node:24 — около 1,7 ГБ, на node:24-slim —
  около 380 МБ, на node:24-alpine — около 290 МБ (замер 22.10). Ещё меньше —
  многоступенчатая сборка без devDependencies:
  https://docs.docker.com/build/building/multi-stage/
TEXT
