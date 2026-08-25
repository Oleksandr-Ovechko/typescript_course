/**
 * Урок 4 · Блок 1. `typeof` и его враньё.
 *
 * Что здесь: что возвращает `typeof` · единственное обращение, которое
 * не бросает · правильные проверки (`Array.isArray`, `Number.isNaN`,
 * `=== null`, `Object.prototype.toString`) · зачем двойное приведение
 * `as unknown as` · значение, которого нет, а тип есть.
 *
 *   node lessons/lesson-04/examples/01-typeof-and-checks.ts   запустить
 *   yarn typecheck                                            проверить типы
 */

// ── Что вернёт typeof ──────────────────────────────────────────────────────
// Три сюрприза из четырёх.
console.log('1)', typeof null, typeof [], typeof NaN, typeof function () {});
// object object number function

// typeof null === 'object' — историческая ошибка 1995 года. Исправить нельзя:
//   слишком много кода на неё завязано.
// typeof [] === 'object' — формально верно, массив и правда объект. Но отличить
//   массив от обычного объекта так не выйдет.
// typeof NaN === 'number' — тоже формально верно. NaN это «не число» в смысле
//   «результат неудачной арифметики», но по типу — число.

// ── Единственный случай, когда обращение не бросает ────────────────────────
// Обращение к необъявленной переменной обычно даёт ReferenceError. typeof —
// единственная конструкция, которая этого не делает.

// @ts-expect-error — TS2304: Cannot find name 'neverDeclared'. В рантайме работает
console.log('2)', typeof neverDeclared); // undefined

// TypeScript такое не пропустит, но в чужом коде встречается — так проверяют
// глобальные переменные, про которые неизвестно, есть они или нет.

// ── Правильные проверки ────────────────────────────────────────────────────
console.log('3)', Array.isArray([]), Array.isArray('строка')); // true false
console.log('4)', Number.isNaN(NaN), Number.isNaN('foo')); // true false
console.log('5)', isNaN('foo' as unknown as number)); // true
console.log('6)', Object.prototype.toString.call(new Date())); // [object Date]

// Строки 4 и 5 дают РАЗНЫЙ ответ на одно и то же значение:
//   isNaN('foo')         сначала приводит аргумент к числу, получает NaN → true.
//                        Отвечает на вопрос «станет ли это NaN, если превратить
//                        в число» — почти никогда не то, что нужно.
//   Number.isNaN('foo')  не приводит ничего: «это именно значение NaN?» → false.

// Разница видна ещё до запуска — в сигнатурах:
//   declare function isNaN(number: number): boolean;   глобальная, lib.es5.d.ts
//   Number.isNaN(number: unknown): boolean;            lib.es2015.core.d.ts
// isNaN объявлен принимающим число — потому что он из аргумента число и делает.
// Дать ему строку значит соврать, и компилятор требует оформить враньё явно.

// ❌ TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.
// console.log(isNaN('foo'));

// ── Зачем приведение двойное ───────────────────────────────────────────────
// `as` — это не преобразование значения, а обещание компилятору: «поверь, тип
// на самом деле такой». Обещание не должно быть заведомо ложным, поэтому `as`
// разрешён только между типами, которые хоть как-то пересекаются.
// `string` и `number` не пересекаются никак:

// ❌ TS2352: Conversion of type 'string' to type 'number' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
// console.log(isNaN('foo' as number));

// `unknown` совместим со всем в обе стороны, поэтому цепочка
// string → unknown → number проходит: каждый шаг законен по отдельности.
// Обход диктует сам текст ошибки.
//
// И главное: оба приведения существуют ТОЛЬКО при компиляции. В рантайме
// остаётся isNaN('foo') — значение как было строкой, так и осталось.

// Шпаргалка проверок:
//   массив              Array.isArray(x)
//   NaN                 Number.isNaN(x), а не isNaN(x)
//   null                x === null
//   null или undefined  x == null   ← единственное узаконенное ==
//   точный тип объекта  Object.prototype.toString.call(x)

// ── Object.prototype.toString: почему через прототип ───────────────────────
// Упростить до String(x) нельзя — у большинства объектов свой toString.
// Через прототип берётся НЕ переопределённый вариант, единственный,
// который показывает внутренний тип.
const when = new Date(0);
console.log('через прототип:', Object.prototype.toString.call(when)); // [object Date]
console.log('просто строкой:', String(when).slice(0, 15) + '…'); // Thu Jan 01 1970…
console.log('разные функции:', when.toString === Object.prototype.toString); // false

// ── Значение, которого нет, а тип есть ─────────────────────────────────────
const spots = [3, 0, 12];
const far = spots[99];

console.log('7)', far, '· typeof:', typeof far); // undefined · typeof: undefined
console.log('8)', far + 1); // NaN

// Главное здесь — компилятор не сказал ни слова. Наведите курсор на `far`:
// тип `number`. Не `number | undefined`, а просто `number`. TypeScript считает,
// что раз массив числовой, то по любому индексу лежит число. Проверять индекс
// он не умеет.
//
// Настройка noUncheckedIndexedAccess это чинит — в wl-e2e она НЕ включена,
// как и в большинстве проектов.

const found = spots.find((spot) => spot === 777);
console.log('9)', found); // undefined

// А вот тут компилятор не промолчит: тип found — number | undefined.
// find честно сообщает, что может не найти; индексация — нет.

// ❌ TS18048: 'found' is possibly 'undefined'.
// console.log(found + 1);

// Два одинаковых undefined, и только про один из них предупреждают.

export {};
