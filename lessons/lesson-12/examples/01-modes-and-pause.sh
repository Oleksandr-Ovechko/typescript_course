#!/usr/bin/env bash
# Урок 12 · Интерактивные режимы и page.pause()
#
# Что здесь: page.pause() в обычном прогоне пропускается · четыре режима
# с окном — команды, чтобы открыть их самим (сценарий их не запускает:
# им нужен экран и человек) · где режимы не работают.
#
#   bash lessons/lesson-12/examples/01-modes-and-pause.sh
#   cd /tmp/wl-pw-examples/modes-and-pause      # песочница остаётся

source "$(dirname "$0")/_sandbox.sh" modes-and-pause

cat > tests/pause.spec.ts <<'EOF'
import { test } from '@playwright/test';

test('page.pause() without a window', async ({ page }) => {
  await page.goto('/');
  await page.pause();
  console.log('pause пропущен: окна нет');
});
EOF

cat > tests/booking.spec.ts <<'EOF'
import { test, expect } from '@playwright/test';

test('book yoga', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('listitem').filter({ hasText: 'Yoga' }).getByRole('button').click();
  await expect(page.getByRole('dialog')).toContainText('Book Yoga?');
});
EOF

say "page.pause() в обычном прогоне"
run $PW test tests/pause.spec.ts 2>&1 | grep -E 'pause|✓|✘|passed|failed|код возврата'

cat <<'TEXT'
  page.pause() — точка останова прямо в коде теста. Но прогон без окна
  (headless — так тесты идут по умолчанию, на CI и в регрессии) её
  пропускает: останавливать некого, смотреть некому. Тест прошёл насквозь.

  Останавливается она только там, где есть окно: с --headed или --debug. Поэтому забытый page.pause() в коммите ничего не
  ломает на CI — но и не нужен там. Убирайте.
TEXT

cat <<TEXT

── Режимы с окном: откройте сами

  Из папки песочницы:

    cd $SANDBOX
    node_modules/.bin/playwright test tests/booking.spec.ts --headed
        тот же прогон, но браузер видно. Не ждёт вас и ничего не замедляет —
        мелькнёт за секунду

    node_modules/.bin/playwright test --ui
        окно со списком тестов: запуск по клику, трейс шаг за шагом,
        кнопка Pick locator (навести на элемент — покажет локатор)

    node_modules/.bin/playwright test tests/booking.spec.ts --debug
        инспектор: тест стоит перед каждым действием, шаг — кнопкой.
        Сам включает окно, один воркер и снимает тайм-аут теста

    node site/server.mjs &
    node_modules/.bin/playwright codegen http://localhost:4174
        браузер плюс окно с кодом: кликаете — пишется getByRole(...);
        кнопками на панели добавляются проверки (виден, текст, значение
        поля). Черновик локатора, а не готовый хелпер: про правила A8 и S3
        codegen не знает. Потом: kill %1

  UI-режим и --debug закрываются Ctrl+C. Если порт остался занят —
  fuser -k 4174/tcp.

  Где это всё не работает: внутри Docker. В контейнере нет экрана, поэтому
  --ui, --headed и --debug — только на своей машине, а page.pause() в
  Docker пропускается так же, как в обычном прогоне.

  UI-режим меняет оболочку и включает трейс, но правила ожидания у теста
  те же. Если тест падает в UI-режиме и проходит без него — он падает
  от замедления (машина занята окном), а не от «другого способа ждать».
TEXT
