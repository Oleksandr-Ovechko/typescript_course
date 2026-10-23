#!/usr/bin/env bash
# Урок 16 · События · всплытие и погружение · делегирование
#
# Что здесь: addEventListener и removeEventListener · объект события ·
# действие по умолчанию и preventDefault · куда приходит submit · путь
# события: погружение, цель, всплытие · stopPropagation · один обработчик
# на весь список · клик по disabled-кнопке — в браузере и в Playwright.
#
#   bash lessons/lesson-16/examples/06-events.sh
#   cd /tmp/wl-dom-examples/events           # песочница остаётся

source "$(dirname "$0")/_sandbox.sh" events

say "Подписаться и отписаться"
cat > console/listen.js <<'JS'
const firstBook = document.querySelector('.book');
const onBook = (event) => console.log('8)', event.type, event.target.textContent, event.isTrusted);
firstBook.addEventListener('click', onBook);
firstBook.click();
firstBook.removeEventListener('click', onBook);
firstBook.click();
console.log('8a)', 'второй click — без вывода');
JS
console_run console/listen.js

cat <<'TEXT'
  Обработчик — функция, которую элементу дали со словами «когда будет
  click — вызови». Аргумент — объект события: type — что случилось,
  target — с каким элементом.

  Отписаться — removeEventListener с тем же типом и той же функцией.
  Поэтому обработчик держат в переменной: стрелку, написанную прямо
  в вызове, потом не снять.

  isTrusted — false: click() вызван кодом, а не человеком.
TEXT

say "Действие по умолчанию и куда приходит submit"
cat > console/submit.js <<'JS'
const bookingForm = document.getElementById('booking');
const submitBtn = bookingForm.querySelector('button[type=submit]');
submitBtn.addEventListener('submit', () => console.log('8b)', 'submit на кнопке'));
bookingForm.addEventListener('submit', (event) => {
  event.preventDefault();
  console.log('8c)', 'submit на форме', event.target.nodeName, event.defaultPrevented);
});
submitBtn.click();
console.log('8d)', 'страница не перезагрузилась');
JS
console_run console/submit.js

cat <<'TEXT'
  У кнопки type=submit действие по умолчанию — отправить форму, то есть
  перезагрузить страницу. preventDefault() его отменяет.

  Событие submit приходит на ФОРМУ: target — FORM. Обработчик submit
  на самой кнопке не сработал ни разу — 8b) нет в выводе. Вешать
  submit — на форму.
TEXT

say "Путь события: погружение, цель, всплытие"
cat > console/phases.js <<'JS'
const trace = [];
const sessionsList = document.getElementById('sessions');
const firstBook = document.querySelector('.book');
for (const el of [document.body, sessionsList, firstBook]) {
  el.addEventListener('click', (e) => trace.push(`${e.currentTarget.nodeName}:всплытие`));
  el.addEventListener('click', (e) => trace.push(`${e.currentTarget.nodeName}:погружение`), true);
}
firstBook.click();
console.log('9)', trace.join(' → '));
trace.length = 0;
sessionsList.addEventListener('click', (e) => e.stopPropagation());
firstBook.click();
console.log('9a)', trace.join(' → '));
JS
console_run console/phases.js

cat <<'TEXT'
  Событие идёт от корня вниз до кнопки (погружение), потом обратно
  вверх (всплытие). Третий аргумент true — «слушать на погружении»;
  без него — на всплытии.

  9a) — на списке вызван stopPropagation в фазе всплытия: до BODY событие
  не поднялось. stopPropagation останавливает событие там, где вызван,
  в любой фазе. Ниже — тот же вызов на BODY при погружении.
TEXT

cat > console/stop-capture.js <<'JS'
const reached = [];
document.body.addEventListener('click', (e) => { reached.push('BODY:погружение'); e.stopPropagation(); }, true);
const firstBook = document.querySelector('.book');
firstBook.addEventListener('click', () => reached.push('BUTTON'));
firstBook.click();
console.log('9b)', reached.join(' → '));
JS
console_run console/stop-capture.js

cat <<'TEXT'
  Остановили на погружении — до кнопки событие не дошло вовсе.
TEXT

say "Делегирование: один обработчик на весь список"
cat > console/delegation.js <<'JS'
const sessionsList = document.getElementById('sessions');
sessionsList.addEventListener('click', (event) => {
  const button = event.target.closest('.book');
  if (!button) return;
  console.log('10)', button.closest('.session').dataset.key);
});
document.querySelectorAll('.book')[2].click();
document.querySelectorAll('.book')[1].click();
document.querySelector('.session .time').click();
const lateRow = document.createElement('li');
lateRow.className = 'session';
lateRow.dataset.key = '1005';
lateRow.innerHTML = '<span class="name">Barre</span> <button class="book">Book</button>';
sessionsList.append(lateRow);
lateRow.querySelector('.book').click();
JS
console_run console/delegation.js

cat <<'TEXT'
  Обработчик один — на <ul>. Клик по кнопке всплывает до списка, и там
  по event.target видно, куда нажали. Делегирование держится на
  всплытии.

  Три клика — два ответа. Вторая кнопка — disabled: браузер не отправляет
  click вовсе. Клик по времени — не по кнопке: closest('.book') дал
  null, обработчик вышел. Строку 1005 добавили после того, как повесили
  обработчик, — и она работает: обработчик на списке, а не на кнопках.
TEXT

say "disabled-кнопка: браузер молчит, Playwright — нет"
cat > tests/disabled.spec.ts <<'EOF'
import { test } from '@playwright/test';

test('click по disabled', async ({ page }) => {
  await page.goto('/');
  const full = page.locator('.session.full .book');
  const err = await full.click({ timeout: 1_000 }).then(() => 'нажалось', (e: Error) => e.message);
  const lines = err.replace(/\x1b\[[0-9;]*m/g, '').split('\n').map((l) => l.trim());
  for (const line of new Set(lines)) if (/Timeout|not enabled/.test(line)) console.log(line);
});
EOF
run $PW test tests/disabled.spec.ts 2>&1 | grep -E 'Timeout|not enabled|код возврата'

cat <<'TEXT'
  Playwright не нажимает молча: он ждёт, пока кнопка станет доступной,
  и падает по тайм-ауту с причиной «element is not enabled».
TEXT
