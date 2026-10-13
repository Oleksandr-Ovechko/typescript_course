/**
 * Урок 13 · class — та же конструкция, записанная иначе.
 *
 * Что здесь: класс из трёх знакомых кусков · поля — в экземпляре, методы —
 * в прототипе · порядок строк в теле класса ничего не значит · в лог попадают
 * только данные · оторванный метод теряет this — и как это чинить.
 *
 *   node lessons/lesson-13/examples/03-class.ts   запустить
 *   yarn typecheck                                проверить типы
 */

// ── Одна запись вместо трёх кусков ────────────────────────────────────────
// В 02-what-new-does.ts кусков было три: объект с методами, функция, которая
// заполняет this, и строка, которая их связывает. class записывает все три
// в одних фигурных скобках.
//
//   function LegacyReport(this, runId) { this.runId = runId }  →  constructor(runId) { this.runId = runId; }
//   this.results = []  в функции                               →  results: string[] = [];
//   reportMethods = { record() {…}, summary() {…} }            →  методы в теле класса
//   LegacyReport.prototype = reportMethods                     →  делается само
//   myNew(LegacyReport, 931)                                   →  new RunReport(924)
class RunReport {
  runId: number; //            только для TypeScript: «у экземпляра будет такое свойство»
  results: string[] = []; //   ПОЛЕ КЛАССА: заводится заново для каждого экземпляра
  constructor(runId: number) {
    this.runId = runId;
  }
  record(caseId: string) {
    this.results.push(caseId);
  }
  summary() {
    return `run ${this.runId}: ${this.results.length}`;
  }
}
const reportI = new RunReport(924);
const reportJ = new RunReport(926);
reportI.record('C157112');
console.log('1)', reportI.summary(), '|', reportJ.summary(), '|', reportI.summary === reportJ.summary);

// summary у двух отчётов один, а списки результатов разные: 1 и 0. Ловушки
// с общим массивом здесь нет — поле results = [] выполняется для каждого
// экземпляра отдельно.

// ── Где что лежит ─────────────────────────────────────────────────────────
// Класс — это функция-конструктор. У экземпляра прототипом стоит
// RunReport.prototype. Поля — собственные свойства, методы — в прототипе.
console.log('2)', typeof RunReport, Object.getPrototypeOf(reportI) === RunReport.prototype);
console.log('3)', Object.hasOwn(reportI, 'results'), Object.hasOwn(reportI, 'summary'), Object.hasOwn(RunReport.prototype, 'summary'));

//   pool     →  Array.prototype      →  Object.prototype  →  null
//   reportI  →  RunReport.prototype  →  Object.prototype  →  null
//   runId,      record, summary
//   results
//
// Одна и та же картина: [] — экземпляр Array, reportI — экземпляр RunReport.

// Класс без new вызвать нельзя:
// ❌ TS2348: Value of type 'typeof RunReport' is not callable. Did you mean to include 'new'?
// RunReport(924);

// ── Порядок строк в теле класса ничего не значит ──────────────────────────
// Поле остаётся полем, а метод — методом, где бы они ни стояли. Разницу
// делает форма записи: «имя = значение» — поле, «имя() { … }» — метод.
class Shuffled {
  summary() {
    return this.results.length;
  }
  constructor() {
    this.results.push('из конструктора');
  }
  results: string[] = [];
}
const shuffledA = new Shuffled();
const shuffledB = new Shuffled();
console.log('4)', Object.hasOwn(shuffledA, 'results'), Object.hasOwn(shuffledA, 'summary'), shuffledA.results === shuffledB.results, shuffledA.summary());

// Последнее значение — 1: поле results заполнилось ДО тела constructor, хотя
// в тексте стоит после него. «Поле раньше конструктора» — это про время
// выполнения, а не про место в файле. Принято писать поля сверху — для читаемости.

// ── В лог попадают только данные ──────────────────────────────────────────
// Object.keys и JSON.stringify видят только собственные свойства — то есть
// поля. Методов в выводе нет. Экземпляр класса в логе выглядит как обычный
// объект с данными.
console.log('5)', Object.keys(reportI), JSON.stringify(reportI));

// ── Оторванный метод теряет this ──────────────────────────────────────────
// Правило урока 6: this вычисляется ПРИ ВЫЗОВЕ, это объект перед точкой.
// Нет точки — нет объекта, this равен undefined.
const detached = reportI.summary;
try {
  detached();
} catch (error) {
  console.log('6)', (error as Error).message);
}

// Сам вызов законен — функция как функция. Падает она только на той строке,
// где трогает this. Метод, которому this не нужен, отработал бы.

// Чаще так бывает, когда метод передают как колбэк. forEach получает саму
// функцию, без reportI, и вызывает её без точки:
const caseIds = ['C22041', 'C19877'];
try {
  caseIds.forEach(reportI.record);
} catch (error) {
  console.log('7)', (error as Error).message);
}

// Лечится стрелкой — в ней точка на месте:
caseIds.forEach((caseId) => reportI.record(caseId));
console.log('8)', reportI.summary());

// page и локаторы — экземпляры классов Playwright, и с ними так же:
//
//   const { getByRole } = page;
//   getByRole('button', { name: 'Book Yoga' });
//   → Cannot read properties of undefined (reading 'mainFrame')
//
// «Cannot read properties of undefined» из глубины Playwright, когда page
// на месте, — почти всегда оторванный метод. TypeScript этого не ловит.

export {};
