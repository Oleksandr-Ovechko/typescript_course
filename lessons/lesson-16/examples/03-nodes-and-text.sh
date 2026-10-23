#!/usr/bin/env bash
# Урок 16 · Узлы: класс, прототипы, текст
#
# Что здесь: от какого класса кнопка и откуда у неё методы · типы узлов ·
# textContent, innerText, innerHTML · что из этого читает toHaveText и
# почему toHaveText(/^Staff$/) падает там, где toHaveText('Staff') проходит.
#
#   bash lessons/lesson-16/examples/03-nodes-and-text.sh
#   cd /tmp/wl-dom-examples/nodes-and-text     # песочница остаётся

source "$(dirname "$0")/_sandbox.sh" nodes-and-text

say "Кнопка — объект класса, методы — в прототипах"
cat > console/classes.js <<'JS'
const bookBtn = document.querySelector('.book');
const chain = [];
for (let p = Object.getPrototypeOf(bookBtn); p; p = Object.getPrototypeOf(p)) chain.push(p.constructor.name);
console.log('4)', chain.join(' → '));
console.log('4a)', bookBtn.nodeType, bookBtn.nodeName, bookBtn.firstChild.nodeType, bookBtn instanceof HTMLElement);
console.log('4d)', Object.hasOwn(bookBtn, 'click'), Object.hasOwn(HTMLElement.prototype, 'click'));
JS
console_run console/classes.js

cat <<'TEXT'
  Цепочка прототипов — уроки 12–13. Кнопка — объект HTMLButtonElement.
  Метод click лежит не в ней, а в HTMLElement.prototype (4d).
  addEventListener — ещё выше, в EventTarget.

  nodeType 1 — элемент, 3 — текстовый узел (текст «Book» внутри кнопки).
TEXT

say "Три способа прочитать текст"
cat > console/text.js <<'JS'
const staffTitle = document.querySelector('.filter-title');
console.log('4b)', JSON.stringify(staffTitle.textContent), JSON.stringify(staffTitle.innerText));
const noteP = document.getElementById('note');
console.log('4c)', noteP.textContent, '|', noteP.innerText, '|', noteP.innerHTML);
JS
console_run console/text.js

cat <<'TEXT'
  textContent — текст из разметки как есть: переносы, отступы, скрытые
  куски. innerText — как текст нарисован: без лишних пробелов, без
  скрытого (<span hidden>secret</span> пропал). innerHTML — разметка
  строкой.

  .filter-title на экране — одно слово в одну строку. А в textContent —
  перенос и четыре пробела с обеих сторон. Переносы в textContent
  решает разметка, а не отрисовка: в одну строку нарисован, но в
  разметке перенесён — переносы будут.
TEXT

say "Что читает toHaveText"
cat > tests/text.spec.ts <<'EOF'
import { test, expect } from '@playwright/test';

test('текст элемента', async ({ page }) => {
  await page.goto('/');
  const title = page.locator('.filter-title');
  console.log(`textContent() → ${JSON.stringify(await title.textContent())}`);
  console.log(`innerText()   → ${JSON.stringify(await title.innerText())}`);
  const check = (name: string, p: Promise<void>) =>
    p.then(() => console.log(`${name} — прошло`), () => console.log(`${name} — упало`));
  await check(`toHaveText('Staff')`, expect(title).toHaveText('Staff'));
  await check(`toHaveText(/^Staff$/)`, expect(title).toHaveText(/^Staff$/));
  await check(`toHaveText(/^\\s*Staff\\s*$/)`, expect(title).toHaveText(/^\s*Staff\s*$/));
  await check(`toHaveText(/^Staff$/, { useInnerText: true })`, expect(title).toHaveText(/^Staff$/, { useInnerText: true }));
  const note = page.locator('#note');
  await check(`#note toHaveText('Book now')`, expect(note).toHaveText('Book now'));
  await check(`#note toHaveText('Book now', { useInnerText: true })`, expect(note).toHaveText('Book now', { useInnerText: true }));
});
EOF
run $PW test tests/text.spec.ts 2>&1 | grep -E '→|прошло|упало|код возврата'

cat <<'TEXT'
  toHaveText читает textContent. Со строкой он перед сравнением сжимает
  пробелы и обрезает края — поэтому 'Staff' проходит. С регуляркой
  сжатия нет: /^Staff$/ сравнивается с "\n    Staff\n  " и падает.

  Два способа: допустить пробелы в самой регулярке — /^\s*Staff\s*$/
  (тот же шаблон стоит в wl-e2e, C19633.spec.ts:12, в фильтре hasText),
  или читать innerText — { useInnerText: true }.

  Ожидание и повторы у toHaveText с регуляркой остаются те же — пропадает
  только сжатие пробелов.

  #note: в textContent есть скрытое «secret», поэтому 'Book now'
  не совпадает. С useInnerText — совпадает.
TEXT
