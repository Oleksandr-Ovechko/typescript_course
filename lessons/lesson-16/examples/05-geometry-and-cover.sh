#!/usr/bin/env bash
# Урок 16 · Размеры, прокрутка, координаты
#
# Что здесь: getBoundingClientRect и offsetWidth · scrollIntoView ·
# elementFromPoint — кто лежит в точке · почему Playwright пишет
# «intercepts pointer events» · что делают force: true и dispatchEvent.
#
#   bash lessons/lesson-16/examples/05-geometry-and-cover.sh
#   cd /tmp/wl-dom-examples/geometry-and-cover   # песочница остаётся

source "$(dirname "$0")/_sandbox.sh" geometry-and-cover

say "Прямоугольник элемента"
cat > console/rect.js <<'JS'
const payBtn = document.getElementById('pay');
const payRect = payBtn.getBoundingClientRect();
console.log('7)', payRect.width, payRect.height, payBtn.offsetWidth, payBtn.clientWidth);
console.log('7a)', payRect.x === payRect.left, payRect.y === payRect.top, 'offsetTop' in payRect);
JS
console_run console/rect.js

cat <<'TEXT'
  getBoundingClientRect — прямоугольник элемента относительно окна:
  x (он же left) — от левого края окна, y (он же top) — от верхнего.
  Прокрутили страницу — y изменился.

  offsetWidth, clientWidth и остальные offset*/client* — свойства самого
  элемента, у прямоугольника их нет (7a). clientWidth меньше на рамку.
TEXT

say "Прокрутка"
cat > console/scroll.js <<'JS'
const bottomBtn = document.getElementById('bottom');
console.log('7b)', document.documentElement.scrollHeight > innerHeight, bottomBtn.getBoundingClientRect().top > innerHeight);
bottomBtn.scrollIntoView();
console.log('7c)', bottomBtn.getBoundingClientRect().top < innerHeight, scrollY > 0);
JS
console_run console/scroll.js

cat <<'TEXT'
  Кнопка Bottom ниже окна. scrollIntoView прокручивает страницу так,
  чтобы она оказалась на экране. click и fill Playwright прокручивают
  сами; scrollIntoViewIfNeeded в тесте нужен там, где действия нет:
  перед скриншотом, перед evaluate.
TEXT

say "Кто лежит в центре кнопки"
cat > console/point.js <<'JS'
const payBox = document.getElementById('pay').getBoundingClientRect();
const centerX = payBox.left + payBox.width / 2;
const centerY = payBox.top + payBox.height / 2;
console.log('7d)', document.elementFromPoint(centerX, centerY).id);
JS
console_run console/point.js

cat <<'TEXT'
  elementFromPoint(x, y) — верхний элемент в точке. В центре кнопки Pay —
  не она, а полупрозрачный слой #cover поверх неё. Клик мышью туда
  достанется слою.
TEXT

say "click, force: true и dispatchEvent по закрытой кнопке"
cat > tests/cover.spec.ts <<'EOF'
import { test } from '@playwright/test';

test('click по закрытой кнопке', async ({ page }) => {
  await page.goto('/');
  const pay = page.locator('#pay');
  const err = await pay.click({ timeout: 1_500 }).then(() => null, (e: Error) => e.message);
  const lines = (err ?? 'нажалось').replace(/\x1b\[[0-9;]*m/g, '').split('\n').map((l) => l.trim());
  for (const line of new Set(lines)) if (/intercepts|Timeout/.test(line)) console.log(line);
  await pay.click({ force: true });
  console.log(`после click({ force: true }): «${await pay.textContent()}»`);
  await pay.dispatchEvent('click');
  console.log(`после dispatchEvent('click'): «${await pay.textContent()}»`);
});
EOF
run $PW test tests/cover.spec.ts 2>&1 | grep -E 'intercepts|Timeout|после|код возврата'

cat <<'TEXT'
  click() перед нажатием проверяет элемент: виден, не двигается, включён,
  и в его центре — он сам, а не кто-то сверху. Для последней проверки
  Playwright спрашивает браузер, кто лежит в точке, — как elementFromPoint
  выше (у него — elementsFromPoint, все слои сразу). Не прошла —
  «<div id="cover"></div> intercepts pointer events», повтор, тайм-аут.

  force: true выключает проверки, но не физику: мышь нажимает в ту же
  точку, клик достаётся слою, текст кнопки — «Pay».

  dispatchEvent('click') мышь не двигает: событие создаётся и
  отправляется прямо кнопке. Обработчик срабатывает — «Paid». В wl-e2e
  так обходят перекрытые кнопки — dispatchEvent(' там тысячи.
TEXT
