#!/usr/bin/env bash
# Урок 12 · Виджет в iframe: локатор точный, а найдено ноль
#
# Что здесь: page.getByRole не заглядывает в iframe · frameLocator и дальше
# обычные getBy… · где у нас iframe: виджеты и всплывающие уведомления
# монолита.
#
#   bash lessons/lesson-12/examples/06-iframe.sh
#   cd /tmp/wl-pw-examples/iframe              # песочница остаётся

source "$(dirname "$0")/_sandbox.sh" iframe

cat > tests/iframe.spec.ts <<'EOF'
import { test, expect } from '@playwright/test';

test('a widget inside an iframe', async ({ page }) => {
  await page.goto('/');
  console.log('page.getByRole(…):', await page.getByRole('button', { name: 'Book in widget' }).count());
  const widget = page.frameLocator('iframe[name^="wl-schedule-widget:"]');
  await widget.getByRole('button', { name: 'Book in widget' }).click();
  await expect(widget.getByRole('button')).toHaveText('Booked in widget');
  console.log('frameLocator(…).getByRole(…): кликнули, текст сменился');
});
EOF

say "Кнопка внутри iframe"
run $PW test tests/iframe.spec.ts 2>&1 | grep -E 'getByRole|✓|✘|код возврата'

cat <<'TEXT'
  Кнопка «Book in widget» на экране видна, локатор точный — а page нашёл
  ноль. iframe — отдельная страница внутри страницы, и локаторы page туда
  не заглядывают. Нужен page.frameLocator('селектор iframe'), а дальше —
  те же getBy…, что обычно.

  У нас это везде:
  - виджеты на сайте клиента — iframe с именем wl-schedule-widget:…
    (UI-PATTERNS.md §15: iframe[name^="wl-schedule-widget:"]);
  - всплывающие уведомления монолита — тоже iframe,
    helpers/monolith/assertions.ts:
      page.frameLocator('#mp-note-frame').locator('#mp-note-text')

  Поэтому в алгоритме «нашёл 0» первый вопрос — не в iframe ли элемент.
TEXT
