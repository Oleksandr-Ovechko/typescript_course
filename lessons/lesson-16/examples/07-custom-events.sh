#!/usr/bin/env bash
# Урок 16 · Свои события и dispatchEvent
#
# Что здесь: new Event и new CustomEvent · detail · bubbles по умолчанию —
# false · isTrusted · классы событий вызываются только с new · почему
# new Event('click') не ставит галочку, а new MouseEvent('click') ставит ·
# что создаёт dispatchEvent('click') у Playwright.
#
#   bash lessons/lesson-16/examples/07-custom-events.sh
#   cd /tmp/wl-dom-examples/custom-events    # песочница остаётся

source "$(dirname "$0")/_sandbox.sh" custom-events

say "Своё событие: Event и CustomEvent"
cat > console/custom.js <<'JS'
const lateRow = document.querySelector('.session');
document.addEventListener('booking:done', (e) => console.log('11)', e.constructor.name, e.type, e.detail?.key, e.isTrusted, e.bubbles));
lateRow.dispatchEvent(new CustomEvent('booking:done', { detail: { key: '1001' }, bubbles: true }));
lateRow.dispatchEvent(new Event('booking:done', { bubbles: true }));
lateRow.dispatchEvent(new CustomEvent('booking:done', { detail: { key: 'x' } }));
console.log('11a)', 'третье событие до document не дошло');
JS
console_run console/custom.js

cat <<'TEXT'
  Своё событие можно создать любым классом: имя — любая строка
  ('booking:done' — просто договорённость «что: чем кончилось»).

  CustomEvent нужен ради одного — detail, данных в событии. У обычного
  Event detail нет (undefined во второй строке), но отправляется и
  ловится он так же.

  bubbles по умолчанию false: третье событие без bubbles: true осталось
  на строке и до обработчика на document не поднялось.

  isTrusted — false у всего, что отправлено кодом. true — только у
  событий, которые браузер породил сам в ответ на действие человека.
  click, fill и press у Playwright дают true: он действует через браузер,
  как человек. selectOption и dispatchEvent — false (пример 08).
TEXT

say "Классы — только с new"
cat > console/new.js <<'JS'
class Slot {}
try { Slot(); } catch (e) { console.log('11b)', e.message); }
try { Event('x'); } catch (e) { console.log('11c)', e.message); }
JS
console_run console/new.js

cat <<'TEXT'
  Класс без new бросает TypeError сразу (уроки 13–14). Классы событий
  браузера — тоже: Event, CustomEvent, MouseEvent вызываются только
  с new.
TEXT

say "Класс события решает, что сделает браузер"
cat > console/checkbox.js <<'JS'
const waiver = document.querySelector('input[name=waiver]');
const seen = [];
waiver.addEventListener('click', (e) => seen.push(e.constructor.name));
waiver.dispatchEvent(new Event('click', { bubbles: true }));
console.log('11d)', 'new Event      →', waiver.checked);
waiver.dispatchEvent(new MouseEvent('click', { bubbles: true }));
console.log('11e)', 'new MouseEvent →', waiver.checked);
waiver.click();
console.log('11f)', 'click()        →', waiver.checked);
console.log('11g)', 'обработчик видел:', seen.join(', '));
JS
console_run console/checkbox.js

cat <<'TEXT'
  Обработчик получил все три события — но галочку переключили только
  два. Переключение — действие по умолчанию на клик. По стандарту DOM
  браузер выполняет его, только если событие — MouseEvent (или его
  наследник) с типом 'click'. Просто Event с тем же именем — нет.
  isTrusted тут ни при чём: все три отправлены кодом.

  click() снял галочку обратно: он создаёт клик сам, и класс у него
  правильный — PointerEvent, наследник MouseEvent (пример 08).
TEXT

say "dispatchEvent('click') у Playwright"
cat > tests/dispatch.spec.ts <<'EOF'
import { test } from '@playwright/test';

test("dispatchEvent('click')", async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    document.querySelector('input[name=waiver]')!.addEventListener('click', (e) => {
      (window as any).seen = `${e.constructor.name}, isTrusted: ${e.isTrusted}`;
    });
  });
  const waiver = page.locator('input[name=waiver]');
  await waiver.dispatchEvent('click');
  console.log(`dispatchEvent('click') → ${await page.evaluate(() => (window as any).seen)}, checked: ${await waiver.isChecked()}`);
});
EOF
run $PW test tests/dispatch.spec.ts 2>&1 | grep -E "dispatchEvent\('click'\) →|код возврата"

cat <<'TEXT'
  Playwright сам выбирает класс по имени события: для 'click' —
  MouseEvent. Поэтому locator.dispatchEvent('click') галочку ставит.
  Ловушка — только в своём коде: new Event('click') в page.evaluate
  или в консоли.

  В wl-e2e оба вида, тысячами: locator.dispatchEvent(' примерно
  в полтора раза чаще, чем dispatchEvent(new …) внутри evaluate.
TEXT
