# Урок 17. Проект изнутри: устройство, запуск, окружения, данные

Два месяца мы смотрели на `wl-e2e` по одному файлу за раз. Этот урок —
весь репозиторий: из каких частей он собран, через какие из них проходит
один тест, куда тест идёт и откуда там берутся данные, какие команды
есть в проекте и что проверяется перед PR.

Урок шёл чт 22.10, в настоящем `wl-e2e`. Регрессию и гейт на занятии
разобрали словами — здесь они коротко, в конце. Docker и CI — следующий,
последний урок: [урок 18](../lesson-18/README.md).

Почти все команды ниже можно повторить у себя: они только читают. Где
нужен `.secure` или живой стенд — сказано рядом.

## Что было на занятии

| Тема | Где |
|------|-----|
| Уточнения к прозвучавшему | [раздел ниже](#уточнения-к-занятию) |
| Пять воркспейсов, корень, установка по шагам, шесть конфигов | [Карта проекта и установка](#карта-проекта-и-установка) |
| `--list`, `yarn case`, кэш входа, куда класть новый код | [Путь одного теста](#путь-одного-теста) |
| Живые окружения, `.env` и `.secure`, `check:env-ready` | [Окружение: куда идёт тест](#окружение-куда-идёт-тест) |
| Паки `setup-run`, черновик окружения, «уже есть — но такой ли?» | [Откуда данные](#откуда-данные) |
| 120 скриптов по группам, `APP_ENV` в Windows | [Все команды проекта](#все-команды-проекта) |
| Дорожки, кластеры, гейт *(на занятии — словами)* | [Регрессия](#регрессия-дорожки-и-кластеры) · [Гейт](#гейт) |

Домашка — [`homework/`](homework/README.md).

---

## Уточнения к занятию

Места, где на занятии прозвучала неточность. Всё проверено
по коду `wl-e2e` (ветка `test-generation`) и запуском. Первыми — те,
что касаются правил и того, как вы будете запускать тесты.

**1. `C8390` — пример нарушения правила T1, а не образец.** Спек
(`projects/widgets/…/C8390.spec.ts:12`) вызывает
`createAppointmentIfNotExists` из
`helpers/monolith/flows/setup/services/appointment-setup.flow.ts`. Эта
функция находит апойнтмент по имени и сразу возвращается — его настройки
не проверяет. Проект пишет это сам, в докблоке строк 57–66: «create-only:
it returns the moment the name is found… a fixture created once with the
wrong option stays wrong forever». «Проверь и почини» делает соседняя
функция того же файла — `ensureAppointmentRadioOptions` (строка 75).
Подробно — [«Уже есть — но такой ли?»](#откуда-данные).

**2. Кластеры — копии бизнеса по умолчанию, не канадского; дорожек в карте
нет.** Бизнес кластера собирается из паков `base` — это
`001-default-business` (`scripts/clusters/monolith.rules.json`). На
`test-generation` окружений кластеров монолита 13
(`config/.env.wl-aut-mt-c01…c13`), а в карте — 27 кластеров; на `draft` —
по 14 (23.10). Карта лежит в `scripts/clusters/monolith.json`, и в ней только
кластеры — ни одной дорожки. Дорожки решает
`helpers/utils/regression-lane.ts` по списку
`scripts/business-writes-baseline.json`.

**3. Голое `yarn playwright test` без `APP_ENV` идёт в `demo`, а не
в `staging`.** `playwright.config.ts:9`:
`process.env.APP_ENV || 'demo'` — и `--list` это печатает:
`injected env (2) from config/.env.demo`. Окружение `staging` по
умолчанию — у `yarn case`, если не дать `--env` и кейс не
сгенерированный.

**4. В `staging-gen*` есть не все ключи.** `check:env-ready` на
`staging-gen2`: код читает 155 ключей, у 38 значения нет, 24 спека из
2558 не пройдут. Если тест падает на `staging-genN` с «needs …, which is
empty», дело не в тесте — сначала `yarn check:env-ready`
([ниже](#окружение-куда-идёт-тест)).

**5. Браузер ставится один раз на машину, а не в каждый проект.**
Браузеры лежат в общем кэше Playwright (`~/.cache/ms-playwright`
на Linux) по версии Playwright; у всех трёх проектов одна версия
`@playwright/test`. README: «browser binaries, once per machine».

**6. Три мелочи из терминала.** `$?` — код возврата последней команды
(`0` — успех), а не её вывод. `@` в имени пакета — «скоуп», пространство
имён автора (`@playwright/test`), к глобальной установке отношения
не имеет. `injected env (N)` — сколько ключей в файле, а не сколько их
использует тест: в `config/.env.demo` два ключа — `injected env (2)`.

**7. Гейт идёт около 4–5 минут**, не 10–15. 21.10 — 4 мин 20 с; самый
долгий шаг — `check:clusters`.

**8. Скриптов `check:*` в корне — 13, гейт запускает 12 из них**, плюс
линтер: всего 13 шагов (`scripts/gate.mjs`). Тринадцатая проверка,
`check:env-ready`, в гейт не входит — ей нужно живое окружение.

**9. Антиспам — два отдельных счётчика.** `STAGING-ANTI-SPAM.md`:
около сотни попыток входа в день **на бизнес** и отдельный счётчик
**на IP**, который блокирует на 99. Не «99 попыток в один бизнес с одного
IP», и не на учётку.

**10. `pack.ts` есть не в каждом паке** — из четырёх паков монолита
только у `003` и `004`.

**11. «Писатель» — тест, который меняет настройку всего бизнеса**:
политику, настройку магазина, роль сотрудника. Так его определяет
`scripts/check-business-writes.mjs`. Общие фикстуры, которые тесты
переиспользуют, — это другое: от их порчи спасают кластеры.

**12. `yarn playwright` работает только из папки проекта.** Корень
от Playwright не зависит: из корня Yarn вместо Playwright печатает
подсказку `yarn run … <scriptName>`. README проекта: «`yarn playwright`
resolves only inside a project directory».

**13. Docker Desktop есть и для Linux** — пакеты для Ubuntu, Debian,
Fedora, RHEL (docs.docker.com/desktop/setup/install/linux/). Без него
на Linux тоже можно — Docker Engine из консоли.

---

## Карта проекта и установка

`wl-e2e` — один репозиторий из пяти **воркспейсов**: папок со своим
`package.json`. Yarn ставит зависимости всем разом и связывает их между
собой. Список — в корневом `package.json`, ключ `workspaces`:

```bash
yarn workspaces list            # из корня wl-e2e
```

```
➤ YN0000: .
➤ YN0000: helpers
➤ YN0000: projects/explorer
➤ YN0000: projects/monolith
➤ YN0000: projects/widgets
➤ YN0000: Done in 0s 1ms
```

Корень `.` — главный: в нём проверки, линтер, гейт. Три проекта тестов —
монолит, виджеты, Explorer. `helpers` — общий код.

| Что в корне | Зачем |
|---|---|
| `projects/monolith`, `widgets`, `explorer` | тесты; у каждого свои конфиги, константы, хелперы, `config/` с окружениями |
| `helpers/` | общие хелперы: вход, навигация, флоу, страницы монолита |
| `scripts/` | проверки (`check-*.mjs`), гейт (`gate.mjs`), сборка окружений, регрессия |
| `.github/`, `Dockerfile`, `docker-compose*.yml` | CI и Docker — [урок 18](../lesson-18/README.md) |
| `.nvmrc`, `package.json` (`packageManager`), `yarn.lock` | версии Node, Yarn и всех пакетов |
| `RULES.md`, `UI-PATTERNS.md`, `CONVENTIONS.md`, `ENVIRONMENTS.md` | справочники; в них приходят **по номеру** из сообщения проверки, а не читают подряд |

`generation/` (конвейер генерации тестов) есть только на `test-generation`.

### Установка: что делает каждый шаг

Раздел «Setup» из `README.md` проекта:

```bash
nvm install && nvm use          # Node version pinned in .nvmrc
corepack enable                 # Yarn 4, version pinned by "packageManager" in package.json
yarn install                    # all workspaces; always from the repo root, never from a project
cd projects/monolith && yarn playwright install chromium   # browser binaries, once per machine
```

| Шаг | Что делает | Если пропустить или сделать не так |
|---|---|---|
| `nvm install && nvm use` | Node той версии, что в `.nvmrc` | другая версия — другое поведение инструментов; `nvm use` действует только в этом терминале |
| `corepack enable` | Yarn той версии, что в `packageManager` (`yarn@4.3.1`) | глобальный Yarn 1 ломает установку непонятными ошибками |
| `yarn install` **из корня** | пакеты всем пяти воркспейсам по `yarn.lock` и ссылки между воркспейсами | Yarn 4 и из папки проекта ставит весь репозиторий; «из корня» — соглашение README, чтобы все делали одинаково. Под `sudo` — `node_modules` принадлежит root |
| `yarn playwright install chromium` **из проекта** | сам браузер — он не пакет и в `node_modules` не лежит | «browser not found» на первом же тесте. На Linux — с `--with-deps` |

`yarn.lock` нужен, хотя версии есть в `package.json`: там — диапазон
(`^1.60.0` — «1.60 или новее в пределах 1.x»), в `yarn.lock` — точная
версия каждого пакета, включая пакеты пакетов. По нему у всех и в CI
ставится одно и то же.

### Как проверить, что всё настроено

| Команда | Откуда | Что подтверждает |
|---|---|---|
| `yarn playwright test C19633 --list` | проект | Playwright видит тесты, конфиг грузится, код компилируется |
| `yarn playwright screenshot https://example.com shot.png` | проект | браузер установлен и запускается |
| `yarn gate` | корень | Node, Yarn, пакеты, линтер, типы, все проверки ([«Гейт»](#гейт)) |

Красный гейт сам по себе не значит «установка сломана» — смотреть,
какой шаг покраснел.

### Как спек достаёт общий код

Импорты в `C8390.spec.ts` — двух видов:

```ts
import { loginAsStaffToWlUi } from '../../../helpers/widgets-wl-ui-helper';
import { createAppointmentIfNotExists } from 'wl-e2e-automation-helpers/monolith/flows/setup/services/appointment-setup.flow';
```

Первый — по **пути**: свой хелпер проекта. Второй — по **имени пакета**:
`helpers/package.json` называется `wl-e2e-automation-helpers`, и
`yarn install` кладёт в `node_modules` ссылку на папку `helpers`
(`readlink node_modules/wl-e2e-automation-helpers` → `../helpers`).
Поэтому общий код из любого проекта импортируется одинаково, без
`../../../../`, а спек можно переложить в другую папку, не переписывая
импорт. Ссылки раскладывает установка всего репозитория — Yarn 4 делает
её, откуда бы ни запустили `yarn install`.

### Внутри проекта: шесть конфигов

| Конфиг | Откуда берёт тесты | Чем отличается |
|---|---|---|
| `playwright.config.ts` | `tests/` | регрессия: воркеры, `retries: 1`, три браузера |
| `playwright.e2e.config.ts` | `end-to-end-tests/` | длинные сквозные сценарии, `workers: 1`, `retries: 0` |
| `playwright.setup.config.ts` | `setup-run/` | создаёт данные окружения |
| `playwright.verify.config.ts` | `verify/` | проверяет, что данные окружения на месте |
| `playwright.probe.config.ts`, `playwright.probes.config.ts` | `probes/`, `.probes/` | замеры поведения страницы, не тесты |

Конфиг выбирается флагом `--config=…`, по умолчанию — первый. Спек из
`end-to-end-tests/` под конфигом по умолчанию **не найдётся**: «No tests
found», хотя файл на месте.

---

## Путь одного теста

### Найти тест, не запуская

```bash
yarn playwright test C19633 --list          # из projects/monolith
```

```
◇ injected env (2) from config/.env.demo // tip: ⌘ multiple files { path: ['.env.local', '.env'] }
◇ injected env (0) from config/.env.demo.secure // tip: ◈ secrets for agents [www.dotenvx.com]
Listing tests:
  [chromium] › regression-run/setup-staff/staff-role/C19633.spec.ts:7:7 › [C19633][SBO] [Staff permissions] [Add staff role] verify "Only my schedule" role › staff with "Only my schedule" cannot see Staff filter
  [firefox] › regression-run/setup-staff/staff-role/C19633.spec.ts:7:7 › …
  [webkit] › regression-run/setup-staff/staff-role/C19633.spec.ts:7:7 › …
Total: 3 tests in 1 file
TestRail: reporter inactive. Pass -- --testrail to enable.
```

- `config/.env.demo` — окружение по умолчанию `demo` (уточнение 3);
- три теста — три браузера из `projects` конфига;
- `TestRail: reporter inactive` — репортер TestRail, без флага молчит.

Первые строки у вас могут отличаться — зависит от того, какие
`config/.env.*` лежат на машине; хвост `// tip: …` — реклама `dotenv`.
`Total: 3 tests in 1 file` должно совпасть. `--list` не нужны файлы
окружения — он работает на любой машине.

### Живой прогон: `yarn case`

Окружение `staging` мертво. Живые — `staging-exp1..8` и
`staging-gen1..8`: бизнесы, на которых генерировали тесты. Скрипт
`yarn staging` целится в мёртвый `staging`, поэтому тест запускают так
(**нужен `.secure`** этого окружения):

```bash
yarn case C19633 --env=staging-gen2         # из projects/monolith
```

```
case:     C19633
spec:     tests/regression-run/setup-staff/staff-role/C19633.spec.ts
config:   playwright.config.ts
business: staging-gen2 ('99010')   [--env]

> APP_ENV=staging-gen2 yarn playwright test tests/regression-run/setup-staff/staff-role/C19633.spec.ts --project=chromium

Running 1 test using 1 worker

TestRail: reporter inactive. Pass -- --testrail to enable.
[session] reusing cached session: <файл>
  ✓  1 [chromium] › tests/regression-run/setup-staff/staff-role/C19633.spec.ts:7:7 › [C19633][SBO] [Staff permissions] [Add staff role] verify "Only my schedule" role › staff with "Only my schedule" cannot see Staff filter (13.3s)

  1 passed (14.0s)
```

Что `yarn case` (`scripts/run-case.mjs`) сделал за вас — по строкам:

1. `spec:` — нашёл файл кейса в этом проекте; если кейс в другом —
   скажет, куда перейти.
2. `config:` — выбрал конфиг по папке спека (спек из `end-to-end-tests/`
   сам получит `playwright.e2e.config.ts`).
3. `business:` — окружение: если дан `--env` — оно; иначе для
   сгенерированного кейса — где его сгенерировали
   (`generation/results/run-summary.tsv`); иначе — `staging`.
4. Проверил, что `config/.env.staging-gen2` и `.secure` на месте; нет —
   не запускает.
5. Запустил строку `> APP_ENV=… --project=chromium` и передал `APP_ENV`
   **только этому запуску**. Поэтому `yarn case … --env=…` работает
   и в PowerShell, где запись `APP_ENV=… yarn …` не работает.

`yarn case C105012 --show` — только первые четыре пункта, без запуска.

### Кэш входа: `[session]`

В выводе — `[session] reusing cached session` и ни строки про вход.
Первый запуск на этом окружении выглядел так:

```
Logging in to WL UI as <учётка> (navigated to …)
[session] saved fresh session: <файл>
```

Так работает `loginWithCache` (`helpers/utils/session-store.ts`):
очистить куки → есть файл `.auth/<учётка>[.wN]@<сервер>@<APP_ENV>.json`?
→ подложить его и спросить страницу «мы вошли?» → да — `reusing` (около
секунды, без формы); нет — войти через форму и сохранить состояние.
Полувход не сохраняется.

- **Где:** `projects/<проект>/.auth/`, файл на сочетание учётка ×
  сервер × окружение. `.wN` — слот воркера: у каждого из восьми
  воркеров своя сессия, потому что WL хранит в сессии, например,
  выбранного в магазине клиента.
- **Зачем:** не только скорость — сервер считает входы (антиспам,
  уточнение 9, правило W11). Вход перестал проходить у многих тестов
  сразу — сначала подумать про антиспам.
- **Странное состояние после входа** — удалить свой файл в `.auth/`.

> ⚠️ `.auth/` — это вход без пароля: в файлах куки живой сессии. Папка
> в `.gitignore`; не пересылать и не открывать на экране.

### Что вызвал тест

Путь `yarn case` → `playwright.config.ts` (по `APP_ENV` подгружает
`config/.env.<env>` и `.secure`, запускает `globalSetup.ts`) → спек →
константы (`constants/staffs.ts`: `STAFF` читает `process.env`) →
хелперы проекта и общие (`wl-e2e-automation-helpers/…`: вход, кэш
`.auth`, навигация). Спек знает только имена шагов; сломаться может
любое звено, и у каждого свой вид падения.

### Куда класть новый код

`createAppointmentIfNotExists` — **флоу**: хелпер, который собирает
действие из шагов нескольких страниц, сам селекторов не пишет и ничего
не проверяет.

| Пишу | Куда | Почему |
|---|---|---|
| шаг именно этого теста | `C{id}.helpers.ts` рядом со спеком | общие хелперы заморожены: новая функция — в свой файл |
| действие на одной странице | файл страницы | страница сама никуда не переходит |
| действие через несколько страниц | `flows/` | странице нельзя импортировать другую страницу |
| переход на страницу | спек, `beforeAll` или `components/navigation.ts` | переходы — у теста, не у страницы |
| проверка, нужная многим | `expect…` в `assertions.ts` | не прятать `expect` внутрь действия |
| тело теста | только вызовы с понятными именами | спек читается как шаги кейса |

Часть этих правил проект проверяет сам (линтер и проверки гейта), часть
не проверяет никто — ловит только ревью.

---

## Окружение: куда идёт тест

```bash
git ls-files config                         # из projects/monolith
```

Список зависит от ветки: `config/.env.staging-gen*` есть на
`test-generation`, на `draft` их нет. Нет `gen` в списке — вы на ветке
от `draft`.

| Файлы | Что это | Живое? |
|---|---|---|
| `.env.staging` | бывший общий staging | мёртв |
| `.env.staging-exp1..8`, `.env.staging-gen1..8` | бизнесы, на которых генерировали тесты | да |
| `.env.wl-aut-mt-c01..` | бизнесы кластеров регрессии | для регрессии |
| `.env.demo`, `.env.local`, `.env.custom` | `demo` — по умолчанию; `local`, `custom` — свои | — |
| `.env.example`, `.env.secure.example` | список всех ключей без значений | не окружение |

На каждое окружение **два** файла: `config/.env.<env>` — в git, адреса
и публичное; `config/.env.<env>.secure` — **не** в git: учётки и всё,
что создавали на бизнесе. В публичной половине `staging-gen2` —
тринадцать ключей, остальные сотня с лишним — в `.secure`. Архив `.secure`
не пересылать никуда.

### Что будет без `.secure`

На копии проекта без `.secure`:

```bash
APP_ENV=staging-gen2 yarn playwright test C19633 --project=chromium --retries=0
```

```
    Error: STAFF.email needs STAFF_C19633_EMAIL, which is empty for APP_ENV="staging-gen2".
    Run the setup-run pack that creates it: 001-default-business
    Then re-run. (Fixture constants resolve on use, so only the tests that need this one fail.)

       at ../../../helpers/utils/env-fixture.ts:91
…
```

Тест упал на строке 9 спека — там, где **впервые прочитал**
`STAFF.email`. Конфиг загрузился, `globalSetup` прошёл. Так работает
`envFixture` (`helpers/utils/env-fixture.ts`): константа читает
`process.env` в момент обращения — как геттер с урока 14. Нет значения —
падает только тот тест, которому оно понадобилось, а сообщение называет
ключ и пак, который его создаёт.

### Где ленивость ломается

Полный `--list` монолита на `staging-gen2`:

```bash
APP_ENV=staging-gen2 yarn playwright test --project=chromium --list
```

```
Error: CLIENT_FOR_DEACTIVATION.first_name needs CLIENT_FOR_DEACTIVATION_FIRST_NAME, which is empty for APP_ENV="staging-gen2".
…
Total: 0 tests in 0 files
```

Ноль тестов во всём проекте — из-за одного файла, `C22785.spec.ts`
(только на `test-generation`): массив с `CLIENT_FOR_DEACTIVATION.full_name`
объявлен **вне `test`**, на уровне файла, и читается при загрузке. Ключа
нет — файл не грузится — Playwright не показывает ничего. Правило D5:
«Don't destructure a fixture at module scope»; проверки на него нет,
ловит только ревью. `yarn case C19633` при этом работал: Playwright
грузит только файлы, подходящие под фильтр.

### Готово ли окружение — не запуская

```bash
yarn check:env-ready --env=staging-gen2 --project=monolith    # из корня, ~3,5 мин
```

```
### monolith — config/.env.staging-gen2(.secure)
  variables read by code: 155
    real value 117 · placeholder 0 · absent 38 · empty 0
  specs blocked: 24/2558 (1%) by the fixtures they use · 2558/2558 (100%) by the modules they import
    debt: 16 — no script creates these yet (Stage 4)
    external: 2
    derived: 1

(report only — pass --strict to fail, --list to see the blocked specs)
```

Код читает 155 ключей, у 38 нет значения; не пройдут 24 спека, список —
с `--list`. Проверка ничего не запускает и никуда не ходит: читает код
и файлы. `debt: 16` — ключи, для которых пака ещё нет.

---

## Откуда данные

**Пак** — папка в `setup-run/`: спеки, которые **создают** на бизнесе
то, что нужно тестам, — бизнес, сотрудников, клиентов, настройки. Идут
по порядку имён, в один воркер, под своим конфигом:

```bash
yarn playwright test --config=playwright.setup.config.ts --list | tail -2   # из projects/monolith
ls setup-run
```

```
Total: 59 tests in 56 files
TestRail: reporter inactive. Pass -- --testrail to enable.
001-default-business
002-canadian-business
003-multilocation-business
004-marketing-suite-business
999-auth-session-tear-down.spec.ts
create-search-test-appointments.spec.ts
create-shared-appointment.spec.ts
README.md
```

Паки лежат вне `tests/` нарочно: WL удаляет **мягко**, созданное
не убрать, и случайно запущенный пак засорит бизнес навсегда.

Внутри пака (`002-canadian-business/003-create-canadian-location.spec.ts`):
если ключ уже есть в окружении или в черновике — «already exists… not
creating another», выход; иначе создать и **записать ключ**
(`writeToDraftEnv`). **Черновик окружения** —
`config/.env.<env>.secure.draft`; в `.secure` его переносит `env:build`.

| Команда (из корня) | Что делает |
|---|---|
| `yarn env:build --env=<env>` | паки по порядку, черновик → `.secure`, в конце `check:env-ready`. Требует одноразовый пароль админа — руками не запускают |
| `yarn check:env-ready --env=<env>` | каких ключей нет — не запуская тестов |
| `yarn env:verify --env=<env>` | входит на бизнес и смотрит, что клиенты, сотрудники, локации на месте |

«Почему мой тест не видит клиента» — сначала две последние. `yarn setup:<env>`
руками — нет: `setup-run/README.md` велит `env:build`.

### Уже есть — но такой ли?

Тесты тоже проверяют «уже есть — не создавать».
`appointment-setup.flow.ts:32-39`:

```ts
  await expectAppointmentsPageIsOpen(page);
  if (await isAppointmentExists(page, name)) {
    return;
  }
  await searchAppointment(page, name);
  if (await isAppointmentExists(page, name)) {
    return;
  }
```

Если апойнтмент с этим именем когда-то создали **без** нужных опций,
функция найдёт его и вернётся. Опции никто не проверит, тест упадёт
дальше — в виджете — и будет выглядеть как баг продукта. Правило T1 —
«проверь **и почини**»: если сущность уже есть, сверить и поправить все
её настройки (уточнение 1). Проверки на T1 нет и быть не может; так же
не ловится поиск только что созданного клиента через поиск в шапке
(T10 — переходить по `uid`) и `.first()` наугад. Это ловит только ревью.

---

## Все команды проекта

В пяти `package.json` — около ста двадцати скриптов. Учить не нужно:
у них есть шаблон.

**Корень** — проверки и инструменты:

| Группа | Скрипты | Что делают |
|---|---|---|
| линтер и формат | `lint`, `lint:fix`, `lint:suppress`, `lint:prune`, `format`, `format:check` | ESLint по репозиторию. `format` — **не запускать**: репозиторий не отформатирован целиком; README велит `yarn prettier --write <свои файлы>` |
| проверки | `check:env`, `check:tags`, `check:page-imports`, … | каждая — за одним правилом; их запускает гейт |
| гейт | `gate` | все проверки разом |
| типы | `typecheck` | `tsc` во всех воркспейсах |
| окружение | `check:env-ready`, `env:build`, `env:verify` | см. выше |
| регрессия | `build:clusters`, `regression`, `regression:analyse` | полный прогон по кластерам и разбор падений |

Три инструмента проверяют разное, и один другого не заменяет: **Prettier**
(`format`) — только внешний вид кода, отступы и кавычки, ошибок не ищет;
**ESLint** (`lint`) — правила и практики: запрещённый `any`, `page.locator`
в спеке; **`tsc`** (`typecheck`) — типы. Prettier не находит багов, ESLint
не проверяет типы, `tsc` не следит за стилем.

**Проект** — почти все скрипты одна строка:

```
"staging":      "APP_ENV=${APP_ENV:-staging} yarn playwright test",
"e2e:staging":  "APP_ENV=staging yarn playwright test --config=playwright.e2e.config.ts",
"setup:staging": "APP_ENV=staging yarn playwright test --config=playwright.setup.config.ts",
```

Имя скрипта = **окружение** + **конфиг** (без приставки — регрессия,
`e2e:` — сквозные, `setup:` — создать данные). Всё, что пишут после
`yarn staging`, уходит Playwright как есть: `C19633`, `--headed`, `--list`.
Остальные: `case`, `report` (последний HTML-отчёт), `codegen:*`,
`allure:*` (нужна Java), `d:staging` (то же в контейнере), `typecheck`.

**Какие скрипты никуда не ведут:**

- `staging`, `e2e:staging`, `setup:staging` — в мёртвый `staging`;
- монолит, `dev` — `APP_ENV=ds`, а `config/.env.ds` нет;
- виджеты, `dev` — `APP_ENV=demo`, а `.env.demo` у виджетов нет;
- `setup:*` — создают сущности на бизнесе навсегда.

Скрипта `staging-gen2` нет — для живых окружений `yarn case … --env=…`.
На Linux и macOS работает и `APP_ENV=staging-gen2 yarn staging C19633`
(в `staging` стоит `${APP_ENV:-staging}`); в Explorer — нет, там
`APP_ENV=staging` жёстко.

> ⚠️ Не делать `export APP_ENV=…` — README проекта запрещает: забытый
> `export` перенацелит следующий прогон в этом терминале.

---

## Регрессия: дорожки и кластеры

На занятии — только словами. Полный прогон монолита — около 1400 спеков
на `draft` и около 2700 на `test-generation` (23.10), несколько воркеров
на один бизнес: по умолчанию восемь (`yarn regression`), скрипт запуска
на сервере QA (`scripts/run-regression-remote.sh`) по умолчанию даёт два —
там два ядра. Несколько сотен спеков — **писатели** (уточнение 11):
меняют настройку всего бизнеса (в `scripts/business-writes-baseline.json`
у монолита на 23.10 — 350 на `draft`, 554 на `test-generation`). Пока
писатель работает, его перемену видят все спеки в соседних воркерах, —
восстановление в `afterAll` сужает окно, но не закрывает.

**Воркер** — отдельный процесс Node, а не `async`-функция в общем
процессе. Мини-конфиг с `workers: 2`, `fullyParallel: true` и двумя
тестами в одном файле, каждый увеличивает переменную `counter` уровня
файла и печатает `process.pid` и `testInfo.workerIndex`:

```
a1: pid=1763460 parent=1763354 workerIndex=0 parallelIndex=0 counter=1
a2: pid=1763461 parent=1763354 workerIndex=1 parallelIndex=1 counter=1
```

Два процесса (у них один родитель — сам Playwright), и у каждого своя
копия файла: `counter` у второго теста — снова 1. С `--workers=1` оба
теста идут в одном процессе, и второй печатает `counter=2`. Общей памяти
у воркеров нет — общим остаётся только то, что снаружи: бизнес на сервере
и файлы на диске. Поэтому кэш входа делится по слотам: `.w1`, `.w2`… —
это `parallelIndex` (`TEST_PARALLEL_INDEX`), у слота 0 суффикса нет
(`helpers/utils/session-store.ts`, `workerSlotSuffix`).

Два ответа проекта:

- **Дорожки** (`helpers/utils/regression-lane.ts`, переменная
  `WL_LANE`): `parallel` — всё, кроме писателей; `serial` — только
  писатели, по одному, после остальных; `e2e` — сквозные спеки
  (`end-to-end-tests/`), одним воркером, в конце. Список писателей —
  `scripts/business-writes-baseline.json`; его держит в порядке
  `yarn check:business-writes`, чтобы новый писатель не попал в общую
  кучу молча. Один спек у себя вы запускаете как раньше — без `WL_LANE`
  ничего не меняется.
- **Кластеры** — спеки поделены на группы, у каждой свой бизнес и своё
  окружение (`wl-aut-mt-c01…`). Бизнес кластера собирается из пака
  `001-default-business`. Тест, испортивший данные, портит их только
  соседям по кластеру. Карта — `scripts/clusters/monolith.json`
  (уточнение 2).

Регрессию гоняют на сервере QA (`yarn regression`); разбор падений —
`yarn regression:analyse`: он отделяет падения окружения (пустой ключ,
вход) от остальных.

---

## Гейт

`yarn gate` (из корня) — одна команда, которая запускает все проверки
проекта и говорит «можно / нельзя». В `scripts/gate.mjs` — 13 шагов:
12 скриптов `check:*` (среди них проверка типов `check:typecheck`) и
линтер (уточнение 8); идёт 4–5 минут (уточнение 7). Все шаги — в строгом
режиме против **базы**: списка старых нарушений, которые проверка
пропускает. Новое нарушение сверх базы — ошибка; старое — нет. База
работает в одну сторону: починили старое нарушение — подрежьте её
(`yarn lint:prune` для линтера, `yarn check:<имя> --update-baseline`
для проверок, `RULES.md`); новые нарушения в базу не добавляют.

Как читать результат: красный гейт — **смотреть, какой шаг**. Сообщение
шага называет правило, а номер правила ведёт в `RULES.md`. На `draft`
21.10 гейт был красным при исправной установке — красный шаг
`check:clusters`, не ваш код. На Windows гейт может краснеть там, где
на Linux зелено, — проверить у себя это пункт домашки.

Чего гейт не ловит: «проверь и почини» (T1), поиск только что созданного
через шапку (T10), `.first()` наугад, фикстуру на уровне файла (D5).
Зелёный гейт — значит «форма в порядке», а не «тест правильный».

---

## Словарь терминов

| Термин | Что значит |
|--------|------------|
| **воркспейс** (workspace) | папка со своим `package.json` внутри общего репозитория. Yarn ставит зависимости всем воркспейсам разом и связывает их. В `wl-e2e` их пять |
| **пакет** (package) | то, что импортируют **по имени**, а не по пути: `'@playwright/test'`, `'wl-e2e-automation-helpers/…'` |
| **флоу** (flow) | хелпер, который собирает действие из шагов нескольких страниц. Сам селекторов не пишет и ничего не проверяет |
| **пак** (pack) | папка в `setup-run/`: спеки, которые **создают** на бизнесе то, что нужно тестам, — бизнес, сотрудников, клиентов, настройки |
| **черновик окружения** | файл `config/.env.<env>.secure.draft`: туда пак пишет созданное, следующий спек пака читает оттуда. В `.secure` его переносит `yarn env:build` |
| **дорожка** (lane) | часть полного прогона со своим набором спеков и числом воркеров: `parallel` — всё, кроме тестов, меняющих настройки бизнеса; `serial` — только они, по одному; `e2e` — сквозные спеки |
| **кластер** (cluster) | группа примерно из ста спеков со своим бизнесом и своим окружением (`wl-aut-mt-c01`…). Тест, испортивший общие данные, портит их только соседям по кластеру |
| **гейт** (gate) | одна команда, которая запускает все проверки проекта и говорит «можно / нельзя»: `yarn gate` |
| **база** (baseline) | список старых нарушений, которые проверка пропускает. Новое нарушение сверх базы — ошибка |

## Что пригодится с прошлых уроков

- **Урок 11** — `--list`, `workers`, `retries`, конфиг и репортеры:
  [конспект](../lesson-11/README.md).
- **Урок 14** — геттеры: [конспект](../lesson-14/README.md).
- **Урок 16** — правило A2 и тест `C19633`: [конспект](../lesson-16/README.md).

## Предыдущие и следующий уроки

- [Урок 15](../lesson-15/README.md) — регулярные выражения ·
  [примеры](../lesson-15/examples/) · [домашка](../lesson-15/homework/)
- [Урок 16](../lesson-16/README.md) — браузер и DOM ·
  [примеры](../lesson-16/examples/) · [домашка](../lesson-16/homework/)
- [Урок 18](../lesson-18/README.md) — Docker и CI ·
  [примеры](../lesson-18/examples/) · [домашка](../lesson-18/homework/)
