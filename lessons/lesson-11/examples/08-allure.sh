#!/usr/bin/env bash
# Урок 11 · Allure: что пишет репортер и откуда берётся отчёт
#
# Что здесь: allure-playwright складывает сырьё — JSON на каждую попытку
# и вложения · что внутри одного result.json · allure generate — отдельная
# Java-программа · зачем Allure рядом с HTML-отчётом Playwright.
#
#   bash lessons/lesson-11/examples/08-allure.sh
#   cd /tmp/wl-pw-examples/allure                   # песочница остаётся

source "$(dirname "$0")/_sandbox.sh" allure

# ── Репортер пишет сырьё ─────────────────────────────────────────────────────
say "Прогон с двумя репортерами: line и allure-playwright"
run $PW test tests/booking.spec.ts --reporter=line,allure-playwright 2>&1 | grep -E 'passed|failed$|код возврата'

say "Что лёгло в allure-results/"
ls allure-results | sed -E 's/^[0-9a-f-]{36}/<uuid>/' | sort | uniq -c
cat <<'TEXT'
  Это не отчёт, а сырьё. По result.json на каждую попытку: три теста плюс
  ретрай упавшего — четыре. И вложения: error-context.md к упавшим
  попыткам и trace.zip — трейс ретрая.
TEXT

say "Что внутри одного result.json"
node -e '
  const fs = require("fs");
  const dir = "allure-results";
  const all = fs.readdirSync(dir).filter((f) => f.endsWith("-result.json"))
    .map((f) => JSON.parse(fs.readFileSync(`${dir}/${f}`)));
  // Вложения лежат не в корне, а внутри шагов — собираем их по дереву.
  const attached = (steps) => steps.flatMap((s) =>
    [...(s.attachments || []).map((a) => a.name), ...attached(s.steps || [])]);
  // Берём ретрай упавшего теста: у него есть и error-context, и трейс.
  const r = all.find((x) => attached(x.steps).includes("trace"));
  const label = (n) => r.labels.find((l) => l.name === n).value;
  console.log("  name:        ", r.name);
  console.log("  status:      ", r.status);
  console.log("  браузер:     ", label("parentSuite"));
  console.log("  файл:        ", label("suite"));
  console.log("  воркер:      ", label("thread").replace(/pid-\d+-/, ""));
  console.log("  шаги:        ", r.steps.map((s) => s.name).join(" / "));
  console.log("  вложения:    ", attached(r.steps).join(", "));
'
cat <<'TEXT'
  Имя, статус, метки (браузер, файл, воркер) и шаги — те же действия, что
  в трейсе: переход, клики, проверки; каждый test.step из спека тоже стал
  бы отдельным шагом. Вложения лежат внутри шага «After Hooks»: туда их
  прикрепляет Playwright после теста. Из этих файлов Allure и собирает отчёт.
TEXT

# ── Сборка отчёта ────────────────────────────────────────────────────────────
say "allure generate — сборка отчёта"
if command -v java >/dev/null 2>&1; then
  node_modules/.bin/allure generate allure-results -o allure-report --clean
  ls allure-report | head
  cat <<'TEXT'
  Отчёт собран в allure-report/. Открыть: node_modules/.bin/allure open allure-report
TEXT
else
  node_modules/.bin/allure generate allure-results -o allure-report --clean 2>&1 | grep -m1 ERROR || true
  cat <<'TEXT'
  Java не установлена, и отчёт не собрался. Это не поломка: Allure —
  отдельная программа на Java, не часть Playwright. В wl-e2e то же самое:
  `yarn allure:report` без Java падает с этой же строкой.
TEXT
fi

say "Зачем он нужен"
cat <<'TEXT'
  По-настоящему Allure работает в CI: job pages в .gitlab-ci.yml копит
  историю между прогонами и публикует отчёт. Отсюда его главное отличие:
  видно ТРЕНД — тест падает третий прогон подряд или сломался впервые.
  HTML-отчёт Playwright показывает только последний прогон.

  Четыре репортера проекта:
    list      — строки в терминале, для глаз прямо сейчас;
    html      — один прогон подробно (включён только в explorer;
                в monolith и widgets его нет);
    allure    — история многих прогонов, для CI;
    TestRail  — свой репортер monolith: не показывает, а проставляет
                результаты в TestRail (включается флагом --testrail
                или переменной TESTRAIL_ENABLED=true).
TEXT
