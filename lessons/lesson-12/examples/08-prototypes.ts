/**
 * Урок 12 · Откуда у объекта методы — вводная к прототипам.
 *
 * Что здесь: метод примитива лежит в прототипе, а строка — не объект ·
 * обёртка и String.prototype — разные объекты · цепочка прототипов до null ·
 * где у массива Symbol.iterator · своё свойство закрывает прототип ·
 * new связывает объект с прототипом; Date и Date.prototype — не одно и то же ·
 * instanceof смотрит всю цепочку · у null прототипа нет.
 *
 * Начало — в 07-locator-prototype.sh: click лежит не в локаторе, а в его
 * прототипе. Подробно, с class, constructor и extends, — урок 13.
 *
 *   node lessons/lesson-12/examples/08-prototypes.ts   запустить
 *   yarn typecheck                                     проверить типы
 */

// ── Метод примитива лежит в прототипе ─────────────────────────────────────
// Строка — примитив, не объект (урок 1). Но toUpperCase у неё есть: он лежит
// в String.prototype.
const caseTitle = 'booking zero-cost';
console.log('1)', caseTitle.toUpperCase(), Object.hasOwn(String.prototype, 'toUpperCase'));
console.log('2)', Object.getPrototypeOf(caseTitle) === String.prototype);

// В момент вызова движок на мгновение заворачивает строку в ОБЪЕКТ-ОБЁРТКУ,
// находит метод в её прототипе, вызывает и выбрасывает обёртку. Обёртка —
// отдельный объект, а String.prototype — её прототип. Это два разных объекта:
const wrapper = Object('x') as object;
console.log('3)', wrapper === String.prototype, Object.getPrototypeOf(wrapper) === String.prototype);

// Записать в строку своё поле нельзя — обёртки к этому моменту уже нет.
// Файл-модуль всегда в строгом режиме, поэтому присваивание падает. В обычном
// скрипте без 'use strict' оно молча пропало бы: строка осталась бы без поля.
try {
  (caseTitle as unknown as { extra: number }).extra = 1;
} catch (error) {
  console.log('4)', (error as Error).message);
}

// ── Цепочка прототипов ────────────────────────────────────────────────────
// У прототипа тоже есть прототип. Пройдём по цепочке массива до конца.
const suites = ['widgets', 'monolith'];
const chain: string[] = [];
for (let link = Object.getPrototypeOf(suites); link !== null; link = Object.getPrototypeOf(link)) {
  chain.push(`${link.constructor.name}.prototype`);
}
console.log('5)', chain.join(' → '), '→ null');

// Когда вы пишете suites.map, поиск идёт по цепочке снизу вверх: в самом
// массиве map нет, в Array.prototype есть — найдено. `in` смотрит всю
// цепочку, Object.hasOwn — только сам объект. length — собственное свойство.
console.log('6)', Object.hasOwn(suites, 'map'), 'map' in suites, Object.hasOwn(suites, 'length'));

// Это тот же механизм, что лексическое окружение в уроке 6: там переменная
// искалась изнутри наружу по цепочке окружений, здесь свойство — от объекта
// вверх по цепочке прототипов. Первое найденное побеждает.

// ── Где у массива Symbol.iterator ─────────────────────────────────────────
// Вопрос с урока 10. Не в самом массиве, а там же, где map, — в
// Array.prototype. Поэтому for...of работает с любым массивом.
console.log('7)', Object.hasOwn(suites, Symbol.iterator), Object.hasOwn(Array.prototype, Symbol.iterator));

// ── Своё свойство закрывает прототип ──────────────────────────────────────
// Объект в шаблонной строке зовёт свой toString(). У client своего нет —
// нашёлся Object.prototype.toString, отсюда [object Object]. У namedClient
// свой есть — поиск на нём остановился. Затенение из урока 6, только
// для свойств.
const client = { name: 'Anna' };
const namedClient = { name: 'Anna', toString() { return this.name; } };
console.log('8)', `${client}`, '|', `${namedClient}`);
console.log('9)', Object.hasOwn(client, 'toString'), Object.hasOwn(namedClient, 'toString'));

// Ловушка в именах тестов: test(`book for ${client}`) даст «book for
// [object Object]». В проекте подставляют поле явно: ${client.name}.

// ── Как посмотреть, что лежит в прототипе ─────────────────────────────────
// console.log(Object.prototype) в Node печатает пустые скобки: методы
// прототипов неперечисляемые, и console.log их не показывает. В DevTools
// браузера объект раскрывается кликом. В Node список даёт
// Object.getOwnPropertyNames:
console.log('10)', Object.getOwnPropertyNames(Object.prototype).length, Object.getOwnPropertyNames(Object.prototype).includes('toString'));

// ── new: откуда у объекта прототип ────────────────────────────────────────
// Для массивов и строк прототип ставит сам язык. Для остальных — new.
// Date — это ФУНКЦИЯ, а Date.prototype — её свойство, отдельный объект,
// в котором лежат getTime, toISOString и остальное. new Date(...) создаёт
// новый объект и ставит ему прототипом Date.prototype.
const started = new Date(0);
console.log('11)', typeof Date, typeof Date.prototype, Object.getPrototypeOf(started) === Date.prototype);

// ── instanceof смотрит всю цепочку ────────────────────────────────────────
// `x instanceof Date` — «есть ли Date.prototype где-то в цепочке x». Это
// не то же самое, что сравнить прототип напрямую: прямое сравнение смотрит
// только первое звено.
console.log('12)', started instanceof Date, started instanceof Object);
console.log('13)', Object.getPrototypeOf(started) === Object.prototype);

// Дата — Object тоже: Object.prototype стоит в её цепочке вторым звеном.
// Но её прототип — Date.prototype, а не Object.prototype.

// ── У null прототипа нет ──────────────────────────────────────────────────
// Цепочка кончается null. У самого null и у undefined нет ни обёртки,
// ни прототипа — искать toString негде. Поэтому .toString() на них падает,
// а String(x) работает с чем угодно. В wl-e2e String( встречается в десять
// раз чаще, чем .toString().
console.log('14)', String(null), String(undefined));
try {
  (null as unknown as number).toString();
} catch (error) {
  console.log('15)', (error as Error).message);
}
console.log('16)', Object.getPrototypeOf(Object.prototype));

// ── Что дальше ────────────────────────────────────────────────────────────
// class — запись, которая создаёт такой прототип и функцию для new.
// В wl-e2e классов почти нет; главный — TestRail-репортер
// (helpers/utils/testrail-reporter.ts на draft):
//
//   class TestRailReporter implements Reporter {
//     onBegin(_config: FullConfig, suite: Suite) { … }
//     onTestEnd(test: TestCase, result: TestResult) { … }
//     async onEnd() { … }
//   }
//
// Playwright делает new TestRailReporter() и вызывает его методы, а методы
// лежат в прототипе — как click у локатора. Как устроены class, constructor,
// extends и что делает new по шагам — урок 13.

export {};
