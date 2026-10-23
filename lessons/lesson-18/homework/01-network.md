# Задание 1. Второй контейнер и сеть

Приложению `runlog` нужна база. Postgres — в соседнем контейнере.
Как они найдут друг друга?

## Что сделать

Каждый шаг — запустить, записать вывод в «Ответ», только потом читать
дальше.

**Шаг 0.** Собрать образ (если не собран на уроке):

```bash
cd lessons/lesson-18/runlog
docker build -t runlog .
```

**Шаг 1.** База и приложение, адрес базы — `localhost`:

```bash
docker run -d --name runlog-db -e POSTGRES_USER=runlog -e POSTGRES_PASSWORD=runlog postgres:18-alpine
docker run --rm --init -e DATABASE_URL=postgres://runlog:runlog@localhost:5432/runlog runlog
```

`POSTGRES_USER` — со страницы образа: создать пользователя и базу
`runlog`. `DATABASE_URL` — адрес базы для `server.ts`: пользователь,
пароль, **хост**, порт, имя базы.

**Шаг 2.** Адрес — имя контейнера базы:

```bash
docker run --rm --init -e DATABASE_URL=postgres://runlog:runlog@runlog-db:5432/runlog runlog
```

**Шаг 3.** Своя сеть:

```bash
docker network create runlog-net
docker network connect runlog-net runlog-db
docker run -d --init --name runlog --network runlog-net -p 3000:3000 -e DATABASE_URL=postgres://runlog:runlog@runlog-db:5432/runlog runlog
docker logs runlog
curl -X POST "localhost:3000/runs?case=C19633&status=passed"
curl localhost:3000/runs
```

**Шаг 4.** Пересоздать базу — без паузы и с паузой:

```bash
docker rm -f runlog runlog-db
docker run -d --name runlog-db --network runlog-net -e POSTGRES_USER=runlog -e POSTGRES_PASSWORD=runlog postgres:18-alpine
docker run -d --init --name runlog --network runlog-net -p 3000:3000 -e DATABASE_URL=postgres://runlog:runlog@runlog-db:5432/runlog runlog
docker ps -a
docker logs runlog
```

Потом снова `docker rm -f runlog runlog-db` и те же два `docker run`,
но между ними — `sleep 5`; в конце — `curl localhost:3000/runs`.

**Шаг 5.** Данные базы — в томе:

```bash
docker rm -f -v runlog runlog-db
docker run -d --name runlog-db --network runlog-net -e POSTGRES_USER=runlog -e POSTGRES_PASSWORD=runlog -v runlog-pgdata:/var/lib/postgresql postgres:18-alpine
sleep 5
docker run -d --init --name runlog --network runlog-net -p 3000:3000 -e DATABASE_URL=postgres://runlog:runlog@runlog-db:5432/runlog runlog
curl -X POST "localhost:3000/runs?case=C19633&status=passed"
docker rm -f runlog runlog-db
```

Теперь сами: создайте оба контейнера заново **с тем же**
`-v runlog-pgdata:/var/lib/postgresql` и запросите `GET /runs`.

**Убрать за собой:**

```bash
docker rm -f -v runlog runlog-db
docker network rm runlog-net
docker volume rm runlog-pgdata
```

## Вопросы

1. Почему в шаге 1 база не нашлась по `localhost`, хотя она запущена
   и порт 5432 у неё есть?
2. Чем шаг 3 отличается от шага 2 — что сделала своя сеть?
3. В шаге 3 с `-p` опубликован только порт приложения. Почему базу
   публиковать не нужно?

## Ответ

| Шаг | Главная строка вывода |
|---|---|
| 1 | |
| 2 | |
| 3 | |
| 4, без паузы | |
| 4, с паузой | |
| 5, после пересоздания | |

1. …
2. …
3. …
