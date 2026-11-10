/**
 * Урок 2 · Язык приводит типы сам.
 *
 * Что здесь: явное приведение `Number`/`String`/`Boolean` · `+` склеивает,
 * `-` вычитает · `${}` превращает в строку что угодно · восемь ложных
 * значений и `||` · `===` против `==` и в какую сторону `==` приводит.
 *
 *   node lessons/lesson-02/examples/03-coercion.ts   запустить
 *   yarn typecheck                                   проверить типы
 *
 * Строки, которые TypeScript не пропускает ('5' - 1, '5' == 5), здесь
 * закомментированы с кодом ошибки. Посмотреть, что с ними делает сам
 * JavaScript, можно через node -e: node типы не проверяет.
 *
 *   node -e "console.log('5' + 1, '5' - 1, '5' * 2)"        → 51 4 10
 *   node -e "console.log('5' == 5, 0 == '', '' == '0')"     → true true false
 */

// ── Явное приведение ───────────────────────────────────────────────────────
// Всё, что тест достаёт со страницы, — строка, даже если на экране цифры.
const parsedBadge = Number('12');
const badgeText = String(12);
console.log('1)', parsedBadge, typeof parsedBadge, badgeText, typeof badgeText); // 1) 12 number 12 string

// ── + склеивает, - вычитает ────────────────────────────────────────────────
// Если хотя бы одна сторона + — строка, он склеивает. Неважно, с какой
// стороны стоит строка: слева или справа.
const fromBadge = '12';
console.log('2)', fromBadge + 1, 1 + fromBadge, Number(fromBadge) + 1); // 2) 121 112 13

// Считается слева направо, по паре за раз.
console.log('3)', 1 + 2 + '3', '1' + 2 + 3); // 3) 33 123

// У - нет «строкового» смысла: JavaScript молча превратил бы '12' в число.
// TypeScript такую строку не пропускает:
// ❌ TS2362: The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
// console.log(fromBadge - 1);

// Главное: от - со строкой TypeScript защитит, а от + — нет. Склеить строку
// с числом — законная операция. Поэтому значение со страницы — сначала
// Number(…), потом арифметика.

// ── ${} превращает в строку что угодно ─────────────────────────────────────
const prices = [10, 20, 30];
const client = { name: 'Ann' };
console.log('4)', `${prices}`, `${client}`, `${null}`); // 4) 10,20,30 [object Object] null
// [object Object] в тексте ошибки теста — значит, в ${} подставили объект целиком.

// ── Ложные значения и || ───────────────────────────────────────────────────
// Ложных значений восемь: false, 0, -0, 0n, '', null, undefined, NaN.
// Все остальные — истинные. И среди чисел тоже: 0 и NaN ложные, любое другое — нет.
console.log('5)', Boolean(0), Boolean(NaN), Boolean(5), Boolean(-1)); // 5) false false true true
console.log('6)', Boolean('0'), Boolean(' '), Boolean('false'), Boolean([]), Boolean({})); // 6) true true true true true
// '0', ' ', 'false' — непустые строки. [] и {} — объекты, а любой объект истинный.

// a || b — логическое ИЛИ: если a ложное, берётся b, иначе — a.
const emptyCell = '';
const zeroBalance = 0;
console.log('7)', emptyCell || 'нет данных', zeroBalance || 'нет данных', emptyCell || zeroBalance);
// 7) нет данных нет данных 0
// Пустую ячейку заменили — этого и хотели. Но и ноль заменили: баланс 0 —
// настоящие данные. А если обе стороны ложные, || берёт правую.

// ── === против == ──────────────────────────────────────────────────────────
// === — «то же значение того же типа?», ничего не приводит.
// == — если типы разные, сначала приводит, потом сравнивает.
console.log('8)', fromBadge === '12', Number(fromBadge) === 12); // 8) true true
console.log('9)', null == undefined, null === undefined, null == 0); // 9) true false false
// null и undefined по == равны друг другу и больше ничему.

// Строку и число TypeScript не даст сравнить ни так, ни так:
// ❌ TS2367: This comparison appears to be unintentional because the types 'string' and 'number' have no overlap.
// console.log(fromBadge == 12);

// В какую сторону приводит ==: при «строка == число» к числу приводится
// СТРОКА — с какой бы стороны она ни стояла. Проверка: '1e1' — это запись
// числа 10. Если бы == приводил число к строке, вышло бы '10' == '1e1' — ложь.
// node -e "console.log('1e1' == 10, 10 == '1e1', '10' == '1e1')"   → true true false

// Правило: всегда ===. Запись x == null встречается в чужом коде как
// короткое «null или undefined» — её достаточно узнавать.

export {};
