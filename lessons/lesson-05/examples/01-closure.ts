/**
 * Урок 5 · Вложенные функции и замыкание.
 *
 * Что здесь: функция внутри функции · лексическое окружение и поиск имени
 * наружу · функция помнит место, где её написали · замыкание: счётчики
 * и фабрика приветствий · замыкание ничего не копирует · держит переменную,
 * а не значение · var и let в цикле с функциями.
 *
 *   node lessons/lesson-05/examples/01-closure.ts   запустить
 *   yarn typecheck                                  проверить типы
 */

// ── Функция внутри функции ─────────────────────────────────────────────────
// Тело функции — тоже блок, а изнутри блока видно внешнее. Поэтому greetOne
// берёт greeting у внешней функции, а свой у неё только name.
// Снаружи greetOne не видно, как любое имя из блока.
function greetGroup(greeting: string): string {
  function greetOne(name: string): string {
    return `${greeting}, ${name}`;
  }
  return `${greetOne('Ann')}; ${greetOne('Bob')}`;
}
console.log('1)', greetGroup('Привет')); // 1) Привет, Ann; Привет, Bob

// ❌ TS2304: Cannot find name 'greetOne'.
// greetOne('Kim');

// ── Лексическое окружение и поиск имени ────────────────────────────────────
// При каждом вызове функции движок заводит лексическое окружение: в нём её
// параметры и переменные и ссылка на ВНЕШНЕЕ окружение — то, где функция
// написана. Имя ищется в своём окружении, потом во внешнем, и так до
// глобального объекта. Не нашли нигде — ReferenceError.
//
//   окружение innerLevel  town: 'Киев'        — нашли здесь
//          │ внешнее
//   окружение outerLevel  country: 'Украина'  — поднялись на уровень
//          │ внешнее
//   модуль                planet: 'Земля'     — поднялись ещё раз
//          │ внешнее
//   globalThis            Math, console
const planet = 'Земля';
function outerLevel(): void {
  const country = 'Украина';
  function innerLevel(): void {
    const town = 'Киев';
    console.log('2)', town, country, planet, Math.round(2.4)); // 2) Киев Украина Земля 2
  }
  innerLevel();
}
outerLevel();

// ── Функция помнит место, где её написали ──────────────────────────────────
// Стрелку НАПИСАЛИ внутри makePrinter. Ссылку на внешнее окружение она
// получила в момент СОЗДАНИЯ — это окружение вызова makePrinter, где label —
// 'внутри'. Откуда её потом вызвали, роли не играет. Сама label лежит
// не в окружении стрелки, а во внешнем: стрелка находит её по ссылке.
const label = 'снаружи';
function makePrinter(): () => string {
  const label = 'внутри';
  return () => label;
}
const printLabel = makePrinter();
console.log('3)', printLabel(), label); // 3) внутри снаружи

// ── Замыкание ──────────────────────────────────────────────────────────────
// makeCounter закончилась, а её окружение живо: на него ссылается стрелка.
// Функция вместе с окружением места, где её создали, — это и есть замыкание.
// Два вызова makeCounter — два окружения, в каждом своя count.
function makeCounter(): () => number {
  let count = 0;
  return () => {
    count = count + 1;
    return count;
  };
}
const firstCounter = makeCounter();
const secondCounter = makeCounter();
console.log('4)', firstCounter(), firstCounter(), firstCounter(), secondCounter()); // 4) 1 2 3 1

// Параметр лежит в том же окружении — его тоже видно изнутри.
function makeGreeter(greeting: string): (name: string) => string {
  return (name) => `${greeting}, ${name}!`;
}
const hello = makeGreeter('Hello');
const hola = makeGreeter('Hola');
console.log('5)', hello('Ann'), hola('Bob')); // 5) Hello, Ann! Hola, Bob!

// ── Замыкание ничего не копирует ───────────────────────────────────────────
// Частая неверная картинка: «функция сложила переменные к себе». На деле
// у неё только ССЫЛКА на окружение. Проверка: две функции из ОДНОГО вызова.
// Если бы каждая скопировала count к себе, read() вернула бы 0. Она
// возвращает 2: обе смотрят в одно окружение и видят одну переменную.
function makeTally(): { add: () => void; read: () => number } {
  let total = 0;
  return {
    add: () => {
      total = total + 1;
    },
    read: () => total,
  };
}
const tally = makeTally();
tally.add();
tally.add();
console.log('6)', tally.read()); // 6) 2

// ── Держит переменную, а не значение ───────────────────────────────────────
// readMood читает mood в момент ВЫЗОВА. Поменяли переменную — следующий
// вызов вернул новое значение.
let mood = 'до';
const readMood = (): string => mood;
console.log('7)', readMood()); // 7) до
mood = 'после';
console.log('8)', readMood()); // 8) после

// ── var и let в цикле с функциями ──────────────────────────────────────────
// push кладёт в массив НОВУЮ функцию, но не вызывает её. Вызываем после цикла.
//   var — одна переменная на весь цикл. Цикл остановился, когда в ней
//         стало 3 (3 < 3 — ложь), и все три функции читают это 3.
//   let — новая переменная на каждый проход: у каждой функции своя.
// На каком числе цикл встаёт, решает условие: у for (var i = 1; i <= 3; i++)
// после цикла в i будет 4, и функции вернут 4 4 4.
const varReaders: (() => number)[] = [];
for (var varIndex = 0; varIndex < 3; varIndex++) {
  varReaders.push(() => varIndex);
}
console.log('9)', varReaders[0](), varReaders[1](), varReaders[2]()); // 9) 3 3 3

const letReaders: (() => number)[] = [];
for (let letIndex = 0; letIndex < 3; letIndex++) {
  letReaders.push(() => letIndex);
}
console.log('10)', letReaders[0](), letReaders[1](), letReaders[2]()); // 10) 0 1 2

export {};
