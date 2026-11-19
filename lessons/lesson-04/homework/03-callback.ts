/**
 * Домашка урока 4 (часть 1) · Задание 3 — колбэк со своим типом.
 *
 * Готово, когда: у параметра action написан тип функции, тело applyTwice
 * написано, файл печатает три `true`, `yarn typecheck:hw4` по этому файлу
 * без ошибок. На оба вопроса есть ответы.
 *
 *   node lessons/lesson-04/homework/03-callback.ts
 *   yarn typecheck:hw4
 *
 * applyTwice(value, action) должна применить action к value два раза:
 * сначала к value, потом — к тому, что вернул первый вызов.
 * Например, applyTwice(3, double): double(3) = 6, double(6) = 12.
 *
 * Сейчас у action тип unknown — «неизвестно что». Поэтому:
 *   — вызвать action внутри applyTwice TypeScript не даст;
 *   — `yarn typecheck:hw4` показывает ошибку в проверке 3: TypeScript не знает,
 *     какого типа n. Это часть задания: ошибка исчезнет сама, когда вы
 *     опишете тип action.
 * Замените unknown на тип функции, которая принимает число и возвращает
 * число, и напишите тело вместо `return NaN`. Проверки не трогайте.
 */

function applyTwice(value: number, action: unknown): number {
  return NaN;
}

const double = (n: number): number => n * 2;
const addTen = (n: number): number => n + 10;

console.log('1)', applyTwice(3, double) === 12);
console.log('2)', applyTwice(1, addTen) === 21);
console.log('3)', applyTwice(10, (n) => n - 1) === 8);

// Вопрос 1 (ответ — комментарием здесь же). Раскомментируйте строку ниже
// и прочитайте, что скажет TypeScript. Что на самом деле получила applyTwice
// вторым аргументом и почему? Как исправить, не меняя applyTwice?
// Потом закомментируйте строку обратно.
// console.log(applyTwice(3, double(3)));

// Вопрос 2. И в типе action, и в проверке 3 есть стрелка `=>`. Чем отличается
// то, что вы написали после `action:`, от `(n) => n - 1` в проверке 3?
// Что из этого что-то делает при запуске, а что — только описание?

export {};
