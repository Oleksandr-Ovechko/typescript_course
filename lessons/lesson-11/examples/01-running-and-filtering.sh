#!/usr/bin/env bash
# Урок 11 · Как запускается тест: фильтры и браузеры
#
# Что здесь: --list — посмотреть, что запустится, ничего не запуская ·
# аргумент — регулярка по пути файла · папкой · файл:строка · -g по имени
# теста · почему без --project тестов втрое больше.
#
#   bash lessons/lesson-11/examples/01-running-and-filtering.sh
#   cd /tmp/wl-pw-examples/running-and-filtering    # песочница остаётся

source "$(dirname "$0")/_sandbox.sh" running-and-filtering

# Отдельный конфиг с тремя браузерами — как в projects/widgets/playwright.config.ts.
# Браузеры для --list не запускаются, так что ставить firefox и webkit не нужно.
cat > playwright.browsers.config.ts <<'EOF'
import { defineConfig } from '@playwright/test';
import base from './playwright.config';

export default defineConfig({
  ...base,
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
});
EOF

# ── Что вообще будет запущено ────────────────────────────────────────────────
say "--list: показать, ничего не запуская"
$PW test --list
cat <<'TEXT'
  Пять тестов в трёх файлах. --list не открывает браузер и не поднимает
  сервер: это секунда, а не прогон. Привычка «сначала --list» бережёт
  от запуска не того и не в том количестве.
TEXT

# ── Аргумент — регулярное выражение по пути ─────────────────────────────────
say "Кусок пути: booking"
$PW test --list booking
cat <<'TEXT'
  Аргумент после `playwright test` — не имя теста и не номер кейса,
  а регулярное выражение, которое ищется в ПОЛНОМ пути файла. «booking»
  есть только в tests/booking.spec.ts — нашлись три его теста.

  В wl-e2e это значит: `yarn staging C93` запустит C93309, C93310, C93515…
  всё, в пути чего есть «C93». Точнее: `yarn staging C93515.spec`.
TEXT

say "Папкой: tests"
$PW test --list tests
cat <<'TEXT'
  Путь к папке — тоже кусок пути, поэтому запускает всё, что в ней лежит,
  с подпапками. В проекте так гоняют целый раздел:
  `yarn staging regression-run/appointment-widget --project=chromium`.
TEXT

# ── Файл и строка ────────────────────────────────────────────────────────────
say "Файл и строка, где начинается test(): tests/booking.spec.ts:8"
$PW test --list tests/booking.spec.ts:8

say "Строка внутри теста: tests/booking.spec.ts:9"
run $PW test --list tests/booking.spec.ts:9
cat <<'TEXT'
  Номер строки должен указывать туда, где объявлен test(...) — или
  test.describe(...). Строка 9 — середина второго теста, объявления там
  нет, и Playwright честно отвечает «No tests found» с кодом возврата 1.
TEXT

# ── По имени теста ───────────────────────────────────────────────────────────
say "-g: фильтр по имени теста, тоже регуляркой"
$PW test --list -g "Yoga"
cat <<'TEXT'
  -g (--grep) ищет не в пути, а в полном имени теста: файл › describe › test.

  Ловушка: чтобы прочитать имена, Playwright загружает ВСЕ файлы, которые
  подошли под путь. Без пути — все спеки проекта. В wl-e2e на стенде demo
  это кончается пустым списком: один из спеков (C176677) бросает ошибку
  прямо при загрузке — в .env.demo.secure нет WL_UI_BUSINESS_ID, — и из-за
  одного файла не находится ничего. Поэтому -g в проекте — вместе с путём:
    yarn dev regression-run/appointment-widget -g "zero-cost" --project=chromium
  (проверено: 1 тест из 173 в этой папке).
TEXT

# ── Браузеры ─────────────────────────────────────────────────────────────────
say "Три браузера в конфиге, без --project"
$PW test --list -c playwright.browsers.config.ts booking | tail -1

say "Тот же список с --project=chromium"
$PW test --list -c playwright.browsers.config.ts booking --project=chromium | tail -1
cat <<'TEXT'
  Каждый проект (браузер) — отдельный прогон каждого теста: три теста
  в трёх браузерах дают девять. В конфигах wl-e2e тоже три браузера,
  поэтому во всех инструкциях проекта стоит --project=chromium.
  Замер на рабочей ветке: `--list C93` — 15 тестов, с --project=chromium — 5.
TEXT
