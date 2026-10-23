/**
 * Урок 4 · Дробные числа в настоящих тестах.
 *
 * Ответ на вопрос, заданный в конце занятия: как автоматизировать репорт,
 * где суммы с копейками. Здесь — то, как это уже сделано в `wl-e2e`, и почему
 * прозвучавший на уроке совет с `parseInt` эти копейки теряет.
 *
 *   node lessons/lesson-04/examples/06-numbers-in-tests.ts   запустить
 *   yarn typecheck                                           проверить типы
 *
 * Playwright здесь не запускается — `extractPrice` и `toBeCloseTo` повторены
 * своими двадцатью строками, чтобы файл работал в обычной ноде.
 */

// ── Что приходит со страницы ───────────────────────────────────────────────
// Всё, что достали из DOM, — строка. Со знаком валюты, разделителями разрядов,
// неразрывными пробелами и переводами строк.
const fromReport = ['$1,234.56', '19.99 USD', '  0.10\n', '$0.00'];

// ── Как это делает wl-e2e ──────────────────────────────────────────────────
// helpers/monolith/store/store-page.ts:99
//
//   export async function extractPrice(locator: Locator): Promise<number> {
//     const text = await locator.evaluate((el) => el.getAttribute('data-amount') || el.textContent || '');
//     return parseFloat(text.replace(/[^0-9.]/g, ''));
//   }
//
// Два шага: вырезать всё, кроме цифр и точки, и прочитать parseFloat.
function extractPrice(text: string): number {
  return parseFloat(text.replace(/[^0-9.]/g, ''));
}

for (const raw of fromReport) {
  console.log(JSON.stringify(raw).padEnd(14), '→', extractPrice(raw));
}
// "$1,234.56"    → 1234.56
// "19.99 USD"    → 19.99
// "  0.10\n"     → 0.1
// "$0.00"        → 0

// ── Почему именно parseFloat ───────────────────────────────────────────────
// parseInt отрезает всё после точки — на суммах это потеря копеек.
console.log('parseInt  :', parseInt('1234.56')); // 1234
console.log('parseFloat:', parseFloat('1234.56')); // 1234.56
console.log('Number    :', Number('1234.56')); // 1234.56 — тоже подходит

// Запятую не понимает ни один из них, поэтому она вырезается ДО вызова:
console.log('без вырезания:', parseFloat('1,234.56'), Number('1,234.56')); // 1 NaN

// Разница между parseFloat и Number — в мусоре справа: parseFloat читает,
// пока может, Number требует, чтобы вся строка была числом.
console.log('с мусором:', parseFloat('19.99 USD'), Number('19.99 USD')); // 19.99 NaN

// ── Как их потом сравнивают ────────────────────────────────────────────────
// Складывать дробные и проверять на === нельзя (см. 03-numbers.ts):
const first = 10.1;
const second = 20.2;
console.log('сумма    :', first + second); // 30.299999999999997
console.log('=== 30.3 :', first + second === 30.3); // false

// В Playwright для этого есть toBeCloseTo — сотни вхождений в wl-e2e.
// Внутри там ровно одна строка (playwright/lib/matchers/expect.js):
//   pass = Math.abs(expected - received) < Math.pow(10, -precision) / 2
function toBeCloseTo(received: number, expected: number, precision = 2): boolean {
  return Math.abs(expected - received) < Math.pow(10, -precision) / 2;
}

console.log('toBeCloseTo(.., 2):', toBeCloseTo(first + second, 30.3)); // true
console.log('и она не всеядна  :', toBeCloseTo(30.31, 30.3)); // false

// Настоящий вызов в тесте выглядит так:
//   expect(sumAmounts(splitAmounts), 'the three selected methods should split the whole order total')
//     .toBeCloseTo(orderTotal, 2);
//   projects/monolith/tests/regression-run/app-drawer-store/store-main/C50360.spec.ts:90
//
// А сама sumAmounts (тот же тест, C50360.helpers.ts:340) складывает СТРОКИ,
// снятые со страницы:
//
//   export function sumAmounts(values: string[]): number {
//     return values.reduce((total, value) => total + Number(value), 0);
//   }
//
// Здесь сходятся обе половины урока: Number(...) обязателен, иначе + склеит
// строки; и Number('') это ноль, поэтому пустая ячейка молча добавит 0
// вместо того, чтобы уронить проверку.

// ── Если нужно не сравнивать, а считать ────────────────────────────────────
// Тогда дробные вообще не используют: переводят в целые (в центы), считают
// и переводят обратно.
const cents = (usd: number): number => Math.round(usd * 100);
const usd = (value: number): number => value / 100;

console.log('в центах :', cents(10.1) + cents(20.2)); // 3030
console.log('обратно  :', usd(cents(10.1) + cents(20.2))); // 30.3
console.log('точно    :', usd(cents(10.1) + cents(20.2)) === 30.3); // true

// И ещё раз: toFixed для этого не годится — он возвращает строку.
console.log('toFixed:', (30.299999999999997).toFixed(2), typeof (30.3).toFixed(2)); // 30.30 string

export {};
