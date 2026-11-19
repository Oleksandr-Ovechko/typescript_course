/**
 * Домашка урока 4 (часть 1) · Задание 2 — остаточные параметры и спред.
 *
 * Готово, когда: тела maxOf и averageOf написаны, файл печатает восемь
 * `true`, `yarn typecheck:hw4` по этому файлу без ошибок. На вопрос в конце
 * есть ответ.
 *
 *   node lessons/lesson-04/homework/02-rest-and-spread.ts
 *   yarn typecheck:hw4
 *
 * Сейчас в обеих функциях стоит заглушка `return NaN` — с ней все проверки
 * печатают false. Замените заглушку своим кодом. Проверки внизу не трогайте.
 */

function sumAll(...numbers: number[]): number {
  let sum = 0;
  for (const value of numbers) {
    sum = sum + value;
  }
  return sum;
}

// А. Самое большое из переданных чисел. Без Math.max — циклом.
//    Если чисел не передали — 0.
//    Подумайте, с какого значения начать поиск: среди проверок есть
//    одни отрицательные числа.
function maxOf(...numbers: number[]): number {
  return NaN;
}

// Б. Среднее арифметическое: сумма, делённая на количество.
//    Сумму считайте через sumAll — передайте ей числа, которые получили.
//    Если чисел не передали — 0 (а не то, что даст деление 0 / 0).
function averageOf(...numbers: number[]): number {
  return NaN;
}

const prices = [30, 10, 20];

console.log('1)', maxOf(3, 9, 4) === 9);
console.log('2)', maxOf(-5, -2, -9) === -2);
console.log('3)', maxOf(...prices) === 30);
console.log('4)', maxOf() === 0);
console.log('5)', averageOf(2, 4, 6) === 4);
console.log('6)', averageOf(...prices) === 20);
console.log('7)', averageOf(5) === 5);
console.log('8)', averageOf() === 0);

// Вопрос (ответ — комментарием здесь же). Раскомментируйте строку ниже,
// запустите `yarn typecheck:hw4` и прочитайте ошибку. Почему так нельзя,
// хотя в prices лежат числа? Что нужно дописать, чтобы заработало?
// Потом закомментируйте строку обратно.
// console.log(averageOf(prices));

export {};
