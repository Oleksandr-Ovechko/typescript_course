/**
 * Домашка урока 6 · Задание 3 — обойти объект цен.
 *
 * Готово, когда: тела трёх функций написаны, файл печатает восемь `true`,
 * `yarn typecheck:hw6` без ошибок. На вопрос в конце есть ответ.
 *
 *   node lessons/lesson-06/homework/03-prices.ts
 *   yarn typecheck:hw6
 *
 * Все три — через Object.entries (или Object.values) и for...of. Объект
 * prices не меняйте: функции только читают его.
 *
 * Сейчас функции возвращают заглушки — часть проверок печатает false.
 */

// А. Сумма всех цен.
function total(prices: { [drink: string]: number }): number {
  return 0;
}

// Б. Название самого дорогого напитка. Пустой объект — пустая строка ''.
function mostExpensive(prices: { [drink: string]: number }): string {
  return '';
}

// В. Строки вида 'tea: 40' для всех напитков не дороже limit, в том порядке,
//    в каком они лежат в объекте.
function affordable(prices: { [drink: string]: number }, limit: number): string[] {
  return [];
}

const menu = { tea: 40, coffee: 60, cocoa: 55 };

console.log('1)', total(menu) === 155);
console.log('2)', total({}) === 0);
console.log('3)', mostExpensive(menu) === 'coffee');
console.log('4)', mostExpensive({ water: 10 }) === 'water');
console.log('5)', mostExpensive({}) === '');
console.log('6)', affordable(menu, 55).join(', ') === 'tea: 40, cocoa: 55');
console.log('7)', affordable(menu, 10).length === 0);
console.log('8)', Object.keys(menu).join(' ') === 'tea coffee cocoa' && menu.tea === 40);

// { [drink: string]: number } в типе — «объект с любыми строковыми ключами
// и числами в значениях». Подробно — в уроке про TypeScript.

// Вопрос (ответ — комментарием здесь же). Почему в 03-object-iteration.ts
// TypeScript не дал написать prices[key] внутри for...in по
// { tea: 40, coffee: 60 }? Что именно он знает о типе prices и чего
// не знает о key?

export {};
