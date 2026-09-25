#!/usr/bin/env bash
# Урок 11 · Что спрашивали на занятии: почему getByRole «не находит»
#
# Вопрос Даниила: getByRole иногда не успевает или не может кликнуть туда,
# куда нужно, а locator с CSS срабатывает. Здесь пять коротких тестов,
# каждый — одна из причин.
#
# Что здесь: getByRole ждёт так же, как любой локатор · name — подстрока
# без учёта регистра · exact: true · имя подходит нескольким элементам —
# strict mode · div с onclick не кнопка.
#
#   bash lessons/lesson-11/examples/09-asked-during-lesson.sh
#   cd /tmp/wl-pw-examples/asked-during-lesson      # песочница остаётся

source "$(dirname "$0")/_sandbox.sh" asked-during-lesson

# «Кнопка», свёрстанная div'ом: выглядит и кликается как кнопка, но роли
# button у неё нет. На живых страницах такое встречается часто.
sed -i 's#</body>#<div class="fake-btn" onclick="this.textContent=\x27Joined\x27">Join waitlist</div>\n</body>#' site/index.html

cat > tests/locators.spec.ts <<'EOF'
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('getByRole waits like any locator', async ({ page }) => {
  // Кнопок ещё нет: список грузится с API за 300 мс. Клик подождёт сам.
  await page.getByRole('button', { name: 'Book Yoga' }).click();
  await expect(page.getByRole('dialog')).toContainText('Book Yoga?');
});

test('name is a case-insensitive substring', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'book yoga' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Yoga' })).toBeVisible();
});

test('exact: true means the whole name, case included', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Book Yoga', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'book yoga', exact: true })).toHaveCount(0);
});

test('a div with onclick is not a button', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Join waitlist' })).toHaveCount(0);
  await page.getByText('Join waitlist').click();
  await expect(page.getByText('Joined')).toBeVisible();
});

test('a name that fits three buttons', async ({ page }) => {
  await page.getByRole('button', { name: 'Book' }).click();
});
EOF

say "Пять тестов про getByRole"
run $PW test tests/locators.spec.ts --retries=0 --workers=1 2>&1 | grep -E '^Running|✘|✓|strict mode|resolved to|^\s+[0-9]\) <|failed$|passed|код возврата'

cat <<'TEXT'
  Прошли четыре, упал один — и именно он главная причина «getByRole
  не может кликнуть».

  1. «waits like any locator». Кнопок в момент клика ещё не было — список
     грузится с API. Клик подождал сам: getByRole ждёт ровно так же, как
     page.locator('…'). Если getByRole «не успевает», дело не в скорости.

  2. «case-insensitive substring». name по умолчанию ищет ПОДСТРОКУ и без
     учёта регистра: 'book yoga' и просто 'Yoga' находят «Book Yoga».

  3. «exact: true». Точное совпадение — всё имя целиком, с регистром.
     'book yoga' с exact: true не находит ничего.

  4. «div with onclick». «Join waitlist» кликается, но свёрстан div'ом:
     роли button у него нет, и getByRole('button') его не видит. Искать
     его — по тексту (getByText) или по тому, что у него есть. Какую роль
     элемент имеет на самом деле, видно в ARIA-снимке error-context.md
     и во вкладке Accessibility в DevTools.

  5. «a name that fits three buttons». name: 'Book' — подстрока, и она есть
     у всех трёх кнопок. Playwright не выбирает «первую попавшуюся»: это
     strict mode, и клик падает сразу, не дожидаясь тайм-аута, с «strict
     mode violation … resolved to 3 elements». Лечится точным именем или
     exact: true — а не переходом на CSS. Playwright сам подсказывает
     точные локаторы: строки «aka getByRole(…)» в тексте ошибки.

     Кнопка «Confirm booking» тоже содержит «book» без учёта регистра,
     но в счёт не попала: она в скрытом диалоге, а getByRole по умолчанию
     скрытых элементов не видит. Поэтому три, а не четыре.
TEXT
