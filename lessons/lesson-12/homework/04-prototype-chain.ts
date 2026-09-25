/**
 * Задание 4 · Цепочка прототипов.
 *
 * Для каждого значения — пять вопросов «собственное ли свойство» и «найдётся
 * ли по цепочке». Напротив каждой стрелки `// →` напишите два значения
 * (true/false) ДО запуска, потом запустите и сверьте:
 *
 *   node lessons/lesson-12/homework/04-prototype-chain.ts
 *
 * Не совпало — самое ценное место. Припишите, в каком звене цепочки нашлось
 * (или не нашлось) свойство: в самом значении, в его прототипе, в
 * Object.prototype. Ответ «потому что прототип» не принимается.
 */

const check = (label: string, value: object, key: PropertyKey) =>
  console.log(`${label.padEnd(34)} hasOwn: ${String(Object.hasOwn(value, key)).padEnd(5)}  in: ${key in value}`);

// ── Массив ────────────────────────────────────────────────────────────────
const cases = ['C157112', 'C22041'];
check("массив · 'length'", cases, 'length');                // →
check("массив · 'push'", cases, 'push');                    // →
check("массив · '0'", cases, '0');                          // →
check('массив · Symbol.iterator', cases, Symbol.iterator);  // →
check("массив · 'hasOwnProperty'", cases, 'hasOwnProperty'); // →

// ── Строка ────────────────────────────────────────────────────────────────
// Строка — примитив, а hasOwn и `in` работают с объектами. Заворачиваем её
// в обёртку явно — ровно то, что движок делает сам при вызове метода.
const title = Object('booking zero-cost') as object;
check("строка · 'length'", title, 'length');                 // →
check("строка · 'toUpperCase'", title, 'toUpperCase');       // →
check("строка · '0'", title, '0');                           // →
check("строка · 'includes'", title, 'includes');             // →
check("строка · 'toString'", title, 'toString');             // →

// ── Дата ──────────────────────────────────────────────────────────────────
const startedAt = new Date(0);
check("дата · 'getTime'", startedAt, 'getTime');             // →
check("дата · 'toISOString'", startedAt, 'toISOString');     // →
check("дата · 'toString'", startedAt, 'toString');           // →
check("дата · 'valueOf'", startedAt, 'valueOf');             // →
check("дата · 'constructor'", startedAt, 'constructor');     // →

// ── Свой объект ───────────────────────────────────────────────────────────
const session = { staffUid: '42', toString() { return `staff ${this.staffUid}`; } };
check("объект · 'staffUid'", session, 'staffUid');           // →
check("объект · 'toString'", session, 'toString');           // →
check("объект · 'valueOf'", session, 'valueOf');             // →
check("объект · 'map'", session, 'map');                     // →
check("объект · 'constructor'", session, 'constructor');     // →

// ── Три вопроса словами ───────────────────────────────────────────────────
// 1. У строки 'length' и '0' — собственные. Чьи именно: самой строки или
//    обёртки? Что это говорит о том, куда смотрит Object.hasOwn?
//
// 2. У даты 'toString' нашёлся по цепочке — в каком из двух прототипов
//    (Date.prototype или Object.prototype)? Как проверить одной строкой?
//
// 3. `${session}` даёт «staff 42» — у session свой toString. А `${cases}`
//    даёт «C157112,C22041», а не «[object Object]», хотя
//    Object.hasOwn(cases, 'toString') — false. Где нашёлся его toString?

export {};
