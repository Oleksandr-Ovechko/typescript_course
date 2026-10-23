#!/usr/bin/env bash
# Урок 16 · Атрибуты и свойства · изменение документа
#
# Что здесь: getAttribute('value') против input.value · checked и
# defaultChecked · data-* и dataset · toHaveValue против toHaveAttribute ·
# createElement, append, remove, classList · живые и неживые списки ·
# скрытый элемент остаётся в DOM — что с ним может Playwright.
#
#   bash lessons/lesson-16/examples/04-attributes-and-changes.sh
#   cd /tmp/wl-dom-examples/attributes-and-changes    # песочница остаётся

source "$(dirname "$0")/_sandbox.sh" attributes-and-changes

say "Атрибут — как в разметке, свойство — как сейчас"
cat > console/value.js <<'JS'
const clientInput = document.querySelector('input[name=client]');
clientInput.value = 'Alex';
console.log('5)', clientInput.value, clientInput.getAttribute('value'), clientInput.defaultValue);
const box = document.createElement('input');
box.type = 'checkbox';
box.setAttribute('checked', '');
box.checked = false;
console.log('5a)', JSON.stringify(box.getAttribute('checked')), box.defaultChecked, box.checked);
JS
console_run console/value.js

cat <<'TEXT'
  В разметке поля — value="Guest". Это атрибут. После ввода свойство
  value — 'Alex', а атрибут остался 'Guest': он хранит начальное
  значение (defaultValue).

  У галочки та же пара. Атрибут checked есть: <input type=checkbox checked>.
  Он — начальное состояние (defaultChecked), свойство checked — текущее.
  Атрибут без значения читается как пустая строка "".
TEXT

say "data-* и dataset"
cat > console/dataset.js <<'JS'
const userSpan = document.querySelector('.user');
console.log('5b)', userSpan.dataset.uid, userSpan.dataset.role, typeof userSpan.dataset.uid, userSpan.getAttribute('data-uid'));
console.log('5c)', [...document.querySelectorAll('.session')].map((li) => li.dataset.key).join(','));
console.log('5d)', userSpan.dataset instanceof Map, typeof userSpan.dataset.get, Object.prototype.toString.call(userSpan.dataset));
JS
console_run console/dataset.js

cat <<'TEXT'
  data-uid="501" в разметке → dataset.uid в коде. Значение — всегда
  строка.

  dataset — не Map (5d): у него нет get, читают через точку —
  dataset.uid. Это объект особого класса DOMStringMap.

  В wl-e2e из data-key строки результата поиска читают uid клиента —
  правило T10 в RULES.md: не разбирать uid из адреса.
  schedule.ts:326, gift-card-page.ts:43.
TEXT

say "toHaveValue против toHaveAttribute"
cat > tests/value.spec.ts <<'EOF'
import { test, expect } from '@playwright/test';

test('value: свойство и атрибут', async ({ page }) => {
  await page.goto('/');
  const client = page.locator('input[name=client]');
  await client.fill('Alex');
  const check = (name: string, p: Promise<void>) =>
    p.then(() => console.log(`${name} — прошло`), () => console.log(`${name} — упало`));
  await check(`toHaveValue('Alex')`, expect(client).toHaveValue('Alex'));
  await check(`toHaveAttribute('value', 'Alex')`, expect(client).toHaveAttribute('value', 'Alex'));
  await check(`toHaveAttribute('value', 'Guest')`, expect(client).toHaveAttribute('value', 'Guest'));
});
EOF
run $PW test tests/value.spec.ts 2>&1 | grep -E 'прошло|упало|код возврата'

cat <<'TEXT'
  После fill свойство — 'Alex', атрибут — по-прежнему 'Guest'.
  toHaveValue читает свойство, toHaveAttribute — атрибут. Проверять,
  что ввелось, — toHaveValue.
TEXT

say "Изменение документа: живые и неживые списки"
cat > console/change.js <<'JS'
const liveSessions = document.getElementsByClassName('session');
const staticSessions = document.querySelectorAll('.session');
const spin = document.createElement('li');
spin.className = 'session';
spin.dataset.key = '1004';
spin.textContent = 'Spin';
document.getElementById('sessions').append(spin);
console.log('6)', liveSessions.length, staticSessions.length);
spin.classList.add('full');
console.log('6a)', spin.outerHTML);
spin.remove();
console.log('6b)', liveSessions.length, document.querySelectorAll('.session').length);
JS
console_run console/change.js

cat <<'TEXT'
  createElement создаёт элемент, но в документ его не кладёт: пока нет
  append, он живёт только в переменной. Ни в DOM, ни в window его нет.

  getElementsByClassName — живой список: сам увидел новую строку (4).
  querySelectorAll — снимок на момент вызова (3). Локатор Playwright
  ведёт себя как третий вариант: он ищет заново при каждом действии.
TEXT

say "Скрытый элемент остаётся в DOM"
cat > console/hidden.js <<'JS'
const secret = document.querySelector('#note span');
console.log('6c)', secret.hidden, getComputedStyle(secret).display);
console.log('6d)', document.body.contains(secret), secret.getBoundingClientRect().width, secret.textContent);
JS
console_run console/hidden.js

cat > tests/hidden.spec.ts <<'EOF'
import { test, expect } from '@playwright/test';

test('display: none', async ({ page }) => {
  await page.goto('/');
  const secret = page.locator('#note span');
  console.log(`textContent() → ${await secret.textContent()}`);
  console.log(`isVisible()   → ${await secret.isVisible()}`);
  await expect(secret).toHaveText('secret');
  console.log(`toHaveText('secret') — прошло`);
  const err = await secret.click({ timeout: 1_000 }).then(() => 'нажалось', (e: Error) => e.message.split('\n')[0]);
  console.log(`click() → ${err}`);
});
EOF
run $PW test tests/hidden.spec.ts 2>&1 | grep -E '→|прошло|код возврата'

cat <<'TEXT'
  display: none не убирает элемент из DOM: он в дереве (contains — true),
  просто не нарисован (ширина 0). Playwright его читает: textContent()
  и toHaveText работают. Не может — нажать: click ждёт видимости и
  падает по тайм-ауту. isVisible() — false.

  Так устроен Chosen в WL: настоящий <select> спрятан, на экране —
  набор div. Тест выставляет значение спрятанному select через
  locator.evaluate — helpers/monolith/setup/services/appointment-setup-page.ts:458-466
  в wl-e2e.
TEXT
