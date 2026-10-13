/**
 * Урок 13 · Прототип своими руками.
 *
 * Что здесь: у каждого объекта своя копия метода · методы в общий объект
 * через Object.create · this — объект перед точкой, а не прототип ·
 * прочитать из прототипа, присвоить и изменить — три разные вещи ·
 * почему данные в прототип не кладут.
 *
 *   node lessons/lesson-13/examples/01-prototype-by-hand.ts   запустить
 *   yarn typecheck                                            проверить типы
 */

// ── У ста объектов — сто копий метода ─────────────────────────────────────
// Отчёт о прогоне: номер рана, список результатов и два метода. Функция
// возвращает объект-литерал; this внутри метода — объект перед точкой.
const makeReport = (runId: number) => ({
  runId,
  results: [] as string[],
  record(caseId: string) {
    this.results.push(caseId);
  },
  summary() {
    return `run ${this.runId}: ${this.results.length}`;
  },
});
const reportA = makeReport(924);
const reportB = makeReport(926);
reportA.record('C157112');
console.log('1)', reportA.summary(), '|', reportB.summary(), '|', reportA.summary === reportB.summary);

// Последнее значение — false: у reportA и reportB РАЗНЫЕ функции summary.
// Каждый вызов makeReport создаёт объект заново, вместе с методами. А у двух
// локаторов click — одна и та же функция (урок 12). Как так сделать?

// ── Методы — в общий объект ───────────────────────────────────────────────
// Кладём методы в отдельный объект, а отчётам назначаем его прототипом.
type Report = { runId: number; results: string[]; record(caseId: string): void; summary(): string };

// «this: Report» в скобках — НЕ параметр. Это подсказка TypeScript: «this
// внутри будет такого типа». При запуске её нет. Нужна потому, что метод
// написан отдельно от объекта, и TypeScript сам не знает, у кого его вызовут.
const reportMethods = {
  record(this: Report, caseId: string) {
    this.results.push(caseId);
  },
  summary(this: Report) {
    return `run ${this.runId}: ${this.results.length}`;
  },
};

// Object.create(x) создаёт ПУСТОЙ объект, у которого прототипом стоит x.
// Больше ничего он не делает — данные кладём сами.
const reportC = Object.create(reportMethods) as Report;
reportC.runId = 924;
reportC.results = [];

const reportD = Object.create(reportMethods) as Report;
reportD.runId = 926;
reportD.results = [];

reportC.record('C157112');
console.log('2)', reportC.summary(), '|', reportD.summary(), '|', reportC.summary === reportD.summary);
console.log('3)', Object.hasOwn(reportC, 'summary'), Object.hasOwn(reportC, 'runId'), Object.getPrototypeOf(reportC) === reportMethods);

// Теперь summary один на всех. reportC.summary(): в самом reportC метода нет →
// поиск идёт в прототип → найден в reportMethods → вызван. А this внутри —
// по-прежнему объект ПЕРЕД ТОЧКОЙ, то есть reportC, а не reportMethods.
// Метод общий, данные у каждого свои. Это и есть вся идея прототипа.

// ── У объекта нет свойства prototype ──────────────────────────────────────
// Прототип объекта и свойство с именем «prototype» — разные вещи. У обычного
// объекта такого свойства нет:
console.log('4)', (reportC as { prototype?: unknown }).prototype);

// Если его присвоить, появится обычное свойство с таким именем. Прототип
// от этого не поменяется, и методы не появятся:
const plain = {} as { prototype?: unknown; summary?: unknown };
plain.prototype = reportMethods;
console.log('5)', typeof plain.summary, Object.hasOwn(plain, 'prototype'), Object.getPrototypeOf(plain) === Object.prototype);

// Назначить прототип уже готовому объекту можно так. Object.create делает
// то же самое, только в момент создания:
const later = { runId: 927, results: [] as string[] };
Object.setPrototypeOf(later, reportMethods);
console.log('6)', (later as unknown as Report).summary());

// Свойство prototype есть только у ФУНКЦИЙ, и значит оно другое — об этом
// 02-what-new-does.ts.

// ── Можно ли переписать метод прототипа из объекта ────────────────────────
// Нет. Присваивание всегда создаёт СОБСТВЕННОЕ свойство объекта — прототип
// оно не трогает. Своё свойство найдётся раньше и закроет прототипное.
reportC.summary = () => 'свой summary';
console.log('7)', reportC.summary(), '|', reportD.summary(), '|', Object.hasOwn(reportC, 'summary'));

// ── Данные в прототипе — общие на всех ────────────────────────────────────
// Методы в прототипе общие, и этого мы хотели. А если положить туда данные —
// сам список результатов?
const sharedState = { ...reportMethods, results: [] as string[] };
const reportE = Object.create(sharedState) as Report;
reportE.runId = 924;
const reportF = Object.create(sharedState) as Report;
reportF.runId = 926;

reportE.record('C157112');
console.log('8)', reportE.summary(), '|', reportF.summary());
console.log('9)', Object.hasOwn(reportE, 'results'), reportE.results === reportF.results);

// В reportF ничего не писали, а в нём один результат. Своего results нет
// ни у reportE, ни у reportF — оба нашли ОДИН И ТОТ ЖЕ массив в прототипе.
// Два рана пишут в один список. Это ошибка, а не приём: так не делают.

// ── Прочитать, присвоить, изменить ────────────────────────────────────────
// Почему с методами всё хорошо, а с массивом плохо? Разница в том, что
// делают со свойством.
const proto = { limit: 3, tags: ['smoke'] };
const first = Object.create(proto) as typeof proto;
const second = Object.create(proto) as typeof proto;

// 1. Прочитать — оба находят значение в прототипе:
console.log('10)', first.limit, second.limit);

// 2. Присвоить — у first появляется СВОЁ свойство. Прототип и second не тронуты:
first.limit = 5;
console.log('11)', first.limit, second.limit, proto.limit);

// 3. Изменить то, что лежит в прототипе, — push не присваивает, он меняет
//    сам массив. Массив один, поэтому изменение видят все:
first.tags.push('regression');
console.log('12)', second.tags, Object.hasOwn(first, 'tags'));

// Правило: в прототип — то, что у всех одинаковое (методы). В сам объект —
// то, что у каждого своё (данные). В классе за этим следит сама запись:
// поле заводится заново для каждого экземпляра (03-class.ts).

export {};
