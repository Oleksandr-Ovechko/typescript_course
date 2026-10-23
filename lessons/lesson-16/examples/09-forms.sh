#!/usr/bin/env bash
# Урок 16 · Формы и элементы управления
#
# Что здесь: document.forms и elements · value, checked, selectedIndex ·
# input и change · где у поля живёт value — геттер и сеттер в прототипе ·
# почему fill иногда «не срабатывает» и что такое родной сеттер ·
# спрятанный select: выставить значение и сообщить библиотеке.
#
#   bash lessons/lesson-16/examples/09-forms.sh
#   cd /tmp/wl-dom-examples/forms            # песочница остаётся

source "$(dirname "$0")/_sandbox.sh" forms

say "Форма как объект"
cat > console/form.js <<'JS'
document.querySelector('input[name=client]').value = 'Alex';
document.querySelector('input[name=waiver]').checked = true;
const form = document.forms.booking;
console.log('13)', form.elements.client.value, form.elements.waiver.checked, form.elements.pass.value, form.elements.pass.selectedIndex, form.elements.pass.options[0].text);
console.log('13a)', document.forms.booking === document.getElementById('booking'));
JS
console_run console/form.js

cat <<'TEXT'
  document.forms — все формы страницы, по имени или id: у этой формы
  и то и другое — booking. form.elements — её поля по атрибуту name.

  Значение у каждого поля своё: у текстового — value, у галочки —
  checked, у списка — value выбранного пункта и selectedIndex.
TEXT

say "input и change"
cat > tests/input-change.spec.ts <<'EOF'
import { test } from '@playwright/test';

test('input и change', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    (window as any).log = [];
    for (const type of ['input', 'change'])
      document.forms.namedItem('booking')!.addEventListener(type, (e) => (window as any).log.push(`${type}@${(e.target as HTMLInputElement).name}`));
  });
  const take = () => page.evaluate(() => (window as any).log.splice(0).join(' → ') || '—');
  await page.locator('input[name=client]').pressSequentially('Al');
  console.log(`печатаем «Al»:              ${await take()}`);
  await page.locator('input[name=email]').click();
  console.log(`ушли из поля (blur):        ${await take()}`);
  await page.locator('input[name=waiver]').check();
  console.log(`галочка:                    ${await take()}`);
  await page.locator('select[name=pass]').selectOption('drop-in');
  console.log(`список:                     ${await take()}`);
});
EOF
run $PW test tests/input-change.spec.ts 2>&1 | grep -E 'печатаем|ушли|галочка|список|код возврата'

cat <<'TEXT'
  input — на каждое изменение: по событию на букву. change — когда
  изменение зафиксировано: у текстового поля — при уходе из поля или
  по Enter, у галочки и списка — сразу.

  Обработчики висят на форме, а ловят события полей — всплытие.
TEXT

say "Где у поля живёт value"
cat > console/setter.js <<'JS'
const clientInput = document.querySelector('input[name=client]');
const valueDescriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
console.log('13b)', typeof valueDescriptor.get, typeof valueDescriptor.set, Object.hasOwn(clientInput, 'value'));
const cardInput = document.getElementById('card');
const cardStateEl = document.getElementById('card-state');
console.log('13c)', Object.hasOwn(cardInput, 'value'));
cardInput.value = '4111';
cardInput.dispatchEvent(new Event('input', { bubbles: true }));
console.log('13d)', cardInput.value, cardStateEl.textContent);
valueDescriptor.set.call(cardInput, '4242');
cardInput.dispatchEvent(new Event('input', { bubbles: true }));
console.log('13e)', cardInput.value, cardStateEl.textContent);
JS
console_run console/setter.js

cat <<'TEXT'
  value у поля — пара геттер и сеттер (урок 14), и лежит она
  в прототипе, HTMLInputElement.prototype. Своего value у обычного поля
  нет (13b: hasOwn — false).

  Поле Card на странице — модель того, что делают фреймворки: скрипт
  страницы положил на элемент СВОЙ сеттер value (13c: hasOwn — true).
  Он запоминает записанное, а на событие input реагирует, только если
  значение отличается от запомненного.

  13d) — записали через обычное присваивание: сработал свой сеттер,
  запомнил '4111', input пришёл — «ничего не поменялось», state пустой.

  13e) — записали РОДНЫМ сеттером из прототипа, в обход своего: модель
  не знает о '4242', input пришёл — state обновился.

  Это и есть приём из wl-e2e: «Playwright .fill() doesn't trigger React's
  onChange on this WL form; use the native prototype setter» —
  projects/widgets/end-to-end-tests/schedule-widget/C85303.helpers.ts:128.
  Ведёт ли себя настоящий React ровно так, как модель, — здесь не
  проверялось; проверено, что приём работает на модели.
TEXT

say "Спрятанный select: значение есть, события нет"
cat > console/hidden-select.js <<'JS'
const pass = document.querySelector('select[name=pass]');
const heard = [];
pass.addEventListener('change', () => heard.push(`change: ${pass.value}`));
pass.value = 'drop-in';
console.log('13f)', pass.value, heard.length);
pass.dispatchEvent(new Event('change', { bubbles: true }));
console.log('13g)', heard.join(', '));
JS
console_run console/hidden-select.js

cat <<'TEXT'
  Присвоение value из кода событий не порождает: значение поменялось,
  а слушатели (13f: 0) об этом не узнали. Чтобы узнали — событие
  отправляют вручную.

  Так в wl-e2e работают со списками Chosen: настоящий <select> спрятан
  (display: none — в DOM он есть), на экране — набор div. Тест через
  evaluate выставляет значение спрятанному select и сообщает
  библиотеке: change и chosen:updated — своё событие Chosen.
  helpers/monolith/setup/services/appointment-setup-page.ts:457-465,
  class-period-edit-page.ts:33-39.
TEXT
