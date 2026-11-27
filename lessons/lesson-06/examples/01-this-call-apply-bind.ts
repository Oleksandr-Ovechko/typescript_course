/**
 * Урок 6 · this: без точки, у стрелки, вручную.
 *
 * Что здесь: метод без точки теряет this · стрелка внутри метода берёт this
 * у метода · стрелка вместо метода — не работает · call и apply ·
 * this: в скобках — не параметр · bind — новая функция с прибитым this ·
 * второй bind не действует · два способа передать метод дальше.
 *
 *   node lessons/lesson-06/examples/01-this-call-apply-bind.ts   запустить
 *   yarn typecheck                                               проверить типы
 */

// ── Метод без точки ────────────────────────────────────────────────────────
// this — то, что слева от точки в момент ВЫЗОВА. Положим метод в переменную:
// функция та же самая (=== даёт true), но вызывать её будут уже без точки.
const user = {
  name: 'Ann',
  greet(): string {
    return `Привет, я ${this.name}`;
  },
};
const greetLater = user.greet;
console.log('1)', user.greet(), '|', typeof greetLater, greetLater === user.greet);
// 1) Привет, я Ann | function true

// greetLater() — слева от точки ничего, this взять неоткуда. В модуле (наши
// файлы) он undefined, и чтение .name падает:
//   TypeError: Cannot read properties of undefined (reading 'name')
// TypeScript эту строку НЕ подчёркивает: в типе user.greet не записано, какой
// this ей нужен, и он не следит, как метод вызовут потом. Поэтому строки
// здесь нет — упадёт весь файл. Как её поймать — в 04-errors.ts.

// ── У стрелки своего this нет ──────────────────────────────────────────────
// say() вызвана без точки, но своего this у стрелки нет: она берёт его
// снаружи, по цепочке окружений, — у describe. А там this — lamp, потому
// что вызвали lamp.describe().
const lamp = {
  color: 'зелёная',
  describe(): string {
    const say = () => `лампа ${this.color}`;
    return say();
  },
};
console.log('2)', lamp.describe()); // 2) лампа зелёная

// Обычная функция вместо стрелки: у неё свой this, и в вызове say() без
// точки он пустой. TypeScript это видит:
const brokenLamp = {
  color: 'синяя',
  describe(): string {
    // ❌ TS2683: 'this' implicitly has type 'any' because it does not have a type annotation.
    // const say = function () { return `лампа ${this.color}`; };
    return 'лампа без say';
  },
};
console.log('3)', brokenLamp.describe()); // 3) лампа без say

// Стрелка ВМЕСТО метода: this берётся снаружи объекта — там, где объект
// написан. На верхнем уровне модуля это undefined. Вызов с точкой
// (arrowLamp.describe()) не спасёт: стрелке точка не важна.
// ❌ TS2532: Object is possibly 'undefined'.
// const arrowLamp = { color: 'красная', describe: () => `лампа ${this.color}` };

//   метод — обычный:        describe() { … }            this = lamp (слева от точки)
//   внутри — стрелка:       const say = () => this.color   своего this нет → берёт у describe
//   стрелка ВМЕСТО метода:  describe: () => this.color     this снаружи объекта → undefined

// ── call и apply — задать this вручную ─────────────────────────────────────
// this: { name: string } первым в скобках — НЕ параметр. Это подсказка
// TypeScript, каким будет this. В JavaScript от неё ничего не остаётся:
// параметров у greetFrom два, greetFrom.length — 2.
// Объект для this передают первым аргументом самого call/apply, а не
// функции: call(объект, ...аргументы функции).
function greetFrom(this: { name: string }, greeting: string, ending: string): string {
  return `${greeting}, я ${this.name}${ending}`;
}
const ann = { name: 'Ann' };
const bob = { name: 'Bob' };
console.log('4)', greetFrom.call(ann, 'Привет', '!')); // 4) Привет, я Ann!
console.log('5)', greetFrom.apply(bob, ['Hello', '.'])); // 5) Hello, я Bob.
console.log('6)', greetFrom.length); // 6) 2

// call и apply ничего не привязывают: они один раз ВЫЗЫВАЮТ функцию
// с заданным this. Разница — только в форме аргументов:
// apply — array (массивом), call — comma (через запятую).

// Без call TypeScript не даст: this здесь был бы пустым.
// ❌ TS2684: The 'this' context of type 'void' is not assignable to method's 'this' of type '{ name: string; }'.
// greetFrom('Привет', '!');

// ── bind — не вызвать, а сделать новую функцию ─────────────────────────────
// call вернул СТРОКУ — результат вызова. bind ничего не вызывает и возвращает
// НОВУЮ функцию, у которой this прибит раз и навсегда.
const annGreets = greetFrom.bind(ann);
console.log('7)', annGreets('Хай', '!'), typeof greetFrom.call(ann, 'Хай', '!'), typeof annGreets);
// 7) Хай, я Ann! string function
console.log('8)', annGreets === greetFrom); // 8) false — новая функция, а не та же

// Второй bind поверх первого НЕ действует: this уже прибит к ann.
// rebound — ещё одна новая функция, но здоровается всё равно от Ann.
const rebound = annGreets.bind(bob);
console.log('9)', rebound('Хай', '?')); // 9) Хай, я Ann?

// ── Передать метод дальше и не потерять this ───────────────────────────────
// Так this теряют на практике: метод отдают другой функции, и та вызывает
// его у себя — без точки. Два лекарства:
//   boundGreet   — bind: this прибит;
//   wrappedGreet — стрелка-обёртка: внутри неё greet вызывают С ТОЧКОЙ, у user.
// Обе функции помнят user — это то же замыкание из урока 5.
function runLater(action: () => string): string {
  return action();
}
const boundGreet = user.greet.bind(user);
const wrappedGreet = () => user.greet();
console.log('10)', runLater(boundGreet), '|', runLater(wrappedGreet));
// 10) Привет, я Ann | Привет, я Ann

export {};
