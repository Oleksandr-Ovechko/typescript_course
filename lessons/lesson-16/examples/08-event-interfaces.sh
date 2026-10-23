#!/usr/bin/env bash
# Урок 16 · Интерфейсы событий: мышь, клавиатура, что порождает Playwright
#
# Что здесь: у каждого события свой класс · отправленный keydown не печатает
# букву · в каком порядке идут события настоящего ввода и когда буква
# появляется в поле · какие события порождают click, dispatchEvent, fill,
# pressSequentially, press, check, selectOption.
#
#   bash lessons/lesson-16/examples/08-event-interfaces.sh
#   cd /tmp/wl-dom-examples/event-interfaces     # песочница остаётся

source "$(dirname "$0")/_sandbox.sh" event-interfaces

say "У каждого события свой класс"
cat > console/classes.js <<'JS'
const evChain = [];
for (let p = Object.getPrototypeOf(new PointerEvent('pointerdown')); p !== Object.prototype; p = Object.getPrototypeOf(p)) evChain.push(p.constructor.name);
console.log('12)', evChain.join(' → '));
const emailInput = document.querySelector('input[name=email]');
emailInput.addEventListener('keydown', (e) => console.log('12a)', e.constructor.name, e.key, e.code));
emailInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', code: 'KeyA' }));
console.log('12b)', JSON.stringify(emailInput.value));
JS
console_run console/classes.js

cat <<'TEXT'
  PointerEvent наследует MouseEvent, тот — UIEvent, тот — Event. У каждого
  класса свои поля: у мыши — координаты и кнопка, у клавиатуры — key
  (какой символ) и code (какая физическая клавиша: KeyA).

  12b) — главное: отправленный keydown букву НЕ напечатал, поле пустое.
  Событие из кода — сообщение «клавишу нажали», а не само нажатие:
  обработчики его получают, а браузер ничего не печатает.
TEXT

say "Настоящий ввод: когда буква появляется в поле"
cat > tests/keyboard.spec.ts <<'EOF'
import { test } from '@playwright/test';

test('порядок событий клавиатуры', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    const input = document.querySelector('input[name=email]') as HTMLInputElement;
    (window as any).log = [];
    for (const type of ['keydown', 'keypress', 'beforeinput', 'input', 'keyup']) {
      input.addEventListener(type, (e) => (window as any).log.push(`${type}[${JSON.stringify(input.value)}]${e.isTrusted ? '' : ' (isTrusted: false)'}`));
    }
  });
  await page.locator('input[name=email]').pressSequentially('a');
  console.log(`в скобках — value в момент события: ${(await page.evaluate(() => (window as any).log)).join(' → ')}`);
});

test('зажатая клавиша', async ({ page }) => {
  await page.goto('/');
  const input = page.locator('input[name=email]');
  await input.focus();
  await page.evaluate(() => {
    (window as any).log = [];
    document.querySelector('input[name=email]')!.addEventListener('keydown', (e) => (window as any).log.push(`keydown repeat:${(e as KeyboardEvent).repeat}`));
    document.querySelector('input[name=email]')!.addEventListener('keyup', () => (window as any).log.push('keyup'));
  });
  await page.keyboard.down('b');
  await page.keyboard.down('b');
  await page.keyboard.down('b');
  console.log(`keyboard.down('b') три раза, без up: ${(await page.evaluate(() => (window as any).log)).join(' → ')} · value: ${JSON.stringify(await input.inputValue())}`);
  await page.keyboard.up('b');
});
EOF
run $PW test tests/keyboard.spec.ts 2>&1 | grep -E 'в скобках|без up|код возврата'

cat <<'TEXT'
  keydown — клавиша нажата, поле ещё пустое. keypress — устаревшее
  событие «нажата клавиша с символом», идёт сразу за keydown.
  beforeinput — «сейчас поле изменится», его можно отменить. input —
  поле уже изменилось: буква там. keyup — клавишу отпустили, буква
  давно в поле.

  Буква появляется не на keyup, а между keydown и keyup. Зажатая клавиша
  повторяет keydown (repeat: true) и печатает каждый раз — keyup ещё
  ни разу не было, а в поле уже три буквы.

  isTrusted у всех — true: так печатает и человек. beforeinput приходит
  и при настоящем вводе.
TEXT

say "Что порождает каждое действие Playwright"
cat > tests/actions.spec.ts <<'EOF'
import { test, type Page } from '@playwright/test';

const show = async (page: Page, title: string, act: () => Promise<unknown>) => {
  await page.evaluate(() => { (window as any).log = []; });
  await act();
  const log: string[] = await page.evaluate(() => (window as any).log);
  console.log(`${title.padEnd(26)} ${log.join(' → ')}`);
};

test('какие события порождает Playwright', async ({ page }) => {
  await page.goto('/events.html');
  await show(page, 'click()', () => page.locator('#btn').click());
  await show(page, "dispatchEvent('click')", () => page.locator('#btn').dispatchEvent('click'));
  await show(page, "fill('Al')", () => page.locator('#name').fill('Al'));
  await show(page, "pressSequentially('ex')", () => page.locator('#name').pressSequentially('ex'));
  await show(page, "press('Enter')", () => page.locator('#name').press('Enter'));
  await show(page, 'check()', () => page.locator('#waiver').check());
  await show(page, "selectOption('pack10')", () => page.locator('#pass').selectOption('pack10'));
});

test('движение мыши перед click', async ({ page }) => {
  await page.goto('/events.html');
  await page.evaluate(() => {
    (window as any).moves = [];
    for (const type of ['pointerover', 'pointermove', 'mousemove', 'pointerdown', 'mousedown'])
      document.getElementById('btn')!.addEventListener(type, () => (window as any).moves.push(type));
  });
  await page.locator('#btn').click();
  console.log(`click() с движением:       ${(await page.evaluate(() => (window as any).moves)).join(' → ')}`);
});
EOF
run $PW test tests/actions.spec.ts 2>&1 | grep -E '^(click|dispatch|fill|press|check|select)|движением|код возврата'

cat <<'TEXT'
  click() — как мышь: сначала движение к кнопке (pointermove, mousemove),
  потом нажатие — pointerdown и mousedown (одно нажатие, два семейства
  событий: «указатель» и «мышь»), фокус, отпускание — pointerup и mouseup,
  и только потом click.

  dispatchEvent('click') — одно событие click, isTrusted: false. Ни
  движения, ни нажатия, ни фокуса.

  fill — фокус, beforeinput и один input со всей строкой. Ни одной
  клавиши, нет change. pressSequentially — по букве, с keydown, keypress,
  beforeinput, input и keyup на каждую. press('Enter') в поле — change:
  так поле сообщает «значение зафиксировано».

  selectOption — только input и change, оба isTrusted: false: Playwright
  выставляет значение и сам отправляет события.

  Вопрос с урока: fill или pressSequentially? Если поле реагирует на
  каждую клавишу — маска, форматтер, подсказки, — нужен
  pressSequentially: fill ни одной клавиши не нажмёт. В wl-e2e так
  вводится телефон: helpers/monolith/add-client/client-add-page.ts,
  fillClientCellPhone — по 150 мс на клавишу, потому что форматтер
  intl-tel-input при 50 мс теряет последние цифры. На простом поле
  fill быстрее.
TEXT
