/**
 * Домашка урока 3 · Задание 2 — четыре бага.
 *
 * Готово, когда: файл печатает четыре строки с `true`, а `yarn typecheck:hw3`
 * заканчивается без ошибок.
 *
 *   node lessons/lesson-03/homework/02-four-bugs.ts
 *   yarn typecheck:hw3
 *
 * В каждом из четырёх кусков ровно ОДНА ошибка, и все четыре — с урока 3.
 * Строки с проверками внизу файла не меняем: чинить нужно сами куски.
 *
 * До починки `yarn typecheck:hw3` находит ровно одну ошибку из четырёх.
 * Какую — и почему именно её? Остальные три TypeScript считает
 * совершенно законным кодом: о них скажет только `false` при запуске.
 */

// ── Баг 1. Таймаут из конфига ──────────────────────────────────────────────
// В конфиге таймаут 0 — «не ждать». Запасные 30 секунд нужны, только если
// таймаута в конфиге нет вовсе.
const timeoutFromConfig: number | undefined = 0;
const timeoutMs = timeoutFromConfig || 30_000;

// ── Баг 2. Категория ответа сервера ────────────────────────────────────────
// Меньше 300 — 'успех', меньше 500 — 'ошибка клиента', остальное —
// 'ошибка сервера'. Для кода 250 нужен 'успех'.
const statusCode: number = 250;
let category: string;
if (statusCode < 500) {
  category = 'ошибка клиента';
} else if (statusCode < 300) {
  category = 'успех';
} else {
  category = 'ошибка сервера';
}

// ── Баг 3. Задержка в днях ─────────────────────────────────────────────────
// 'Day(s)' — 1 день, 'Week(s)' — 7, 'Month(s)' — 30.
const delayUnit: string = 'Day(s)';
let delayDays = 0;
switch (delayUnit) {
  case 'Day(s)':
    delayDays = 1;
  case 'Week(s)':
    delayDays = 7;
    break;
  case 'Month(s)':
    delayDays = 30;
    break;
}

// ── Баг 4. Счётчик на странице ─────────────────────────────────────────────
// Со страницы прочитали текст счётчика. Нужно проверить, что в нём 3.
const shownCount: string = '3';
const expectedCount: number = 3;
const countMatches = shownCount === expectedCount;

// ───────────────────────────────────────────────────────────────────────────
// Ниже ничего не меняем: это проверки. Каждая должна напечатать true.
// ───────────────────────────────────────────────────────────────────────────

console.log('1)', timeoutMs === 0, timeoutMs);
console.log('2)', category === 'успех', category);
console.log('3)', delayDays === 1, delayDays);
console.log('4)', countMatches === true, countMatches);

export {};
