# Задание 2. Всё то же — одним `compose.yaml`

В первом задании — сеть, база с четырьмя флагами, приложение с пятью.
`docker compose` описывает это одним файлом.

## Что сделать

**Шаг 1.** В папке `lessons/lesson-18/runlog` создать `compose.yaml`
(файл только ваш — в курсе его нет):

```yaml
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
```

Сопоставьте каждую строку с флагом `docker run` из задания 1 — таблица
в [конспекте](../README.md#docker-compose).

**Шаг 2.** Поднять:

```bash
docker compose up -d
docker compose ps -a
docker compose logs app
```

**Шаг 3.** Добавить в `app` (на уровень `environment`):

```yaml
    depends_on:
      db:
        condition: service_healthy
```

и в `db`:

```yaml
    healthcheck:
      test: ["CMD", "pg_isready", "-h", "localhost", "-U", "runlog"]
      interval: 2s
      retries: 15
```

Поднять с нуля:

```bash
docker compose down -v
docker compose up -d
docker compose ps
```

**Шаг 4.** Данные после `down` и `down -v`:

```bash
curl -X POST "localhost:3000/runs?case=C19633&status=passed"
docker compose down
docker compose up -d
sleep 2
curl localhost:3000/runs
docker compose down -v
docker compose up -d
sleep 2
curl localhost:3000/runs
docker compose down -v
```

`sleep 2` — `up -d` возвращается, как только `app` запущен, а слушать
порт он начинает чуть позже: `curl` сразу после `up` может не достучаться.

## Вопросы

1. В шаге 2 у `app` статус `Exited (1)`. Что в логах и почему так
   вышло, если адрес базы верный?
2. Что изменилось в шаге 3 в выводе `up` и `ps` — и почему теперь
   `app` работает?
3. Где лежат данные базы, что их удаляет и что — нет?

## Ответ

`docker compose ps -a`, шаг 2: …

`docker compose logs app`, главная строка: …

`docker compose ps`, шаг 3: …

`GET /runs` после `down`: … после `down -v`: …

1. …
2. …
3. …
