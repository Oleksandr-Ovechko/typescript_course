#!/usr/bin/env bash
# Урок 11 · Трейс из терминала
#
# Что здесь: playwright trace open → actions → console → requests →
# action N → close · как по трём командам найти настоящую причину падения ·
# автоожидание клика, расписанное по шагам.
#
#   bash lessons/lesson-11/examples/05-trace-cli.sh
#   cd /tmp/wl-pw-examples/trace-cli                # песочница остаётся
#
# Окно трейса (show-trace) скрипт не открывает. Откройте сами:
#   cd /tmp/wl-pw-examples/trace-cli
#   node_modules/.bin/playwright show-trace test-results/booking-book-Pilates-chromium/trace.zip

source "$(dirname "$0")/_sandbox.sh" trace-cli

say "Получаем трейс: своим конфигом он пишется у первой же попытки"
run $PW test tests/booking.spec.ts:14 -c playwright.my.config.ts 2>&1 | grep -E '✘|✓|код возврата'
T=test-results/booking-book-Pilates-chromium/trace.zip
ls -la "$T" | awk '{print $5, "байт —", $NF}'

# ── open: открыть трейс для следующих команд ────────────────────────────────
say "trace open — дальше путь к файлу указывать не нужно"
$PW trace open "$T" | head -12
cat <<'TEXT'
  open распаковывает трейс и запоминает его: все следующие команды
  `playwright trace …` работают с ним, пока не скажете `trace close`.
TEXT

# ── Три вопроса к любому падению ────────────────────────────────────────────
say "trace actions — что делал тест и сколько длилось каждое действие"
$PW trace actions

say "trace console — что писала страница"
$PW trace console

say "trace requests — что ходило по сети"
$PW trace requests
cat <<'TEXT'
  Читаем по порядку.
  actions:  клик по «Book Pilates» — около трёхсот миллисекунд, проверка
            «Booked!» — две секунды и ✗. Проверка ждала весь expect.timeout.
  console:  «booking failed with status 500» — страница сама написала,
            что бронирование не прошло.
  requests: POST book — 500. Вот причина: отказал сервер, а не тест
            и не селектор.

  Порядок чтения любого падения: текст ошибки → actions (что было долгим)
  → console → requests. Селектор подозревать последним.
TEXT

# ── Одно действие подробно ───────────────────────────────────────────────────
ACTION=$($PW trace actions | awk '/Book Pilates/ { print prev; exit } { prev = $1 }' | tr -d '.')
say "trace action $ACTION — клик по «Book Pilates» подробно"
$PW trace action "$ACTION"
cat <<'TEXT'
  Раздел Log — автоожидание по шагам. Сначала «waiting for getByRole(…)»:
  кнопки ещё нет, список классов грузится с API за 300 мс. Потом «locator
  resolved», проверка «visible, enabled and stable» и сам клик. Всё это
  Playwright делает сам, поэтому waitForTimeout перед кликом не нужен.
  Snapshots — какие снимки страницы есть у действия: до, в момент, после.
TEXT

say "trace close — закончить работу с трейсом"
$PW trace close
cat <<'TEXT'
  Эти команды есть в Playwright 1.60 — той версии, что стоит в wl-e2e.
  Их вывод — обычный текст, и его может прочитать Клод. Поэтому совет
  «трейс — GUI для человека, zip не разбирать» в агенте test-debugger
  из wl-e2e устарел: разбирать можно, вот этими командами.

TEXT
echo "  Номер действия в \`trace action N\` у каждого трейса свой: здесь клик"
echo "  оказался под номером $ACTION — в «Before Hooks» попали запуск браузера,"
echo "  контекста и страницы. Номер всегда берут из вывода \`trace actions\`."
