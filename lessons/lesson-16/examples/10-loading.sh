#!/usr/bin/env bash
# Урок 16 · Загрузка документа и ресурсов
#
# Что здесь: readyState и три его значения · в каком порядке идут скрипты,
# DOMContentLoaded и load · четыре waitUntil у goto — и почему после
# domcontentloaded click() проходит без ошибки, а на странице ничего не
# происходит · load и error у картинки · хелпер ожидания из wl-e2e.
#
#   bash lessons/lesson-16/examples/10-loading.sh
#   cd /tmp/wl-dom-examples/loading          # песочница остаётся

source "$(dirname "$0")/_sandbox.sh" loading

say "Порядок загрузки страницы"
cat > tests/load.spec.ts <<'EOF'
import { test } from '@playwright/test';

test('порядок загрузки', async ({ page }) => {
  await page.goto('/load.html', { waitUntil: 'load' });
  await page.waitForTimeout(200);
  for (const line of await page.evaluate(() => (window as any).timeline)) console.log(line);
});

for (const waitUntil of ['commit', 'domcontentloaded', 'load', 'networkidle'] as const) {
  test(`goto ${waitUntil}`, async ({ page }) => {
    await page.goto('/load.html', { waitUntil });
    const last = await page.evaluate(() => (window as any).timeline?.at(-1) ?? '(страница ещё не начала)');
    await page.locator('#book').click();
    const status = await page.locator('#status').textContent();
    console.log(`${waitUntil.padEnd(16)} последнее событие: ${last.trim()} · после click(): «${status}»`);
  });
}
EOF
run $PW test tests/load.spec.ts -g 'порядок' 2>&1 | grep -E 'мс|код возврата'

cat <<'TEXT'
  Страница load.html: скрипт defer (600 мс), скрипт async (300 мс),
  картинка (1500 мс). В квадратных скобках — document.readyState.

  loading — браузер читает HTML и строит DOM; обычный <script> выполняется
  сразу, по ходу чтения.
  interactive — HTML разобран, DOM построен целиком: его уже можно читать
  и менять. Дальше async-скрипт — как только скачался; defer-скрипты —
  по порядку, после разбора; потом DOMContentLoaded.
  complete — скачано всё: картинки, стили, фреймы. Сначала readyState
  становится complete (с событием readystatechange), потом приходит load.

  Обработчик кнопки Book страница вешает только на load. Так устроены
  страницы WL: часть обработчиков появляется, когда скачаны все скрипты.
TEXT

say "Четыре waitUntil у goto"
run $PW test tests/load.spec.ts -g 'goto' 2>&1 | grep -E 'последнее событие|код возврата'

cat <<'TEXT'
  goto без waitUntil ждёт load. domcontentloaded — только DOM: элементы
  есть, а обработчиков ещё может не быть.

  Отсюда ловушка: после domcontentloaded click() нашёл кнопку, она
  видна и включена — проверки прошли, клик случился, ошибки нет. Только
  обработчика на кнопке ещё нет, и ничего не произошло: «не записан».
  Тест упадёт позже и в другом месте.

  networkidle — ни одного сетевого соединения 500 мс подряд.
  В документации Playwright он помечен DISCOURAGED.

  В wl-e2e переходы между страницами ждут через хелпер
  waitUntilNavigationIsFinished (helpers/monolith/technical-helper.ts):
  сначала load — обязательно, потом короткое «успокоение» не дольше 5 с,
  и если не дождались — это не ошибка. 5 с — тайм-аут этого шага,
  а не определение networkidle. Правило — W12 в RULES.md.
TEXT

say "Загрузка отдельного ресурса"
cat > console/image.js <<'JS'
console.log('14)', document.readyState);
const probeImg = new Image();
probeImg.addEventListener('load', () => console.log('14a)', 'картинка загрузилась', probeImg.naturalWidth));
probeImg.src = '/slow.png?ms=50';
const brokenImg = new Image();
brokenImg.addEventListener('error', () => console.log('14b)', 'картинка не загрузилась'));
brokenImg.src = '/nope.png';
JS
console_run console/image.js

cat <<'TEXT'
  У картинки, скрипта, фрейма — свои load и error. Загрузку отдельного
  ресурса ждут ими, а не загрузкой всей страницы.
TEXT
