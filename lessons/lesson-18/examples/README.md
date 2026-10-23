# Примеры восемнадцатого урока

Всё, что было на экране, — и то, до чего на занятии не дошли (сеть,
`docker compose` на `runlog`), — в готовом виде и с объяснениями. Каждый
файл `.sh` копирует приложение [`runlog`](../runlog/) в
`/tmp/wl-docker-examples/<тема>/runlog`, выполняет команды урока и по ходу
рассказывает, что произошло.

```bash
bash lessons/lesson-18/examples/05-network.sh    # запустить любой
cd /tmp/wl-docker-examples/network/runlog        # копия остаётся — ковыряйте
```

Нужен Docker и два образа: `node:24-alpine`, `postgres:18-alpine` (скачаются
сами при первом запуске). Скрипты занимают порт 3000 и имена `runlog`,
`runlog-db`, `runlog-net`, тома `runlog-*` и `runlog_*` — и удаляют их
перед стартом и в конце. Файлы за пределами `/tmp` не трогают. Работают
в Linux и macOS; в Windows — из Git Bash или WSL (в PowerShell — нет).

| Файл | Тема | О чём |
|------|------|-------|
| [`01-first-containers.sh`](01-first-containers.sh) | Чужие образы | `docker run --rm`, новый контейнер — чистый лист, Postgres по документации образа: `-e`, `-d`, `--name`, `ps -a`, `logs`, `exec`; остановка не стирает, удаление — стирает |
| [`02-own-image.sh`](02-own-image.sh) | Свой образ | `Dockerfile` и `.dockerignore`, `docker build`, `docker history`, кэш слоёв при правке кода, тот же рецепт с одним `COPY . .` |
| [`03-run-options.sh`](03-run-options.sh) | Параметры запуска | Ctrl+C и процесс №1: `node` против `npm start` и `--init`; `-d --name`, `-p`, `-e`, своя команда вместо `CMD`, `--memory --cpus` |
| [`04-volumes.sh`](04-volumes.sh) | Тома | папка машины поверх `/app` и пропавший `node_modules`, именованный том и где он лежит, `node --watch`, что переживает удаление |
| [`05-network.sh`](05-network.sh) | Сеть | `localhost` в контейнере, `ENOTFOUND` без своей сети, `network create / connect`, гонка при старте, данные базы в томе |
| [`06-compose.sh`](06-compose.sh) | `docker compose` | `compose.yaml` против флагов, гонка на `up`, `healthcheck` и `depends_on`, `down` и `down -v`, `restart: on-failure` |

Объяснение каждой темы — в [конспекте урока](../README.md).
