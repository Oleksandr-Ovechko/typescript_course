#!/usr/bin/env bash
# Урок 16 · Браузерное окружение
#
# Что здесь: window, document, location · что попадает в window, а что нет ·
# что браузер рассказывает о себе · тест в Node, страница в браузере,
# page.evaluate между ними · как Playwright притворяется телефоном.
#
#   bash lessons/lesson-16/examples/01-environment.sh
#   cd /tmp/wl-dom-examples/environment      # песочница остаётся

source "$(dirname "$0")/_sandbox.sh" environment

say "window, document, location — в консоли страницы"
cat > console/window.js <<'JS'
console.log('1)', typeof window, window === globalThis, typeof document);
console.log('1a)', location.pathname, location.host, document.title);
var bookingId = 1;
function bookClass() {}
let clientName = 'Alex';
const passName = '10 visits';
console.log('1b)', 'bookingId' in window, 'bookClass' in window, 'clientName' in window, 'passName' in window);
JS
console_run console/window.js

cat <<'TEXT'
  window — глобальный объект страницы: window === globalThis. document
  и location — его свойства.

  1b) — что из объявленного в скрипте стало свойством window: var
  и объявление function — да; let, const и class — нет. Поэтому
  «всё, что объявили, лежит в window» — неверно: лежит только старое.
TEXT

say "Что браузер рассказывает о себе"
cat > console/navigator.js <<'JS'
console.log('1c)', navigator.language, navigator.hardwareConcurrency > 0, screen.width > 0, devicePixelRatio);
console.log('1d)', typeof navigator.getBattery, typeof navigator.vibrate, navigator.webdriver);
navigator.getBattery().then((b) => console.log('1e)', typeof b.level, typeof b.charging));
JS
console_run console/navigator.js

cat <<'TEXT'
  Язык, число ядер, экран, плотность пикселей, заряд батареи, вибрация —
  всё это навигатор и экран. Значения у каждого свои, поэтому печатаем
  типы.

  Заряд (getBattery) и вибрация (vibrate) есть только в Chromium. Заряд
  к тому же — только на «безопасной» странице: https или localhost.
  На about:blank getBattery — undefined.

  navigator.webdriver — true: браузером управляет программа. Так
  в Playwright во всех трёх движках. Сайты по этому флагу узнают
  автотесты.
TEXT

say "Тест живёт в Node — document там нет"
cat > tests/bridge.spec.ts <<'EOF'
import { test } from '@playwright/test';

test('Node и страница', async ({ page }) => {
  await page.goto('/');
  console.log(`в тесте (Node):       typeof document → ${typeof (globalThis as any).document}`);
  const inPage = await page.evaluate(() => typeof document);
  console.log(`в page.evaluate:      typeof document → ${inPage}`);
  const title = await page.evaluate(() => document.title);
  console.log(`page.evaluate вернул заголовок → ${title}`);
  const vibrated = await page.evaluate(() => navigator.vibrate(200));
  console.log(`page.evaluate(() => navigator.vibrate(200)) → ${vibrated}`);
});
EOF
run $PW test tests/bridge.spec.ts 2>&1 | grep -E 'typeof|вернул|vibrate|код возврата|passed|failed'

cat <<'TEXT'
  Код теста выполняет Node. Там нет ни document, ни window, ни navigator.
  page.evaluate(функция) отправляет функцию в страницу, выполняет её там
  и возвращает результат обратно в тест. Это единственная дверь между
  тестом и браузерными объектами.

  Поэтому «вибрация из теста» — это page.evaluate(() => navigator.vibrate(200)).
  vibrate — метод navigator, не window. Эмуляции вибрации у Playwright
  нет: в его типах этого слова нет ни разу.
TEXT

say "Playwright притворяется телефоном"
cat > tests/mobile.spec.ts <<'EOF'
import { test, devices } from '@playwright/test';

const { defaultBrowserType, ...pixel5 } = devices['Pixel 5'];
test.use(pixel5);

test('Pixel 5', async ({ page }) => {
  console.log(`devices['Pixel 5'] задаёт: ${Object.keys(devices['Pixel 5']).join(', ')}`);
  await page.goto('/');
  const seen = await page.evaluate(() => ({
    mobileInUserAgent: /Mobile/.test(navigator.userAgent),
    screenWidth: screen.width,
    devicePixelRatio,
    touchPoints: navigator.maxTouchPoints,
  }));
  console.log(`страница видит: ${JSON.stringify(seen)}`);
});
EOF
run $PW test tests/mobile.spec.ts 2>&1 | grep -E 'задаёт|видит|код возврата|passed|failed'

cat <<'TEXT'
  Страница узнаёт телефон по тем же свойствам navigator и screen.
  Playwright их подменяет: строка браузера с «Mobile», ширина экрана
  393, плотность 2.75, касания.

  В wl-e2e так устроен проект explorer: в его playwright.config.ts —
  devices['Pixel 5']. Монолит идёт в настольных Chrome, Firefox и Safari.
TEXT
