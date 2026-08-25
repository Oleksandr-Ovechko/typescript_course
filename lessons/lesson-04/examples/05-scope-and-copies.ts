/**
 * Урок 4 · Блок 5. Область видимости и ссылки.
 *
 * Что здесь: `var` не знает про блоки · всплытие и мёртвая зона · два разных
 * текста ошибки · классическая ловушка с циклом и `setTimeout` · `const`
 * запрещает переприсваивание, а не изменение · спред копирует поверхностно.
 *
 *   node lessons/lesson-04/examples/05-scope-and-copies.ts   запустить
 *   yarn typecheck                                           проверить типы
 *
 * ВНИМАНИЕ: две строки про цикл появятся в самом конце вывода — setTimeout
 * откладывает вызов до конца всего синхронного кода. Это не сбой.
 */

// ── var не знает про блоки ─────────────────────────────────────────────────
{
  var varInBlock = 'вижусь снаружи';
  let letInBlock = 'не вижусь';
  console.log('1)', letInBlock); // не вижусь
}
console.log('2)', varInBlock); // вижусь снаружи ← объявлена внутри скобок

// let и const живут внутри блока {}. var — внутри всей функции, блоки для него
// не существуют. Обратите внимание: строка 2 работает.

// ❌ TS2304: Cannot find name 'letInBlock'.
// console.log(letInBlock);

// Одно и то же имя в другом блоке не конфликтует с внешним — это разные
// переменные:
function ownBlock(): void {
  const letInBlock = 'своя, внутри функции';
  console.log('своя  :', letInBlock);
}
ownBlock();

// ── Всплытие и мёртвая зона ────────────────────────────────────────────────
// @ts-expect-error — TS2454: Variable 'hoistedVar' is used before being assigned.
console.log('3)', typeof hoistedVar); // undefined
var hoistedVar = 1;

try {
  // @ts-expect-error — TS2448: Block-scoped variable 'tdzLet' used before its declaration.
  console.log(tdzLet);
} catch (error) {
  console.log('4)', error instanceof Error ? error.constructor.name : 'не Error'); // ReferenceError
}
let tdzLet = 2;
console.log('   после объявления tdzLet:', tdzLet);

// Обе переменные «всплывают» — движок знает о них заранее. Разница в том,
// что var сразу получает значение undefined, а let до своей строки лежит
// во ВРЕМЕННОЙ МЁРТВОЙ ЗОНЕ (TDZ) и любое обращение даёт ReferenceError.
//
// Это не недостаток let, а защита: var молча даёт undefined, и ошибка
// всплывает позже и в другом месте.

// ── Мёртвая зона против «переменной вообще нет» ────────────────────────────
// Оба случая дают ReferenceError, различить их можно только по тексту.
try {
  // @ts-expect-error — TS2448: Block-scoped variable 'tdzConst' used before its declaration.
  console.log(tdzConst);
} catch (error) {
  console.log('4a)', (error as Error).message); // Cannot access 'tdzConst' before initialization
}
const tdzConst = 1;
console.log('   после объявления tdzConst:', tdzConst);

try {
  // @ts-expect-error — TS2304: Cannot find name 'neverExisted'.
  console.log(neverExisted);
} catch (error) {
  console.log('4b)', (error as Error).message); // neverExisted is not defined
}

// «Cannot access … before initialization» — переменная ЕСТЬ, всплыла,
//   но ещё не инициализирована.
// «is not defined» — её нет вовсе.

// ── const запрещает переприсваивание, а не изменение ───────────────────────
const list = [1];
list.push(2);
console.log('5)', list); // [ 1, 2 ]

// ❌ TS2588: Cannot assign to 'list' because it is a constant.
// list = [];

// const фиксирует ССЫЛКУ, а не содержимое. Менять содержимое массива
// и объекта можно, заменить сам массив — нельзя.

// ── Спред копирует только верхний уровень ──────────────────────────────────
const runConfig = { project: 'widgets', browser: { headless: true } };
const copied = { ...runConfig };

runConfig.project = 'monolith';
runConfig.browser.headless = false;

console.log('6)', copied.project); // widgets ← скопировалось
console.log('7)', copied.browser.headless); // false   ← НЕ скопировалось
console.log('8)', copied === runConfig, copied.browser === runConfig.browser); // false true

// Спред делает НОВЫЙ объект, но кладёт в него те же самые значения; а значение
// поля browser — это ссылка. Новый объект и старый смотрят на один и тот же
// вложенный объект. Три уровня, которые надо держать в голове:
//
//   const a = obj;                       не копия вообще — второе имя того же объекта
//   const b = { ...obj };                поверхностная копия: новый верх, общая внутренность
//   const c = structuredClone(obj);      глубокая копия — всё целиком

const deepCopy = structuredClone(runConfig);
runConfig.browser.headless = true;
console.log('9)', deepCopy.browser.headless); // false ← своя внутренность

// structuredClone — глобальная функция; никакого Object.deepCopy в языке нет.
// В wl-e2e глубокого копирования не делают вообще: ни structuredClone,
// ни приёма JSON.parse(JSON.stringify(x)). Значит, каждый спред в проекте
// обязан быть безопасен именно как поверхностный.

// ── Классическая ловушка с циклом ──────────────────────────────────────────
// Эти шесть строк появятся в самом конце вывода.
for (var i = 0; i < 3; i++) setTimeout(() => console.log('10) var:', i));
for (let j = 0; j < 3; j++) setTimeout(() => console.log('11) let:', j));

// var: 3, 3, 3   ·   let: 0, 1, 2
//
// setTimeout откладывает вызов колбэка до конца всего синхронного кода —
// цикл к этому моменту уже закончился. var i — ОДНА переменная на весь цикл,
// и к моменту вызова в ней лежит 3. let j создаёт НОВУЮ переменную на каждой
// итерации, поэтому каждый колбэк помнит своё значение.
//
// Правило: по умолчанию const, let — когда правда нужно переприсвоить,
// var — никогда. В wl-e2e var не встречается.

export {};
