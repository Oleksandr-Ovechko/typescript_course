/**
 * Урок 2 · Какого типа значение.
 *
 * Что здесь: `typeof` и семь примитивов · `undefined` и `null` · объект
 * и массив · что `typeof` говорит про объект, массив и `null` ·
 * `Array.isArray` · метод — действие через точку.
 *
 *   node lessons/lesson-02/examples/02-types-of-values.ts   запустить
 *   yarn typecheck                                          проверить типы
 */

// ── typeof и семь примитивов ───────────────────────────────────────────────
// typeof — оператор, как + или -: пишется перед значением, без точки
// и без скобок, и отдаёт СТРОКУ с именем типа.
console.log('1)', typeof 'Ann', typeof 42, typeof 1.5, typeof true, typeof 10n);
// 1) string number number boolean bigint

// 42 и 1.5 — один тип number: отдельного «целого» нет.
// 10n — bigint, целые любой длины; в тестах не нужен.
//
// Примитив — простое значение, которое не состоит из других. Их семь:
//   string · number · boolean · bigint · undefined · null · symbol
// Всё остальное — объект: и {…}, и массив, и функция.

// ── undefined и null ───────────────────────────────────────────────────────
// undefined — значения не было: имя завели, а положить ничего не положили.
// null — значение нарочно пустое: кто-то положил «пусто» сам.
let notAssigned;
const cleared = null;
console.log('2)', notAssigned, cleared, typeof notAssigned); // 2) undefined null undefined

// ── Объект и массив ────────────────────────────────────────────────────────
// Объект держит значения под именами — достаём через точку.
// Массив держит значения по порядку под номерами — достаём по номеру в [].
// Номера идут с нуля.
const client = { name: 'Ann', visits: 3 };
const prices = [10, 20, 30];
console.log('3)', client, prices); // 3) { name: 'Ann', visits: 3 } [ 10, 20, 30 ]
console.log('4)', client.name, prices[0], prices[2]); // 4) Ann 10 30

// ── Что typeof скажет про объект ───────────────────────────────────────────
console.log('5)', typeof client, typeof prices, typeof cleared); // 5) object object object

// Массив и правда объект — но так его от объекта не отличить.
// typeof null === 'object' — ошибка в самом языке с 1995 года, исправить
// нельзя: на неё завязано слишком много кода. null — примитив, врёт
// только typeof.

// ── Array.isArray и методы ─────────────────────────────────────────────────
// Метод — действие, которое есть у значения: значение.метод(…).
// Array — встроенный объект для работы с массивами, isArray — его метод.
console.log('6)', Array.isArray(prices), Array.isArray(client)); // 6) true false
console.log('7)', 'ann'.toUpperCase(), prices.includes(20)); // 7) ANN true

// Через точку достают и данные (client.name), и действия (.isArray(…)).
// Различие — по скобкам: со скобками это вызов.
// console.log — тоже метод: console — встроенный объект, log — его метод.

export {};
