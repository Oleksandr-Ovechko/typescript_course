/**
 * Урок 4 · Параметры.
 *
 * Что здесь: значение по умолчанию и когда оно срабатывает · недостающий
 * аргумент · объект `arguments` и почему его нет у стрелки · остаточные
 * параметры `...` · `...` при вызове и в массиве (спред).
 *
 *   node lessons/lesson-04/examples/02-parameters.ts   запустить
 *   yarn typecheck                                     проверить типы
 */

// ── Значение по умолчанию ──────────────────────────────────────────────────
// greeting = 'Привет' — значение по умолчанию. Тип писать не нужно:
// TypeScript выводит его из значения — string.
// Умолчание срабатывает, ТОЛЬКО если аргумента нет или передан undefined.
// Дело не в типах, а в правиле JavaScript: '' — это переданное значение,
// и умолчание его не трогает.
function greetWith(name: string, greeting = 'Привет'): string {
  return `${greeting}, ${name}!`;
}
console.log('1)', greetWith('Ann'), greetWith('Bob', 'Здравствуйте'), greetWith('Eve', undefined));
// 1) Привет, Ann! Здравствуйте, Bob! Привет, Eve!
console.log('2)', greetWith('Kim', '')); // 2) , Kim!

// С числами — то же самое: 0 передан, значит, умолчание не подставится.
function addTax(price: number, ratePercent = 20): number {
  return price + (price * ratePercent) / 100;
}
console.log('3)', addTax(100), addTax(100, undefined), addTax(100, 0)); // 3) 120 120 100

// Правило как у ??, только строже: умолчание не заменит даже null.
// TypeScript null сюда не пустит, а в чистом JavaScript напечаталось бы «null, Ann!».
// ❌ TS2345: Argument of type 'null' is not assignable to parameter of type 'string | undefined'.
// greetWith('Ann', null);

// ── Недостающий аргумент ───────────────────────────────────────────────────
// Без умолчания TypeScript требует аргумент. Сам JavaScript не возражал бы:
// в параметре было бы undefined, и вышло бы «Привет, undefined!».
function welcome(name: string): string {
  return `Привет, ${name}!`;
}
console.log('4)', welcome('Ann')); // 4) Привет, Ann!
// ❌ TS2554: Expected 1 arguments, but got 0.
// welcome();

// ── arguments — старый способ ──────────────────────────────────────────────
// Внутри функции, объявленной через function, есть arguments — ВСЕ переданные
// аргументы. Это не массив, а объект «похожий на массив»: длина и номера есть,
// методов массива нет. Array.from делает из него настоящий массив.
// В TypeScript-коде arguments почти не встречается: лишний аргумент отклоняет
// проверка типов, а «сколько угодно аргументов» собирают остаточным параметром
// (ниже). Узнавать в старом коде.
function showArgs(first: string, second: string) {
  console.log('5)', arguments.length, arguments[0], Array.isArray(arguments)); // 5) 2 Ann false
  const asArray = Array.from(arguments);
  console.log('6)', Array.isArray(asArray), asArray, first === asArray[0], second); // 6) true [ 'Ann', 'Bob' ] true Bob
}
showArgs('Ann', 'Bob');

// У стрелки СВОЕГО arguments нет. Внутри функции стрелка видит arguments
// внешней функции, а на верхнем уровне файла такого имени нет вовсе.
function outerArgs(a: number, b: number): number {
  const countInner = () => arguments.length;
  return countInner() + a + b;
}
console.log('7)', outerArgs(1, 2)); // 7) 5  — 2 аргумента outerArgs + 1 + 2
// ❌ TS2304: Cannot find name 'arguments'.
// const arrowArgs = () => arguments;

// ── Остаточные параметры: ...numbers ───────────────────────────────────────
// ...numbers в параметрах СОБИРАЕТ все оставшиеся аргументы в массив.
// Это остаточные параметры (rest parameters). numbers — настоящий массив
// с типом number[]. Ничего не передали — пустой массив, сумма 0.
function sumAll(...numbers: number[]): number {
  let sum = 0;
  for (const value of numbers) {
    sum = sum + value;
  }
  return sum;
}
console.log('8)', sumAll(), sumAll(5), sumAll(1, 2, 3, 4)); // 8) 0 5 10

// Обязательные параметры — до остаточного: остаточный — «все остальные»,
// поэтому только последним.
function sumFrom(base: number, ...numbers: number[]): number {
  return base + sumAll(...numbers);
}
console.log('9)', sumFrom(100), sumFrom(100, 1, 2)); // 9) 100 103
// ❌ TS2555: Expected at least 1 arguments, but got 0.
// sumFrom();

// ❌ TS1014: A rest parameter must be last in a parameter list.
// function restInMiddle(...names: string[], last: string) {}

// ── ... при вызове и в массиве: спред ──────────────────────────────────────
// Та же запись, противоположный смысл. При вызове ...prices РАСКЛАДЫВАЕТ
// массив на отдельные аргументы — это спред (spread, «расширение»).
//
//   где стоит ...                что делает                     название
//   в параметрах (...numbers)    собирает аргументы в массив    остаточные параметры
//   при вызове sumAll(...prices) раскладывает массив            спред
//   в массиве [...prices, 40]    раскладывает в новый массив    спред
const prices = [10, 20, 30];
console.log('10)', sumAll(...prices), Math.max(...prices)); // 10) 60 30
const morePrices = [...prices, 40];
console.log('11)', morePrices, prices.length); // 11) [ 10, 20, 30, 40 ] 3  — prices не изменился

// Без ... передаётся одно значение, а не содержимое массива.
// list.length — это одно число 3, то есть ОДИН аргумент.
function countAll(...items: number[]): number {
  return items.length;
}
const list = [5, 6, 7];
console.log('12)', countAll(), countAll(list.length), countAll(...list)); // 12) 0 1 3

export {};
