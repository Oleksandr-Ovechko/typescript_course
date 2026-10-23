#!/usr/bin/env bash
# Урок 12 · Строгий режим
#
# Что здесь: name: 'Book' подходит трём кнопкам — клик падает сразу
# с подсказками aka · какие вызовы строгие, а какие нет · старые
# page.click(селектор) не строгие · как включить строгость и для них.
#
#   bash lessons/lesson-12/examples/04-strict-mode.sh
#   cd /tmp/wl-pw-examples/strict-mode         # песочница остаётся

source "$(dirname "$0")/_sandbox.sh" strict-mode

cat > tests/strict.spec.ts <<'EOF'
import { test } from '@playwright/test';

test('a name that fits three buttons', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Book' }).click();
});
EOF

say "Клик по name: 'Book' — на какую кнопку?"
run $PW test tests/strict.spec.ts 2>&1 | grep -E 'strict mode|^\s+[0-9]\) <|failed$|passed|код возврата'

cat <<'TEXT'
  Ни на какую. Кнопок три: «Book Yoga», «Book Pilates», «Book Boxing»,
  и name ищет подстроку — 'Book' есть у всех. Playwright не угадывает,
  какую вы имели в виду, и падает: strict mode violation, resolved to
  3 elements.

  Упал СРАЗУ, не дожидаясь тайм-аута: ждать нечего, ответ уже
  неоднозначный. И сам подсказал точные локаторы — строки «aka …».

  Скрытая кнопка «Confirm booking» тоже содержит «book», но в список
  не попала: getByRole по умолчанию скрытых элементов не видит.
TEXT

cat > tests/strict-where.spec.ts <<'EOF'
import { test, expect, type Page } from '@playwright/test';

const book = (page: Page) => page.getByRole('button', { name: 'Book' });

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(book(page)).toHaveCount(3);
});

test('не строгие: count, all, allTextContents, first', async ({ page }) => {
  console.log('count():', await book(page).count(), '| all():', (await book(page).all()).length);
  console.log('allTextContents():', await book(page).allTextContents());
  console.log('first().textContent():', await book(page).first().textContent());
});
test('строгий: textContent()', async ({ page }) => {
  await book(page).textContent();
});
test('строгий: isVisible()', async ({ page }) => {
  await book(page).isVisible();
});
test('строгий: expect(...).toBeVisible()', async ({ page }) => {
  await expect(book(page)).toBeVisible();
});
test('не строгий: toHaveText со списком текстов', async ({ page }) => {
  await expect(book(page)).toHaveText(['Book Yoga', 'Book Pilates', 'Book Boxing']);
});
test('не строгий: старый page.click(селектор)', async ({ page }) => {
  await page.click('button:has-text("Book")');
  console.log('page.click кликнул:', await page.locator('#msg').textContent());
});
EOF

say "Где строгий режим действует, а где нет"
run $PW test tests/strict-where.spec.ts --workers=1 2>&1 | grep -E '✓|✘|count\(\)|allText|first\(\)|кликнул|код возврата'

cat <<'TEXT'
    строгие — падают на нескольких           не строгие
    ───────────────────────────────────────  ─────────────────────────────────────
    действия: click, fill, check…            count(), all(), allTextContents()
    textContent(), isVisible(),              .first(), .nth(), .last() — сами
      getAttribute()                           выбирают один
    проверки одного элемента: toBeVisible,   проверки списка: toHaveCount,
      toHaveText('…')                          toHaveText([...]) — массив ТЕКСТОВ
                                             старые page.click('…'), page.fill(…)

  toHaveText строгий или нет — решает то, что вы ожидаете: одна строка —
  проверка одного элемента, массив строк — проверка списка по порядку.

  Последняя строка — ловушка. Старый page.click(селектор) не строгий
  и молча кликнул первую из трёх. В wl-e2e таких вызовов немного
  (около десятка), но часть из них в общих хелперах:
  helpers/monolith/reports/clients-report.ts, general-report.ts,
  setup/services/class-schedule-setup-page.ts. Ошибка в общем хелпере
  задевает все тесты, которые его зовут.
TEXT

# ── Строгость для старых методов ────────────────────────────────────────────
cat > tests/strict-selectors.spec.ts <<'EOF'
import { test, expect } from '@playwright/test';

test.use({ contextOptions: { strictSelectors: true } });

test('strictSelectors: true', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Book' })).toHaveCount(3);
  await page.click('button:has-text("Book")').catch((e: Error) =>
    console.log('page.click со strictSelectors →', e.message.split('\n')[0]));
});
EOF

say "Можно ли включить строгость для page.click?"
run $PW test tests/strict-selectors.spec.ts 2>&1 | grep -E 'strictSelectors →|код возврата'

cat <<'TEXT'
  Можно. У локаторов строгий режим — не настройка: он есть всегда
  и выключить его нельзя. А для старых методов page.click, page.fill
  его включает опция контекста strictSelectors: true — в конфиге это
  use: { contextOptions: { strictSelectors: true } }.

  Обратите внимание: элементов тут 4, а не 3. CSS-селектор, в отличие
  от getByRole, видит и скрытую кнопку «Confirm booking» — без опции
  page.click мог бы взять и её, окажись она в DOM первой.

  В wl-e2e этой опции нет, поэтому старые page.click там по-прежнему
  молча берут первый найденный элемент.
TEXT
