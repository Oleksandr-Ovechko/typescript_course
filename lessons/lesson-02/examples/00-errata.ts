/**
 * Урок 2 · Блок 0 — работа над ошибками первого урока.
 *
 * Что здесь: семь примитивов и `typeof` · `strict` в tsconfig против `'use strict'`
 * в JS · Map и Set как самостоятельные объекты · hoisting и перегрузки функций ·
 * tuple и push.
 *
 *   node lessons/lesson-02/examples/00-errata.ts     запустить
 *   yarn typecheck                                   проверить типы
 *
 * Строки с `// ❌` закомментированы намеренно: это код, который НЕ должен
 * компилироваться. Раскомментируйте, посмотрите на подчёркивание, верните обратно.
 */

// ── Примитивы и typeof ─────────────────────────────────────────────────────
console.log(typeof 'text', typeof 42, typeof 10n, typeof true);
console.log(typeof undefined, typeof Symbol('id'), typeof {}, typeof function () {});
console.log('typeof null =', typeof null);

// ── strict в tsconfig и 'use strict' в JS ──────────────────────────────────
let maybeName: string | null = null;

// ❌ TS2322: тип 'null' нельзя присвоить типу 'string'
// const definitelyName: string = maybeName;

maybeName = 'Ann';
console.log('strictNullChecks заставляет писать union явно:', maybeName);

// ── Map и Set — не массивы ─────────────────────────────────────────────────
const tags = new Set<number>([1, 2, 2, 3]);
console.log(tags, 'isArray:', Array.isArray(tags), 'size:', tags.size);
console.log('set.keys() возвращает ЗНАЧЕНИЯ:', [...tags.keys()]);

const scores = new Map<string, number>([['Ann', 30]]);
console.log('а у Map ключи настоящие:', [...scores.keys()], [...scores.values()]);

// ── Hoisting, перегрузки, стрелочные функции ───────────────────────────────
// 1) Hoisting: объявление `function` поднимается, вызвать можно выше по файлу
console.log('hoisting работает:', declaredLater(2));

function declaredLater(n: number): number {
  return n * 2;
}

// 2) Перегрузки: несколько сигнатур, но реализация обязана идти ВПЛОТНУЮ
function asText(value: number): string;
function asText(value: Date): string;
function asText(value: number | Date): string {
  return value instanceof Date ? value.toISOString() : String(value);
}
console.log('перегрузка:', asText(5), asText(new Date(0)));

// А стрелочные функции не поднимаются — это обычная const
// ❌ TS2448 + TS2454 (а в чистом JS — ReferenceError: Cannot access before initialization)
// console.log(arrowFn());
const arrowFn = (): string => 'я обычная переменная';
console.log('стрелочная:', arrowFn());

// ── Tuple и push ───────────────────────────────────────────────────────────
// Длина tuple проверяется при присваивании и по индексу, но push достался
// от обычного массива и не проверяется.
const pair: [number, string] = [1, 'a'];
pair.push(2);
console.log('tuple после push:', pair, 'length:', pair.length);

// ❌ TS2493: Tuple type '[number, string]' of length '2' has no element at index '2'
// console.log(pair[2]);

// Файл заканчивается пустым `export {};` — без него он считался бы глобальным
// скриптом, и его объявления столкнулись бы с соседними примерами и с вашим
// playground/scratch.ts (ошибка TS2451 «Cannot redeclare»). Одна строка
// делает файл модулем, и все имена становятся локальными.
export {};
