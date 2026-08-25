/**
 * Урок 4 · Уточнения — места, где на занятии прозвучала неточность.
 *
 * Что здесь: `parseInt` теряет копейки · колбэк `sort` возвращает число ·
 * `setTimeout` ждёт конца кода, а не компиляции · `Number.EPSILON`.
 *
 *   node lessons/lesson-04/examples/00-corrections.ts     запустить
 *   yarn typecheck                                        проверить типы
 *
 * Читать этот файл первым: дальше по примерам всё написано уже правильно.
 */

// ── parseInt отбрасывает всё после точки ───────────────────────────────────
// Самое дорогое уточнение урока: на вопрос «как сравнивать суммы из репорта»
// прозвучал совет делать parseInt. Он отрезает копейки.
console.log('parseInt("12.5")  :', parseInt('12.5')); // 12
console.log('parseFloat("12.5"):', parseFloat('12.5')); // 12.5

const rawPrice = '$1,234.56';
const digitsOnly = rawPrice.replace(/[^0-9.]/g, ''); // '1234.56'

console.log('parseInt  :', parseInt(digitsOnly)); // 1234    ← потеряли 56 центов
console.log('parseFloat:', parseFloat(digitsOnly)); // 1234.56

// Запятую parseFloat не понимает — поэтому её вырезают ДО вызова.
console.log('parseFloat("1,234.56"):', parseFloat('1,234.56')); // 1
console.log('Number("1,234.56")    :', Number('1,234.56')); // NaN

// ── Колбэк sort возвращает число, а не true/false ──────────────────────────
// Прозвучало «возвращает true или false, какое из них меньше». Возвращать
// нужно число: отрицательное, ноль или положительное.
console.log('a - b   :', [10, 9, 1, 100].sort((a, b) => a - b)); // [1, 9, 10, 100]

// ❌ TS2345: Argument of type '(a: number, b: number) => boolean' is not assignable to parameter of type '(a: number, b: number) => number'.
// console.log('a > b   :', [10, 9, 1, 100].sort((a, b) => a > b));

// В чистом JavaScript такой колбэк компилятор бы не остановил, а сортировки
// не было бы: false → 0 → «элементы равны».
const booleanLike = (a: number, b: number): number => Number(a > b);
console.log('Number(a > b):', [5, 4, 3, 2, 1].sort(booleanLike)); // [5, 4, 3, 2, 1] — не тронут

// ── setTimeout ждёт конца кода, а не компиляции ────────────────────────────
// Прозвучало «откладывает до завершения компиляции». Компиляция закончилась
// задолго до этого. Колбэк ждёт, пока доработает весь синхронный код.
setTimeout(() => console.log('3. setTimeout — последним'));
void Promise.resolve().then(() => console.log('2. промис — раньше setTimeout'));
console.log('1. синхронный код — первым');

// ── Number.EPSILON работает рядом с единицей ───────────────────────────────
// Прозвучало «минимально различимая разница». Это расстояние между 1
// и следующим представимым числом. Дальше от единицы приём ломается.
console.log('EPSILON:', Number.EPSILON); // 2.220446049250313e-16
console.log('рядом с 1 :', Math.abs(0.1 + 0.2 - 0.3) < Number.EPSILON); // true
console.log('на миллиарде:', Math.abs(1e9 + 0.1 + 0.2 - (1e9 + 0.3)) < Number.EPSILON); // false

// В тестах этим не занимаются вовсе — там expect(...).toBeCloseTo(x, 2).
// См. 06-numbers-in-tests.ts

export {};
