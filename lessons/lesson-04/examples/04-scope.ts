/**
 * Урок 4 · Где видно имя.
 *
 * Что здесь: блок `{}` и область видимости · затенение · устаревший `var`
 * и его область — функция · поднятие и мёртвая зона · два вида
 * `ReferenceError` · глобальный объект и почему наши функции в нём не лежат.
 *
 *   node lessons/lesson-04/examples/04-scope.ts   запустить
 *   yarn typecheck                                проверить типы
 */

// ── Блок {} ────────────────────────────────────────────────────────────────
// Область видимости (scope) — участок кода, где имя существует. Для let
// и const это ближайшие фигурные скобки: тело функции, if, for — или просто
// скобки без ничего, это называется блок.
// Изнутри видно внешнее, снаружи внутреннее — нет.
const city = 'Kyiv';
{
  const greetingText = `Привет из ${city}`;
  console.log('1)', greetingText); // 1) Привет из Kyiv
}
// ❌ TS2304: Cannot find name 'greetingText'.
// console.log(greetingText);

// ── Затенение ──────────────────────────────────────────────────────────────
// Во втором блоке ОБЪЯВЛЕНО своё city — это не переприсваивание внешнего,
// а другое имя в другой области. Оно затеняет внешнее: внутри Lviv,
// а внешнее никто не трогал.
{
  const city = 'Lviv';
  console.log('2) внутри:', city); // 2) внутри: Lviv
}
console.log('3) снаружи:', city); // 3) снаружи: Kyiv

// Параметр — тоже имя внутри своей функции. Поэтому x в одной функции
// и x в другой друг другу не мешают.
const double = (x: number): number => x * 2;
const square = (x: number): number => x * x;
console.log('4)', double(3), square(3)); // 4) 6 9

// ── var — устаревшее ───────────────────────────────────────────────────────
// Область var — ФУНКЦИЯ. Блоки {}, if и for для неё не граница:
// переменная «протекает» наружу.
{
  var leakedVar = 'вижусь снаружи';
  let blockLet = 'не вижусь';
  console.log('5)', blockLet); // 5) не вижусь
}
console.log('6)', leakedVar); // 6) вижусь снаружи
// Счётчик цикла тоже протёк и хранит значение, на котором цикл остановился:
// 1, 2, 3 прошли, на 4 условие loopVar <= 3 стало ложным.
for (var loopVar = 1; loopVar <= 3; loopVar++) {}
console.log('7)', loopVar); // 7) 4

// А граница функции для var — граница. Внутри функции var снаружи не видна,
// как и let. «Весь файл» — только если var стоит вне всех функций.
function scopeOfVar(): number {
  {
    var inside = 5;
  }
  return inside; // протекла из блока, но осталась внутри функции
}
console.log('8)', scopeOfVar()); // 8) 5
// ❌ TS2304: Cannot find name 'inside'.
// console.log(inside);

// var — запись до 2015 года. Правило: по умолчанию const, let — когда правда
// нужно переприсвоить, var — никогда. Узнавать в старом коде.

// ── Поднятие ───────────────────────────────────────────────────────────────
// Поднятие (hoisting): прежде чем выполнять файл, функцию или блок, движок
// заранее заводит все объявленные в НЁМ имена — в начале этой области,
// а не всей программы. function заводится сразу вместе с телом, поэтому
// её можно вызвать выше по файлу.
console.log('9)', doubleIt(21)); // 9) 42
function doubleIt(n: number): number {
  return n * 2;
}

// var, let и const тоже заводятся заранее, но БЕЗ значения. Стрелку
// через const выше её строки вызвать нельзя:
// ❌ TS2448: Block-scoped variable 'tripleIt' used before its declaration.
// console.log(tripleIt(3));
const tripleIt = (n: number): number => n * 3;
console.log('10)', tripleIt(3)); // 10) 9

// ── Мёртвая зона и два вида ReferenceError ─────────────────────────────────
// Что лежит в имени до его строки, TypeScript посмотреть не даст — видно
// в чистом JavaScript, в терминале:
//
//   node -e "console.log(early); var early = 1"   → undefined
//   node -e "console.log(late); const late = 1"   → ReferenceError: Cannot access 'late' before initialization
//   node -e "console.log(never)"                  → ReferenceError: never is not defined
//
// Временная мёртвая зона (temporal dead zone) — участок от начала блока
// до строки с let или const. Имя уже заведено, но обращаться к нему нельзя.
// Мёртвая зона только у let и const: function уже готова, var молча отдаёт
// undefined — и ошибка вылезет позже, в другом месте.
//
//                  до своей строки                 после
//   function f     уже с телом — можно вызывать    то же
//   var x          undefined — молча               значение
//   let / const    мёртвая зона — ReferenceError   значение
//   нет вовсе      ReferenceError: x is not defined
//
// Тип ошибки один — ReferenceError, а смысл у двух сообщений разный, и в
// упавшем тесте это подсказка, что чинить:
//   Cannot access 'X' before initialization  — имя ЕСТЬ, его строка ещё
//                                              не выполнилась: поменять порядок;
//   X is not defined                         — имени НЕТ: опечатка, не объявили,
//                                              не импортировали.
// Первое сообщение заодно доказывает, что let и const тоже поднимаются:
// иначе было бы «not defined».

// ── Глобальный объект ──────────────────────────────────────────────────────
// Имя ищется изнутри наружу: свой блок → внешний блок → функция → файл →
// глобальный объект. Глобальный объект — самый внешний уровень: там лежат
// console, Math, setTimeout. Общее имя для него — globalThis (это имя
// свойства, а не ключевое слово). В браузере он называется window,
// в Node — global.
console.log('11)', typeof globalThis, globalThis.Math === Math, typeof window); // 11) object true undefined

// typeof window в Node — 'undefined': окна здесь нет. А просто window
// упадёт: ReferenceError: window is not defined. TypeScript при этом молчит —
// в настройках курса подключены типы браузера. Типы — не гарантия того,
// что есть на самом деле.

// Наши файлы — модули ("type": "module" в package.json). Функции и переменные,
// объявленные в модуле, в глобальный объект НЕ попадают.
// Оператор in отвечает, есть ли у объекта такое свойство.
console.log('12)', 'doubleIt' in globalThis, 'leakedVar' in globalThis, 'Math' in globalThis); // 12) false false true

// Только в старых скриптах (не модулях) var и function верхнего уровня
// становятся свойствами глобального объекта. Проверить в терминале:
//   node -e "var fromVar = 1; function fromFunction() {} console.log(globalThis.fromVar, typeof globalThis.fromFunction)"
//     → 1 function
//   node --input-type=module -e "var fromVar = 1; function fromFunction() {} console.log(globalThis.fromVar, typeof globalThis.fromFunction)"
//     → undefined undefined

export {};
