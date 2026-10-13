/**
 * Урок 13 · Свой репортер и настоящий TestRailReporter.
 *
 * Что здесь: зачем здесь класс, а не три функции · constructor не обязателен ·
 * private и readonly существуют только для TypeScript · readonly — как const ·
 * implements — проверка формы, а не наследование · как TestRail-репортер
 * подключён в проекте и кто делает new.
 *
 *   node lessons/lesson-13/examples/04-reporter.ts   запустить
 *   yarn typecheck                                   проверить типы
 */

// ── Уменьшенная копия настоящего репортера ────────────────────────────────
// Три метода вызывает не наш код, а Playwright: перед прогоном, после каждого
// теста, в конце. Между вызовами репортер ПОМНИТ СОСТОЯНИЕ в полях: включён
// ли он и что накопил. Вот зачем класс: методам нужны общие данные, которые
// живут между вызовами, и Playwright нужен один объект, у которого их позвать.
class MiniReporter {
  private enabled = false;
  private readonly results: string[] = [];
  onBegin() {
    this.enabled = true;
  }
  onTestEnd(caseId: string, status: string) {
    if (!this.enabled) return;
    this.results.push(`${caseId} ${status}`);
  }
  onEnd() {
    return this.results.join(', ');
  }
}
const mini = new MiniReporter();
mini.onTestEnd('C1', 'passed'); // репортер ещё не включён — запись пропущена
mini.onBegin();
mini.onTestEnd('C157112', 'passed');
mini.onTestEnd('C22041', 'failed');
console.log('1)', mini.onEnd());

// constructor в классе нет — и это нормально. Поля с «=» заполняются сами;
// constructor нужен, только когда значения приходят снаружи.

// Поле results у каждого экземпляра СВОЁ — два репортера друг другу не мешают:
const other = new MiniReporter();
other.onBegin();
console.log('2)', JSON.stringify(other.onEnd()), '|', mini.onEnd());

// ── private и readonly — только для TypeScript ────────────────────────────
// МОДИФИКАТОР ДОСТУПА — слово перед полем или методом, которое говорит
// TypeScript, откуда к нему можно обращаться. private — только изнутри класса.
// ❌ TS2341: Property 'enabled' is private and only accessible within class 'MiniReporter'.
// console.log(mini.enabled);

// Следит за этим только TypeScript. При запуске поле обычное: Object.keys его
// показывает, а через «as unknown as» его можно прочитать.
console.log('3)', Object.keys(mini), (mini as unknown as { results: string[] }).results.length);

// Настоящая приватность в JavaScript пишется через решётку: #results.
// В проекте её нет, везде private.

// ── readonly — как const ──────────────────────────────────────────────────
// const запрещает присвоить переменную заново, но не запрещает менять то,
// на что она указывает. readonly — то же самое для поля.
const statuses: string[] = [];
statuses.push('passed'); // можно: массив тот же, изменилось содержимое
// ❌ TS2588: Cannot assign to 'statuses' because it is a constant.
// statuses = ['failed'];

class Frozen {
  readonly results: string[] = [];
  reset() {
    this.results.push('passed'); // можно
    // ❌ TS2540: Cannot assign to 'results' because it is a read-only property.
    // this.results = [];
  }
}
const frozen = new Frozen();
frozen.reset();
console.log('4)', statuses, frozen.results);

// ── implements — проверка формы ───────────────────────────────────────────
// «implements X» — просьба к TypeScript: проверь, что класс подходит под тип X.
// Это не наследование: класс ничего от X не получает. При запуске слова нет.
type MiniReporterShape = { onBegin?(): void; onEnd?(): string };

// Пустой класс проверку проходит: оба метода в типе необязательные («?»).
// У настоящего Reporter из Playwright необязательные ВСЕ методы.
class SilentReporter implements MiniReporterShape {}

// Если в типе есть обязательный метод, implements его требует:
type StrictShape = { onTestEnd(caseId: string): void };
// ❌ TS2420: Class 'Incomplete' incorrectly implements interface 'StrictShape'.
// class Incomplete implements StrictShape {}
class Complete implements StrictShape {
  onTestEnd(caseId: string) {
    void caseId;
  }
}

// А mini подходит под MiniReporterShape, хотя implements у его класса не
// написано: важна форма, а не объявление (структурная типизация, урок 2).
// implements — страховка: ошибка покажется в самом классе, а не там, где
// его используют.
const shaped: MiniReporterShape = mini;
console.log('5)', Object.keys(new SilentReporter()), typeof shaped.onEnd, typeof new Complete().onTestEnd);

// ── Настоящий TestRailReporter ────────────────────────────────────────────
// helpers/utils/testrail-reporter.ts в wl-e2e устроен так же:
//
//   class TestRailReporter implements Reporter {
//     private enabled = false;
//     private runId: number | null = null;
//     private readonly results: TestRailResult[] = [];
//     …ещё шесть полей, все private
//
//     onBegin(_config: FullConfig, suite: Suite) { … }
//     onTestEnd(test: TestCase, result: TestResult) { … }
//     async onEnd() { … }
//     …и одиннадцать private-методов: внутренняя кухня
//   }
//   export default TestRailReporter;
//
// • Reporter — это ТИП из Playwright (interface), а не класс. От него нельзя
//   наследоваться — ему можно только соответствовать. При запуске его нет;
//   Playwright зовёт onBegin, onTestEnd и onEnd просто потому, что такие
//   методы у объекта есть.
// • results — поле ЭКЗЕМПЛЯРА, как у нашего MiniReporter. Общего массива
//   в прототипе там нет.
// • constructor нет: у всех девяти полей есть начальное значение.
//
// Кто делает new? Не мы. Репортер указан в конфиге ПУТЁМ:
//
//   reporter: [['list'], ['allure-playwright'], ['../../helpers/utils/testrail-reporter.ts'], …]
//
// Playwright сам импортирует файл, берёт export default и делает
// new TestRailReporter(). Он создаётся при каждом прогоне — но работает,
// только если TESTRAIL_ENABLED=true и заданы доступы; иначе печатает одну
// строку и молчит. Это то самое поле enabled = false.
//
// Флаг --reporter=… в командной строке ЗАМЕНЯЕТ весь список из конфига:
// с ним TestRail-репортер не запустится вовсе. Если флага нет и в конфиге
// репортеров нет, Playwright берёт list.

export {};
