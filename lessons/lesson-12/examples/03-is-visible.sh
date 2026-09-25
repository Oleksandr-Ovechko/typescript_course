#!/usr/bin/env bash
# Урок 12 · isVisible() не ждёт — даже с тайм-аутом (правило W10)
#
# Что здесь: баннер появляется через секунду · isVisible() и
# isVisible({ timeout: 5_000 }) отвечают мгновенно · expect(...).toBeVisible()
# дожидается · чем заменять isVisible с тайм-аутом в трёх разных случаях.
#
#   bash lessons/lesson-12/examples/03-is-visible.sh
#   cd /tmp/wl-pw-examples/is-visible          # песочница остаётся

source "$(dirname "$0")/_sandbox.sh" is-visible

cat > tests/visible.spec.ts <<'EOF'
import { test, expect } from '@playwright/test';

test('isVisible does not wait', async ({ page }) => {
  await page.goto('/');
  // Баннер «Special offer» появляется через секунду после загрузки.
  const offer = page.getByText('Special offer');
  const started = Date.now();
  console.log('isVisible():', await offer.isVisible());
  console.log('isVisible({ timeout: 5_000 }):', await offer.isVisible({ timeout: 5_000 }));
  console.log('ждал меньше полусекунды:', Date.now() - started < 500);
  await expect(offer).toBeVisible();
  console.log('expect(...).toBeVisible() дождался:', await offer.isVisible());
});

test('three replacements', async ({ page }) => {
  await page.goto('/');
  // 1. Элемент обязан появиться — ждать и падать, если нет.
  await expect(page.getByText('Special offer')).toBeVisible();
  console.log('1. expect(...).toBeVisible()           → дождался баннера');

  // 2. Элемент необязательный — подождать, но не падать.
  const promo = page.getByText('Promo code');
  const shown = await promo.waitFor({ state: 'visible', timeout: 1_000 }).then(() => true, () => false);
  console.log('2. waitFor(...).then(true, false)      → промокода нет:', !shown);

  // 3. Осознанный вопрос «есть ли прямо сейчас» — isVisible() без аргументов.
  console.log('3. isVisible() без аргументов          → диалог сейчас виден:', await page.getByRole('dialog').isVisible());
});
EOF

say "Баннер через секунду: isVisible против expect"
run $PW test tests/visible.spec.ts -g 'does not wait' 2>&1 | grep -E 'isVisible|ждал|дождался|код возврата'

cat <<'TEXT'
  isVisible() ответил false мгновенно — баннера ещё нет. С тайм-аутом
  в пять секунд — тоже false и тоже мгновенно: в типах Playwright этот
  параметр помечен «@deprecated This option is ignored». Он ни на что
  не влияет. А expect(...).toBeVisible() подождал секунду и дождался.

  В wl-e2e isVisible( — около 8 300 вызовов, и примерно 3 500 из них —
  с тайм-аутом, который читается как «подожди», а значит «прямо сейчас».
  Это правило W10 в RULES.md. Запрещён не сам isVisible(), а вызов
  с тайм-аутом.

  Ошибка тихая: ничего не падает. isVisible возвращает правдоподобный
  false, и код молча идёт по ветке «элемента нет» — пропускает шаг.
  Если тест и упадёт, то позже и в другом месте, и искать причину будут
  не там. Скрипт гейта check-is-visible.mjs называет кейсы, на которых
  это стоило многочасовой отладки: C19990, C21532, C21534, C21554.
TEXT

say "Чем заменять — три случая"
run $PW test tests/visible.spec.ts -g 'three' 2>&1 | grep -E '^[0-9]\.|код возврата'

cat <<'TEXT'
  Как выбрать замену для isVisible({ timeout }) в хелпере:

    задача                                        как писать
    ────────────────────────────────────────────  ──────────────────────────────────────
    дождаться, что элемент появился               await expect(x).toBeVisible()
    элемент необязательный — подождать, не падать await x.waitFor({ state: 'visible',
                                                    timeout }).then(() => true, () => false)
    осознанно спросить «есть ли сейчас»           await x.isVisible()   — без аргументов

  Во втором случае у waitFor тайм-аут настоящий: он действительно ждёт
  до секунды, прежде чем сдаться.
TEXT
