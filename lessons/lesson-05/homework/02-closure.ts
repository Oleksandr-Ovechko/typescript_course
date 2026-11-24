/**
 * Домашка урока 5 · Задание 2 — замыкание.
 *
 * Готово, когда: тела makeMultiplier и makeWallet написаны, файл печатает
 * восемь `true`, `yarn typecheck:hw5` без ошибок. На вопрос в конце есть ответ.
 *
 *   node lessons/lesson-05/homework/02-closure.ts
 *   yarn typecheck:hw5
 *
 * Сейчас в обеих функциях стоят заглушки — с ними проверки печатают false.
 * Замените заглушки своим кодом. Проверки внизу не трогайте.
 */

// А. makeMultiplier(factor) возвращает функцию, которая умножает своё число
//    на factor: makeMultiplier(3) — «утроитель», makeMultiplier(3)(5) === 15.
function makeMultiplier(factor: number): (n: number) => number {
  return (n) => NaN;
}

// Б. makeWallet(start) открывает кошелёк с суммой start и возвращает две
//    функции: add(amount) — добавить и вернуть новую сумму, total() — вернуть
//    сумму. Сумма хранится в переменной внутри makeWallet — и больше нигде:
//    ни в объекте, ни снаружи. Обе функции должны видеть ОДНУ и ту же сумму.
function makeWallet(start: number): { add: (amount: number) => number; total: () => number } {
  return {
    add: (amount) => NaN,
    total: () => NaN,
  };
}

const triple = makeMultiplier(3);
const half = makeMultiplier(0.5);
console.log('1)', triple(5) === 15);
console.log('2)', half(10) === 5);
console.log('3)', triple(half(4)) === 6);

const myWallet = makeWallet(100);
const yourWallet = makeWallet(0);
console.log('4)', myWallet.total() === 100);
console.log('5)', myWallet.add(50) === 150);
console.log('6)', myWallet.total() === 150);
console.log('7)', yourWallet.add(5) === 5);
console.log('8)', myWallet.total() === 150);

// Вопрос (ответ — комментарием здесь же). add и total — две разные функции,
// а сумма у них одна. Как так получается, если ни одна из них не хранит сумму
// у себя? Что изменилось бы, если бы каждая функция копировала сумму к себе
// в момент создания? Какая проверка тогда напечатала бы false?

export {};
