/**
 * Урок 13 · Что делает new.
 *
 * Что здесь: три шага, которые повторяются для каждого объекта · new делает
 * их сам · функция-конструктор и её свойство prototype · свой new в четыре
 * строки · кто чей прототип: функция, её prototype и экземпляр · что будет
 * без new и если конструктор что-то вернёт.
 *
 *   node lessons/lesson-13/examples/02-what-new-does.ts   запустить
 *   yarn typecheck                                        проверить типы
 */

type Report = { runId: number; results: string[]; record(caseId: string): void; summary(): string };
const reportMethods = {
  record(this: Report, caseId: string) {
    this.results.push(caseId);
  },
  summary(this: Report) {
    return `run ${this.runId}: ${this.results.length}`;
  },
};

// ── Три шага, которые повторяются ─────────────────────────────────────────
// На каждый отчёт уходит три действия: создать объект с нужным прототипом,
// заполнить данными, отдать. Три одинаковые строки — значит, это функция.
const createReport = (runId: number): Report => {
  const fresh = Object.create(reportMethods) as Report; // 1. объект с прототипом
  fresh.runId = runId; //                                  2. заполнить
  fresh.results = [];
  return fresh; //                                         3. вернуть
};
const reportG = createReport(930);
console.log('1)', reportG.summary(), Object.getPrototypeOf(reportG) === reportMethods);

// Шаг 2 у каждого вида объектов свой. А шаги 1 и 3 одинаковые всегда —
// и язык умеет делать их сам.

// ── new — те же три шага ──────────────────────────────────────────────────
// Date — функция. У функции есть свойство prototype — обычный объект, в нём
// лежат методы дат. new Date(0):
//   1. создаёт пустой объект, и прототипом ему ставит Date.prototype;
//   2. вызывает функцию Date, подставив этот объект как this, — она
//      заполняет его данными;
//   3. возвращает объект.
const startedAt = new Date(0);
console.log('2)', typeof Date, Object.getPrototypeOf(startedAt) === Date.prototype, Object.hasOwn(Date.prototype, 'getTime'));

// ФУНКЦИЯ-КОНСТРУКТОР — функция, которую вызывают через new.
// ЭКЗЕМПЛЯР — объект, созданный через new. startedAt — экземпляр Date.

// Что принимает new Date: ничего (сейчас), число миллисекунд, строку с датой
// или части по порядку — год, месяц с нуля, день, часы… Формата среди
// аргументов нет: вид задают методы готового экземпляра.
console.log('3)', new Date(2026, 9, 8).getFullYear(), new Date('2026-10-08').toISOString());
// ❌ TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.
// console.log(new Date('2026-10-08', 'dd.mm'));
//    (при запуске такая дата — Invalid Date)

// ── Свой new в четыре строки ──────────────────────────────────────────────
// Функция-конструктор делает только шаг 2 — заполняет this. Методы кладём
// в её свойство prototype.
function LegacyReport(this: Report, runId: number) {
  this.runId = runId;
  this.results = [];
}
LegacyReport.prototype = reportMethods;

const myNew = (Ctor: Function, runId: number) => {
  const fresh = Object.create(Ctor.prototype); // 1. объект с прототипом Ctor.prototype
  Ctor.call(fresh, runId); //                     2. вызвать конструктор с this = fresh
  return fresh; //                                3. вернуть
};
const reportH = myNew(LegacyReport, 931) as Report;
reportH.record('C22041');
console.log('4)', reportH.summary(), Object.getPrototypeOf(reportH) === LegacyReport.prototype);

// Настоящий new делает то же самое. Так писали «классы» до 2015 года. Но
// TypeScript обычную функцию конструктором не считает — для него конструктор
// это class. Поэтому в проекте new всегда стоит перед встроенным или классом.
// ❌ TS7009: 'new' expression, whose target lacks a construct signature, implicitly has an 'any' type.
// const reportDirect = new LegacyReport(932);

// ── Кто чей прототип ──────────────────────────────────────────────────────
// Самое путаное место темы. Участников трое, и у слова «prototype» два смысла:
//
//   LegacyReport ── .prototype ──►  reportMethods  ◄── прототип ── reportH
//    (функция)       (свойство)      (объект)                      (экземпляр)
//
//   • у ФУНКЦИИ есть СВОЙСТВО prototype: «что поставить прототипом тем, кого
//     создадут через new»;
//   • у ЭКЗЕМПЛЯРА есть ПРОТОТИП — тот самый объект. Узнать его:
//     Object.getPrototypeOf(экземпляр);
//   • сама функция в цепочку экземпляра НЕ входит.
const chain: unknown[] = [];
for (let link = Object.getPrototypeOf(reportH); link !== null; link = Object.getPrototypeOf(link)) {
  chain.push(link === reportMethods ? 'reportMethods' : link === Object.prototype ? 'Object.prototype' : '?');
}
console.log('5)', 'reportH →', chain.join(' → '), '→ null');

// У самой функции прототип свой — Function.prototype: оттуда у неё call и bind.
console.log('6)', Object.getPrototypeOf(LegacyReport) === Function.prototype, Object.getPrototypeOf(LegacyReport) === reportMethods);

// ── Если конструктор что-то вернёт ────────────────────────────────────────
// Вернул объект — new отдаст его вместо созданного. Вернул примитив — new
// его проигнорирует. В живом коде так не пишут.
function ReturnsObject(this: { runId: number }) {
  this.runId = 1;
  return { runId: 99 };
}
function ReturnsNumber(this: { runId: number }) {
  this.runId = 1;
  return 99;
}
type Ctor = new () => { runId: number };
console.log('7)', new (ReturnsObject as unknown as Ctor)().runId, new (ReturnsNumber as unknown as Ctor)().runId);

// ── Без new ───────────────────────────────────────────────────────────────
// Встроенные конструкторы старше классов и ведут себя по-разному: Date()
// без new молча возвращает СТРОКУ с текущим временем. В проекте — new Date(.
console.log('8)', typeof Date(), typeof new Date());

// Array без new работает как с new — но одно число он понимает как длину:
console.log('9)', Array('C157112', 'C22041'), Array(3));

// Поэтому массивы пишут литералом: ['C157112', 'C22041'].

export {};
