# Урок 18. Docker — от первого контейнера до тестов в контейнере

Тест, зелёный на вашей машине, на сервере может упасть: там Linux, свои
версии Node и браузера, свои шрифты. Docker запускает **одну и ту же**
Linux-среду на любом компьютере — у вас, на раннере CI, на сервере QA.
Этот урок — Docker с нуля на маленьком приложении
[`runlog`](runlog/) и потом на `wl-e2e`. И напоследок — что делает
CI с вашим PR.

Урок шёл пт 23.10 и был **последним занятием курса**. На занятии прошли
чужие образы, свой образ, параметры запуска и тома. Сеть и `docker compose`
на `runlog` не успели — они ниже, в примерах и в домашке; по `wl-e2e`
и CI — только обзор. Всё, что здесь описано, можно повторить у себя:
команды и вывод — из настоящего запуска.

## Что было на занятии

| Тема | Пример |
|------|--------|
| Уточнения к прозвучавшему | [раздел ниже](#уточнения-к-занятию) |
| Зачем Docker · образ, контейнер, том, сеть | — |
| Чужие образы: Node и Postgres без установки | [`01-first-containers.sh`](examples/01-first-containers.sh) |
| Свой образ: `Dockerfile`, слои, кэш, размер | [`02-own-image.sh`](examples/02-own-image.sh) |
| Параметры запуска: процесс №1, `--init`, `-p`, `-e` | [`03-run-options.sh`](examples/03-run-options.sh) |
| Тома: папка с машины, именованный том, `--watch` | [`04-volumes.sh`](examples/04-volumes.sh) |
| Второй контейнер и сеть *(на занятии не успели)* | [`05-network.sh`](examples/05-network.sh) |
| `docker compose` *(на занятии — только обзор)* | [`06-compose.sh`](examples/06-compose.sh) |
| Docker в `wl-e2e` | [раздел ниже](#docker-в-wl-e2e) |
| Оркестрация и Kubernetes | [раздел ниже](#оркестрация-и-kubernetes) |
| CI: что происходит с вашим PR | [раздел ниже](#ci-что-происходит-с-вашим-pr) |

Таблица примеров — [`examples/README.md`](examples/README.md).
Домашка — [`homework/`](homework/README.md).

Примеры запускаются одной командой: `bash lessons/lesson-18/examples/05-network.sh`.
Нужен Docker и образы `node:24-alpine`, `postgres:18-alpine`.

**Windows (PowerShell)** — четыре отличия от команд ниже:

| | Linux, macOS | Windows PowerShell |
|---|---|---|
| папка «здесь» в `-v` | `"$PWD"` | `${PWD}` (не проверено; не сработает — полный путь к папке) |
| `curl` | `curl` | `curl.exe` — просто `curl` в PowerShell другая команда; GET можно открыть в браузере |
| перенос длинной команды | `\` | писать в одну строку |
| создать или поправить файл (`cat > … <<'EOF'`, `sed -i`) | да (macOS: `sed -i ''`) | нет — в VS Code |

Примеры `.sh` в Windows — из Git Bash или WSL.

---

## Уточнения к занятию

Места, где на занятии прозвучала неточность. Всё проверено запуском,
кодом `wl-e2e` и документацией Docker.

**1. Установка идёт при сборке — в образ, а не при запуске контейнера.**
`Dockerfile` — рецепт. `docker build` выполняет его шаги (`RUN npm ci`
ставит пакеты именно тогда), и результат — **образ**: система, пакеты,
код, всё уже установлено. **Контейнер** — запущенный образ: он ничего
не ставит и стартует за доли секунды. Рецепт — `Dockerfile`, ингредиенты —
образ, салат — контейнер. [Свой образ](#свой-образ).

**2. `EXPOSE` порт не открывает.** Это пометка «сервер слушает 3000».
Снаружи контейнер доступен только через `-p` при запуске — без него
`curl localhost:3000` отвечает «не удалось подключиться», хотя `EXPOSE`
в `Dockerfile` есть.

**3. `CMD` можно писать и строкой.** `CMD node --version` — «форма
оболочки»: Docker выполнит её через `/bin/sh -c`. Массив
`CMD ["node", "server.ts"]` — «форма exec»: программа запускается сама,
без оболочки, и становится процессом №1. Для серверов пишут массив.

**4. Ctrl+C и процесс №1 зависят от того, что в `CMD`.** С
`CMD ["node", "server.ts"]` Ctrl+C контейнер **не** останавливает,
`docker stop` ждёт 10 секунд. С `CMD ["npm", "start"]` — останавливает,
с ошибками `npm error signal SIGINT` в выводе: `npm` сам обрабатывает
сигнал. `--init` чинит первый случай. [Параметры запуска](#параметры-запуска).

**5. Прервать команду в терминале на Mac — Control+C.** `Command+C` —
копировать.

**6. Данные контейнера стирает удаление, а не остановка.** `docker stop`,
потом `docker start` — тот же контейнер, все файлы на месте. Пропадают
они при `docker rm` — и при `--rm`, который удаляет контейнер сам, как
только тот остановился.

**7. Именованный том лежит у Docker, а не в папке проекта.**
`docker volume inspect runlog-modules` → `/var/lib/docker/volumes/runlog-modules/_data`.
Пустая папка `node_modules`, которая появляется в `runlog` после
`-v runlog-modules:/app/node_modules`, — только место подключения
(на Linux — от `root`). Пакеты контейнер берёт из тома, а не с вашей
машины. Ни в `git`, ни в проект том не попадает.

**8. Регрессия на сервере QA тоже идёт в Docker** — та же команда, что
ниже в разделе про `wl-e2e`: `docker compose -f docker-compose.dev.yml
run … monolith-dev …`.

**9. В CI в Docker идёт не всё.** Гейт (`yarn gate`) — на раннерах GitHub
без Docker: `actions/setup-node` ставит Node прямо на машину. В Docker —
только прогон изменённых спеков, на раннере компании. [CI](#ci-что-происходит-с-вашим-pr).

**10. На черновом PR проверки запускаются.** Воркфлоу PR в `wl-e2e`
реагирует на открытие и каждый пуш, черновик это или нет: черновой
PR, открытый 21.10, запустил «Targeted PR Tests» через три секунды.
Черновик только не даёт смержить, пока не нажата «Ready for review».

**11. Ресурсы в настройках Docker Desktop — на всю машину Docker**, а не
на каждый контейнер: «maximum number of CPUs to be used by Docker
Desktop», «RAM allocated to the Docker VM». Потолок одному контейнеру —
`--memory` и `--cpus`. По умолчанию контейнер ничем не ограничен.

**12. Мелочи.** `<missing>` в `docker history` — у слоя нет отдельного
ID образа, а не «ещё не собрано»: так же выглядят слои скачанного
`node:24-alpine`. `node --watch` не «пересобирает», а перезапускает
программу: типы Node убирает при каждом запуске.

---

## Зачем Docker

Что отличается между вашей машиной и сервером, на котором идёт CI или
регрессия:

| Что | У вас | На сервере |
|---|---|---|
| система | Windows, macOS | Linux |
| Node | что поставил `nvm` | что поставили там |
| браузер | скачан `yarn playwright install` | свой, своей версии |
| шрифты, системные библиотеки браузера | свои | другие — другая ширина текста, другие переносы |
| переводы строк, регистр имён файлов | Windows: CRLF, `Page.ts` = `page.ts` | LF, `Page.ts` ≠ `page.ts` |

Версии Node и пакетов проект уже фиксирует (`.nvmrc`, `yarn.lock`),
но система, браузер и шрифты — нет. Docker фиксирует всё: среда описана
в файле и у всех собирается одинаково. Отсюда правило README проекта:
«локальный зелёный — черновик».

### Четыре слова

```
            реестр (Docker Hub, mcr.microsoft.com)
               │  docker pull
               ▼
 Dockerfile ─► ОБРАЗ ──── docker run ───► КОНТЕЙНЕР ◄──► ТОМ   папка, которая
 рецепт        заготовка:                 запущенный     переживает контейнер
               система + программы        образ
                                             │
                                           СЕТЬ  контейнеры видят друг друга по имени
```

- **образ** — заготовка: система, программы, файлы. Сам не работает;
- **контейнер** — запущенный образ. Из одного образа — сколько угодно
  контейнеров, каждый начинает с чистого листа;
- **том** — папка, которая живёт отдельно от контейнера;
- **сеть** — через неё контейнеры разговаривают друг с другом.

**Это не виртуальная машина.** Контейнер — обычный процесс Linux, которому
выдали свои файлы, свою сеть и свои имена; поэтому он стартует за доли
секунды. На Linux Docker работает прямо в системе. На Windows Docker
Desktop запускает Linux в WSL 2, на macOS — маленькую виртуальную
Linux-машину; контейнеры — процессы внутри неё. Команды `docker …`
у всех одинаковые.

---

## Чужие образы

[`01-first-containers.sh`](examples/01-first-containers.sh)

```bash
docker --version
docker compose version
docker run --rm node:24-alpine node --version
```

```
v24.22.1
```

| Часть | Что значит |
|---|---|
| `docker run` | создать контейнер из образа и запустить |
| `--rm` | удалить контейнер, когда команда закончится |
| `node:24-alpine` | какой образ: `node` с Docker Hub, тег `24-alpine` — Node 24 на Alpine Linux |
| `node --version` | что выполнить внутри |

Node в контейнере свой, не тот, что у вас. Образа нет — `docker run`
сначала скачает его; скачать заранее — `docker pull node:24-alpine`.
Тег не написан — значит `latest`, «какой сегодня свежий»; в проекте
тег всегда явный (`playwright:v1.60.0-noble`), иначе сборка сегодня
и завтра — разные.

**Внутрь контейнера:** `docker run --rm -it node:24-alpine` — консоль
Node; `… node:24-alpine sh` — командная строка Alpine (`bash` там нет).
`-it` — два флага: `-i` передаёт в контейнер то, что вы печатаете, `-t`
даёт ему терминал. Выход — `exit` (из Node — `.exit`).

**Новый контейнер — чистый лист.** Файл, записанный в одном контейнере,
во втором из того же образа не виден:

```
$ docker run --rm node:24-alpine cat /tmp/note.txt
cat: can't open '/tmp/note.txt': No such file or directory
```

### Postgres за одну команду

Чужой образ ждёт настроек — какие, написано на его странице:
`hub.docker.com/_/postgres`, раздел «Environment Variables».

```bash
docker run --name runlog-db postgres:18-alpine        # ошибка: нет POSTGRES_PASSWORD
docker ps -a                                          # контейнер остался — остановленным
docker rm runlog-db
docker run -d --name runlog-db -e POSTGRES_PASSWORD=runlog postgres:18-alpine
docker logs runlog-db
docker exec runlog-db psql -U postgres -c 'select version();'
docker stop runlog-db
docker rm runlog-db
```

| Команда, флаг | Что значит |
|---|---|
| `--name runlog-db` | имя контейнера, чтобы обращаться не по случайному ID |
| `-e ИМЯ=значение` | переменная окружения внутри контейнера |
| `-d` | в фоне: команда сразу возвращает терминал и печатает ID |
| `docker ps`, `-a` | работающие контейнеры; `-a` — все, включая остановленные |
| `docker logs` | всё, что контейнер напечатал |
| `docker exec` | выполнить команду в **уже работающем** контейнере. `psql` — клиент Postgres из того же образа |
| `docker stop`, `docker rm` | остановить; удалить (образ остаётся) |

Без `-d` Postgres занимает терминал своим журналом — выход Control+C.

---

## Свой образ

[`02-own-image.sh`](examples/02-own-image.sh)

[`runlog`](runlog/) — маленький сервер на TypeScript, мини-версия
`run-summary.tsv`: прогон присылает результат кейса, сервер хранит
и отдаёт списком. `GET /` — кто я; `POST /runs?case=C19633&status=passed` —
записать; `GET /runs` — список. Без `DATABASE_URL` хранит в памяти,
с ним — в Postgres. Ставить у себя ничего не нужно: пакеты ставит Docker
(`npm ci` на вашей машине в папке `runlog` не делайте — см. `.dockerignore`).

[`runlog/Dockerfile`](runlog/Dockerfile):

```dockerfile
FROM node:24-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["node", "server.ts"]
```

| Строка | Что делает |
|---|---|
| `FROM node:24-alpine` | основа — образ, в котором Node уже стоит |
| `WORKDIR /app` | папка внутри образа (создать, если нет) |
| `COPY package.json package-lock.json ./` | скопировать с вашей машины только список пакетов |
| `RUN npm ci` | **при сборке**: поставить пакеты строго по `package-lock.json` — как `yarn install --immutable` |
| `COPY . .` | скопировать остальное — код |
| `EXPOSE 3000` | пометка «слушаю 3000». Порт не открывает |
| `CMD ["node", "server.ts"]` | что запускать **при старте контейнера**, если команду не дали |

`RUN` выполняется один раз — при сборке, `CMD` — при каждом запуске.

[`runlog/.dockerignore`](runlog/.dockerignore) — что `COPY` **не** берёт:
`node_modules`, `Dockerfile`, `compose.yaml`, `.dockerignore`. Иначе
`COPY . .` унёс бы в образ лишнее, а `node_modules` с вашей Windows
или macOS перетёр бы пакеты, поставленные в образе под Linux.

### Сборка и слои

```bash
cd lessons/lesson-18/runlog
docker build -t runlog .
docker history runlog
```

```
 => [1/5] FROM docker.io/library/node:24-alpine@sha256:06d7adf3e0ef61a13f  0.0s
 => [internal] load build context                                          0.0s
 => => transferring context: 10.45kB                                       0.0s
 => [2/5] WORKDIR /app                                                     0.0s
 => [3/5] COPY package.json package-lock.json ./                           0.0s
 => [4/5] RUN npm ci                                                       1.7s
 => [5/5] COPY . .                                                         0.1s
 => => naming to docker.io/library/runlog:latest                           0.0s
```

`-t runlog` — имя образа; `.` — **контекст сборки**, папка, из которой
`COPY` берёт файлы (без того, что в `.dockerignore`: 10 кБ).

Каждый шаг — **слой**. Образ — стопка слоёв: внизу слои `node:24-alpine`
(Alpine — 9 МБ, Node — 167 МБ), сверху наши: пакеты — 36 МБ, код — 16 кБ.
Слои переиспользуются: десять образов на `node:24-alpine` хранят его
слои один раз.

### Кэш и порядок строк

```bash
echo '// правка' >> server.ts
docker build -t runlog .
git restore server.ts
```

```
 => CACHED [2/5] WORKDIR /app                                              0.0s
 => CACHED [3/5] COPY package.json package-lock.json ./                    0.0s
 => CACHED [4/5] RUN npm ci                                                0.0s
 => [5/5] COPY . .                                                         0.1s
```

Шаг берётся из кэша, если не изменились он сам и **всё, что выше**.
Поменялся слой — всё, что ниже, собирается заново. Поэтому сначала —
список пакетов и `npm ci`, потом код: правка кода не трогает пакеты.
Напишите один `COPY . .` перед `npm ci` — и пакеты будут ставиться
на каждую правку (в примере — так и есть). **Что меняется редко —
выше, что часто — ниже.**

### Размер

Тот же `Dockerfile` на разных основах (замер 22.10):

| Основа | Что внутри | Образ `runlog` |
|---|---|---:|
| `node:24` | Debian со всем: компиляторы, `git`, `curl`… | 1,68 ГБ |
| `node:24-slim` | Debian, только нужное для Node | 377 МБ |
| `node:24-alpine` | Alpine | 291 МБ |

Меньше образ — быстрее скачивается на сервер CI, меньше занимает. Цена
Alpine — своя системная библиотека: программам, собранным под обычный
Linux, там бывает плохо; браузерам Playwright нужен свой образ. Ещё
меньше — **многоступенчатая сборка**: два `FROM` в одном файле, первая
ступень ставит всё и проверяет типы, вторая берёт только нужное для
запуска, без `devDependencies` (291 → 249 МБ).
Документация — https://docs.docker.com/build/building/multi-stage/.

---

## Параметры запуска

[`03-run-options.sh`](examples/03-run-options.sh)

**Процесс №1.** `docker run --rm runlog` — сервер пишет
`runlog: порт 3000, хранилище memory` и занимает терминал. Ctrl+C —
и ничего: контейнер работает дальше, `docker stop` ждёт 10 секунд.
Программа в контейнере — процесс номер 1, а сигнал «остановись»
(его шлют Ctrl+C и `docker stop`) Linux доставляет процессу №1, только
если тот сам попросил. `node server.ts` не просил. `npm start` — просил:
с ним Ctrl+C срабатывает (уточнение 4). Лечится флагом `--init`:
процессом №1 становится посредник `docker-init`, он передаёт сигналы.

```bash
docker run -d --init --name runlog -p 3000:3000 runlog
curl localhost:3000/
curl -X POST "localhost:3000/runs?case=C19633&status=passed"
curl localhost:3000/runs
docker rm -f runlog
```

```
{"service":"runlog","node":"v24.22.1","host":"8b49ffd8c9d2","storage":"memory"}
{"caseId":"C19633","status":"passed"}
[{"caseId":"C19633","status":"passed"}]
```

| Флаг | Что |
|---|---|
| `--rm` | удалить после выхода |
| `-it` | интерактивно, с терминалом |
| `-d` | в фоне |
| `--name` | имя контейнера |
| `--init` | посредник процессом №1: работают Ctrl+C и `stop` |
| `-p машина:контейнер` | опубликовать порт: `-p 8080:3000` — открывать `localhost:8080` |
| `-e ИМЯ=значение` | переменная окружения: `-e PORT=4000` — сервер слушает 4000 |
| команда после образа | вместо `CMD`: `docker run --rm runlog node --version` |
| `--memory 64m`, `--cpus 0.5` | потолок памяти и процессора этому контейнеру |
| `docker rm -f` | остановить и удалить одной командой |

`host` в ответе — ID контейнера: у контейнера своё имя машины.
У `curl`: `-X POST` — метод запроса, без него — `GET`.

---

## Тома

[`04-volumes.sh`](examples/04-volumes.sh)

Поменяли строчку в `server.ts` — каждый раз `docker build`? Быстрее —
не копировать код в образ, а подключить папку.

```bash
docker run --rm --init -p 3000:3000 -v "$PWD":/app runlog
```

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'pg' imported from /app/server.ts
```

`-v папка_машины:папка_контейнера` — подключить вашу папку **поверх**
папки контейнера. Всё, что лежало в `/app` образа, больше не видно,
в том числе `node_modules`: пакеты ставил `npm ci` в образе, а в вашей
папке их нет. `$PWD` — текущая папка.

**Именованный том** — вторым `-v` не путь, а имя:

```bash
docker run -d --init --name runlog -p 3000:3000 -v "$PWD":/app -v runlog-modules:/app/node_modules runlog node --watch server.ts
```

Это хранилище, которым управляет Docker. При первом подключении он
заполнил его тем, что лежало в `/app/node_modules` образа — пакеты
снова видны. Сам том лежит у Docker (уточнение 7).

`node --watch server.ts` вместо `CMD` — перезапускать программу, когда
файл меняется. Правите `server.ts` на своей машине — контейнер видит
правку сразу:

```
Change detected in '/app/server.ts'
Restarting 'server.ts'
runlog: порт 3000, хранилище memory
```

Удалили контейнер — правка в `server.ts` осталась (это ваш файл), том
`runlog-modules` — тоже (`docker volume ls`, удалить — `docker volume rm`).
Пропадает только то, что записано в контейнере мимо томов.

Ровно так устроен `docker-compose.dev.yml` в `wl-e2e`: проект
с машины поверх `/app` и `node_modules` — именованным томом.

> **Linux:** пустая `node_modules` от `root` в папке `runlog` — место
> подключения тома. Удалить:
> `docker run --rm -v "$PWD":/w node:24-alpine rmdir /w/node_modules`.

---

## Второй контейнер и сеть

[`05-network.sh`](examples/05-network.sh) · на занятии не успели —
пошагово в [домашке](homework/01-network.md)

Приложению нужна база. База уже есть — в контейнере. Но:

- `DATABASE_URL=postgres://runlog:runlog@localhost:5432/runlog` —
  `ECONNREFUSED`: **`localhost` внутри контейнера — сам этот контейнер**,
  базы в нём нет. У каждого контейнера свой `localhost`;
- `…@runlog-db:5432/…` — `getaddrinfo ENOTFOUND runlog-db`: в сети
  по умолчанию контейнеры друг друга по имени не находят.

Своя сеть:

```bash
docker network create runlog-net
docker network connect runlog-net runlog-db
docker run -d --init --name runlog --network runlog-net -p 3000:3000 -e DATABASE_URL=postgres://runlog:runlog@runlog-db:5432/runlog runlog
```

```
runlog: порт 3000, хранилище postgres
```

`network create` — создать сеть, `network connect` — подключить к ней
работающий контейнер, `--network` — запустить новый сразу в ней.
Внутри своей сети контейнеры находят друг друга **по имени**. Наружу
опубликован только порт приложения: к базе ходит только `runlog`.

**База готова не сразу.** Запустить базу и сразу приложение — приложение
падает с `ECONNREFUSED`: новая база пару секунд готовится, а `runlog`
подключается при старте. Руками — `sleep 5` между командами; `compose`
умеет ждать сам.

**Данные базы — в томе.** Удалили контейнер базы и создали заново —
результаты пропали: они лежали внутри контейнера. С
`-v runlog-pgdata:/var/lib/postgresql` (где Postgres хранит данные —
написано на странице образа) результаты переживают пересоздание.
`docker rm -v` удаляет безымянные тома контейнера; именованные — только
`docker volume rm`.

---

## `docker compose`

[`06-compose.sh`](examples/06-compose.sh) · на занятии — обзор по файлам
`wl-e2e`; на `runlog` — в [домашке](homework/02-compose.md)

Сеть, база с четырьмя флагами, приложение с пятью — руками это никто
не повторит без ошибки. `compose.yaml` описывает всё одним файлом:

```yaml
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
```

| В файле | Было |
|---|---|
| `services:` `app`, `db` | два `docker run`. **Сервис** — один контейнер со всеми настройками |
| `build: .` | `docker build .` |
| `image:` | готовый образ |
| `init: true` · `ports:` · `environment:` | `--init` · `-p` · `-e` |
| `volumes:` в сервисе · внизу | `-v` · объявить именованный том |
| хост `db` в `DATABASE_URL` | имя сервиса — оно же имя в сети; сеть compose создаёт сам |
| `healthcheck` | как проверить, что сервис **готов**, а не просто запущен: `pg_isready` раз в 2 с, до 15 попыток |
| `depends_on … service_healthy` | не запускать `app`, пока `db` не здоров |

Без `healthcheck` и `depends_on` первый `up` почти всегда проигрывает
гонку: `app` — `Exited (1)`, `ECONNREFUSED`. `-h localhost` у `pg_isready`
важен: через файл-сокет он говорит «готов» ещё во время первой настройки
базы, когда по сети она закрыта.

```bash
docker compose up -d        # собрать, создать сеть, том, контейнеры и запустить
docker compose ps           # что работает
docker compose logs -f app  # журнал сервиса; -f — следить
docker compose exec db psql -U runlog -c 'select * from runs;'
docker compose down         # удалить контейнеры и сеть; тома — нет
docker compose down -v      # и тома — данные базы пропадут
```

Имена compose строит из папки: сеть `runlog_default`, том
`runlog_pgdata`, контейнер `runlog-app-1`.

---

## Docker в `wl-e2e`

**Образ Playwright** — `mcr.microsoft.com/playwright:v1.60.0-noble`
(3,4 ГБ): Ubuntu 24.04 (`noble`), Node v24.15.0 и все три браузера
(`yarn playwright install` не нужен). Тег совпадает с версией
`@playwright/test` проекта — иначе браузеры в образе не те.

**`Dockerfile` проекта** — те же строки, что у `runlog`:

| Строка | Что делает |
|---|---|
| `FROM mcr.microsoft.com/playwright:v1.60.0-noble` | основа |
| `RUN apt-get update && apt-get install … curl && rm -rf /var/lib/apt/lists/*` | доставить `curl`; списки пакетов удалить в том же `RUN` — иначе остались бы в слое |
| `COPY package.json yarn.lock .yarnrc.yml ./` | файлы корня |
| `COPY projects/monolith …` · `explorer` · `widgets` · `helpers` | весь код |
| `RUN corepack enable && yarn install --immutable` | установка строго по `yarn.lock` |
| `WORKDIR /app/projects/monolith` | откуда запускать |
| `ENV CI=true APP_ENV=staging` | переменные по умолчанию |
| `CMD ["yarn", "staging"]` | `staging` мёртв — поэтому команду всегда пишут явно |

Код скопирован **до** `yarn install` — правка одного спека заставляет
ставить пакеты заново (на клоне 22.10: пересборка без правок 1,8 с,
после правки спека — 20,4 с). Ровно то, чего `runlog` избегает порядком
строк.

**`docker-compose.dev.yml`, сервис `monolith-dev`:**

```yaml
  monolith-dev:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: wl-e2e-monolith-dev
    environment:
      - CI=true
      - APP_ENV=${APP_ENV:-staging}
    volumes:
      - ./:/app
      - wl-e2e-node-modules:/app/node_modules
    working_dir: /app/projects/monolith
```

`volumes` — как в разделе «Тома»: проект с вашей машины поверх `/app`,
`node_modules` — именованным томом. `${APP_ENV:-staging}` — взять
`APP_ENV` из терминала, а если не задан — `staging`.

**Учёток в образе нет:** `.dockerignore` проекта не пускает
`**/.env.*.secure` и `**/.auth`. Образ хранят и передают — всё, что в нём,
видят все. Контейнер видит ваши `.secure` только через том `./:/app`.

### Тест в контейнере

Из корня своего `wl-e2e` (нужен `.secure` окружения):

```bash
docker compose -f docker-compose.dev.yml build monolith-dev
docker compose -f docker-compose.dev.yml run --rm monolith-dev yarn playwright test C19633 --list
docker compose -f docker-compose.dev.yml run --rm monolith-dev yarn case C19633 --env=staging-gen2
```

| Часть | Что значит |
|---|---|
| `-f docker-compose.dev.yml` | взять этот файл вместо `compose.yaml` |
| `build monolith-dev` | собрать образ сервиса. Первый раз — минуты и ~4 ГБ |
| `run … monolith-dev <команда>` | одноразовый контейнер сервиса с вашей командой (`up` запускает сервисы надолго) |
| `--rm` | удалить после |
| `--user "$(id -u):$(id -g)"` | **только Linux:** работать от вашего пользователя, иначе файлы в проекте станут принадлежать `root` |

Вывод живого прогона (22.10, учётка скрыта):

```
case:     C19633
spec:     tests/regression-run/setup-staff/staff-role/C19633.spec.ts
business: staging-gen2 ('99010')   [--env]

> APP_ENV=staging-gen2 yarn playwright test tests/regression-run/setup-staff/staff-role/C19633.spec.ts --project=chromium

Running 1 test using 1 worker
  ✓  1 [chromium] › tests/regression-run/setup-staff/staff-role/C19633.spec.ts:7:7 › … (15.6s)

  1 passed (16.9s)
```

Отчёт и `test-results` остаются у вас в папке проекта: `/app` — это
ваша папка. В контейнере нет экрана: `--headed`, `--ui`, `--debug` —
только на вашей машине.

> ⚠️ **`docker compose up -d` без `-f`** в корне `wl-e2e` берёт другой
> файл — `docker-compose.yml` — и запускает в трёх контейнерах их `CMD`:
> `yarn staging`, полный прогон против мёртвого `staging`. Для работы
> нужен `-f docker-compose.dev.yml` и `run`, как выше. Остановить —
> `docker compose down`.

Убрать за собой — `docker compose -f docker-compose.dev.yml down -v`
(контейнеры и том `node_modules`; README советует, если пакеты
«протухли»), образ — `docker image rm wl-e2e-monolith-dev`.

---

## Оркестрация и Kubernetes

**Оркестрация** — когда за контейнерами следит программа, а не вы:
в каком порядке запускать (`depends_on`), готов ли сервис
(`healthcheck`), что делать, если упал. Последнее в compose —
`restart: on-failure`: без `healthcheck` приложение падает на гонке,
Docker поднимает его снова, пока база не станет готова (в примере
[`06-compose.sh`](examples/06-compose.sh) — четыре перезапуска).

Compose управляет контейнерами на **одной** машине. Нужно десять копий
сервиса на пяти серверах, и кто-то должен переносить их, когда сервер
умер, — это **Kubernetes** (k8s): те же идеи на кластере машин.

| В compose | В Kubernetes |
|---|---|
| сервис | Deployment — «держи N копий этого контейнера» |
| контейнер | Pod — один или несколько контейнеров вместе |
| имя сервиса в сети | Service — постоянное имя перед копиями |
| `healthcheck` | readiness и liveness probes |
| `restart: on-failure` | Kubernetes сам пересоздаёт упавшие Pod |
| `compose.yaml` | несколько YAML-файлов, `kubectl apply -f` |

В `wl-e2e` Kubernetes нет. Для самостоятельного:

1. Kubernetes в Docker Desktop: Settings → Kubernetes → Enable —
   https://docs.docker.com/desktop/features/kubernetes/. На Linux —
   `kind` (https://kind.sigs.k8s.io) или `minikube`
   (https://minikube.sigs.k8s.io/docs/start/).
2. Учебник «Kubernetes Basics» —
   https://kubernetes.io/docs/tutorials/kubernetes-basics/.
3. Карты тем — https://roadmap.sh/docker, https://roadmap.sh/kubernetes.

---

## CI: что происходит с вашим PR

**Воркфлоу** — файл в `.github/workflows/`: на какое событие что
запускать. **Раннер** — машина, на которой GitHub это выполняет: своя
у GitHub или своя у компании. `.github/workflows/remote-targeted-pr-tests.yml`
срабатывает на открытие PR и каждый пуш в него — три задачи:

```
PR открыт / обновлён
   │
   ├─► gate          раннеры GitHub: ubuntu (обязательный) и windows (для сведения),
   │                 без Docker — yarn gate, все проверки проекта разом
   ├─► detect-tests  какие *.spec.ts изменены в PR + чей секрет взять по логину автора
   │
   └─► run-tests     только если gate зелёный: каждый изменённый спек — на раннере
                     компании, в Docker: docker compose -f docker-compose.dev.yml run …
```

- **Красный `gate` — изменённые тесты не запускаются** (`run-tests`
  ждёт `needs: [gate, detect-tests]`). Смотреть, чей шаг красный: ваш
  или уже сломанный на базовой ветке.
- **`detect-tests` у вас упадёт на «Resolve developer secret»**:
  раннер запускает тест с учётками автора PR, а список логинов —
  `.github/developer-secret-map.json` — ваших не содержит. Это ожидаемо.
- **Проверки пока не блокируют мерж:** защищённых веток в репозитории
  нет, кнопка мержа активна и при красных проверках.
- **Черновой PR** — «Create draft pull request» или `gh pr create --draft`;
  перевести уже открытый — «Convert to draft», вернуть — «Ready for review».
  Проверки на черновике идут так же (уточнение 10).

---

## Итог курса

```
пишу тест                        куда класть; «уже есть» ≠ «такой, как нужно» (T1)
   │  yarn eslint <файл>
   ▼
yarn case C… --env=staging-genN   нужен .secure; пустой ключ — падает тест, который его читает
   ▼
yarn gate                         все проверки разом; зелёный — не значит правильный
   ▼
Docker -dev                       та же Linux-среда, что у CI и сервера QA
   ▼
PR ─► CI: gate ─► run-tests       красный gate — смотреть, чей шаг
   ▼
ревью                             то, чего не ловит никто
   ▼
регрессия                         по кластерам, на сервере QA, в Docker
```

1. Тест — не только код: окружение, данные на бизнесе, порядок прогона.
2. Проверка ловит **форму**, а не смысл: зелёная — не значит правильная.
3. Зелёный локально — черновик; вердикт — Docker, CI, регрессия.

---

## Словарь терминов

| Термин | Что значит |
|--------|------------|
| **образ** (image) | заготовка: система, программы, файлы — всё уже установлено. Собирается по `Dockerfile` (`docker build`) или скачивается готовым |
| **контейнер** (container) | запущенный образ. Из одного образа — сколько угодно контейнеров, каждый начинает с чистого листа |
| **реестр** (registry) | сервер, где хранят образы: Docker Hub, `mcr.microsoft.com` |
| **тег** (tag) | версия образа, после двоеточия: `node:24-alpine`. Не написан — `latest` |
| **Dockerfile** | рецепт образа: шаги сверху вниз — `FROM`, `COPY`, `RUN`, `CMD` |
| **слой** (layer) | результат одного шага `Dockerfile`. Образ — стопка слоёв; неизменившиеся Docker берёт из кэша |
| **контекст сборки** | папка, из которой `COPY` берёт файлы (`.` в `docker build .`), без того, что в `.dockerignore` |
| **процесс №1** | первая программа контейнера. Сигналы получает, только если сама попросила — отсюда `--init` |
| **том** (volume) | папка, которая живёт отдельно от контейнера: папка вашей машины (`-v "$PWD":/app`) или именованное хранилище Docker (`-v имя:/путь`) |
| **сеть** (network) | внутри своей сети контейнеры находят друг друга по имени |
| **сервис** (service) | один контейнер в `compose.yaml` со всеми его настройками |
| **оркестрация** | когда за контейнерами следит программа: порядок запуска, готовность, перезапуск упавших |
| **воркфлоу** (workflow) | файл в `.github/workflows/`: на какое событие что запускать |
| **раннер** (runner) | машина, на которой GitHub выполняет воркфлоу: своя у GitHub или своя у компании |

## Предыдущие уроки

- [Урок 16](../lesson-16/README.md) — браузер и DOM ·
  [примеры](../lesson-16/examples/) · [домашка](../lesson-16/homework/)
- [Урок 17](../lesson-17/README.md) — проект изнутри: устройство, запуск,
  окружения, данные, команды · [домашка](../lesson-17/homework/)
