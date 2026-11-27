/**
 * Урок 6 · Обход объекта и логическое присваивание.
 *
 * Что здесь: for...in даёт ключи · по массиву — номера-строки · почему
 * prices[key] не компилируется · Object.keys, Object.values, Object.entries ·
 * for...of по парам с шаблоном [ключ, значение] · ??=, ||= и &&=.
 *
 *   node lessons/lesson-06/examples/03-object-iteration.ts   запустить
 *   yarn typecheck                                           проверить типы
 */

// ── for...in — ключи объекта ───────────────────────────────────────────────
// for...in проходит по ключам: в key по очереди лежат 'tea' и 'coffee'.
// Значений он не даёт.
const prices = { tea: 40, coffee: 60 };
for (const key in prices) {
  console.log('1)', key);
}
// 1) tea
// 1) coffee

// Тип prices TypeScript знает: { tea: number; coffee: number }. Но key для
// него — ЛЮБАЯ строка, а не только 'tea' или 'coffee': for...in может принести
// и чужие ключи. Поэтому значение по такому ключу он не даёт:
for (const key in prices) {
  // ❌ TS7053: Element implicitly has an 'any' type because expression of type 'string' can't be used to index type '{ tea: number; coffee: number; }'.
  // console.log(prices[key]);
  console.log('2)', key.length);
}
// 2) 3
// 2) 6

// По массиву for...in тоже даёт только ключи — номера. И это СТРОКИ.
for (const index in ['a', 'b']) {
  console.log('3)', index, typeof index);
}
// 3) 0 string
// 3) 1 string

// ── Object.keys, Object.values, Object.entries ─────────────────────────────
//   Object.keys(obj)     массив ключей
//   Object.values(obj)   массив значений
//   Object.entries(obj)  массив пар [ключ, значение]
console.log('4)', Object.keys(prices), Object.values(prices));
// 4) [ 'tea', 'coffee' ] [ 40, 60 ]
console.log('5)', Object.entries(prices)); // 5) [ [ 'tea', 40 ], [ 'coffee', 60 ] ]

// Пары — это массивы, поэтому каждую сразу раскладывают шаблоном массива
// (02-destructuring.ts). Object.entries и for...of — обычный способ обойти
// объект; for...in в современном коде встречается редко.
for (const [drink, cost] of Object.entries(prices)) {
  console.log('6)', `${drink}: ${cost}`);
}
// 6) tea: 40
// 6) coffee: 60

// ── ??= — дописать, если пусто ─────────────────────────────────────────────
//   a ??= b   записать b, только если a — null или undefined
//   a ||= b   записать b, если a ложное: ещё и 0, '', false
//   a &&= b   записать b, только если a истинное
// Та же разница, что у ?? и || в уроке 3.
const settings: { theme?: string; volume?: number } = { volume: 0 };
settings.theme ??= 'light';
settings.volume ??= 50;
console.log('7)', settings); // 7) { volume: 0, theme: 'light' }
// theme не было — undefined, записали. volume — 0: это значение, ??= его не тронул.

const loudSettings: { volume?: number } = { volume: 0 };
loudSettings.volume ||= 50;
console.log('8)', loudSettings); // 8) { volume: 50 } — 0 ложное, ||= его затёр

const mutedSettings: { volume?: number } = { volume: 0 };
mutedSettings.volume &&= 50;
console.log('9)', mutedSettings); // 9) { volume: 0 } — 0 ложное, &&= дальше не пошёл

export {};
