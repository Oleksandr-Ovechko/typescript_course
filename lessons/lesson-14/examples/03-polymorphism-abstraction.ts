/**
 * Урок 14 · Полиморфизм и абстракция.
 *
 * Что здесь: один вызов — разное поведение · любую ошибку читают как Error ·
 * interface — договор без кода · implements и «лишние» методы · чем
 * интерфейс отличается от класса (вопрос с занятия) · abstract class.
 *
 *   node lessons/lesson-14/examples/03-polymorphism-abstraction.ts   запустить
 *   yarn typecheck                                                   проверить типы
 */

class ListReporter {
  mark(status: string): string { return status === 'passed' ? '✓' : '✘'; }
  onTestEnd(caseId: string, status: string) { return `${this.mark(status)} ${caseId}`; }
}
class DotReporter extends ListReporter {
  mark(status: string) { return status === 'passed' ? '·' : 'F'; }
}

// ── Один вызов — разное поведение ─────────────────────────────────────────
// Этот репортер ничей не наследник. Общего с остальными у него одно: метод
// с тем же именем и параметрами. Повторяет настоящий: наш TestRail-репортер
// сейчас отправляет только прошедшие тесты.
class TestRailLikeReporter {
  onTestEnd(caseId: string, status: string) { return status === 'passed' ? `${caseId} → TestRail` : 'пропущен'; }
}

// ПОЛИМОРФИЗМ — объекты разных классов отвечают на один и тот же вызов
// по-своему.
const reporters = [new ListReporter(), new DotReporter(), new TestRailLikeReporter()];
for (const reporter of reporters) {
  console.log('1)', reporter.onTestEnd('C157112', 'passed'), '|', reporter.onTestEnd('C22041', 'failed'));
}

// Цикл не знает, кто перед ним. Так же Playwright работает со списком
// reporter в конфиге проекта: после каждого теста зовёт onTestEnd у каждого.

// ── Любую ошибку читают как Error ─────────────────────────────────────────
class OverlapRefusal extends Error {
  constructor(diagnostics: string) {
    super(`the checkout refused this session. It rendered: ${diagnostics}`);
    this.name = 'OverlapRefusal';
  }
}
const failures: Error[] = [new Error('timeout'), new OverlapRefusal('Client is booked')];
console.log('2)', failures.map((failure) => `${failure.name}: ${failure.message}`).join(' · '));

// У всех наследников Error есть name и message. Поэтому строка
// e instanceof Error ? e.message : String(e) работает с любой ошибкой.

// ── interface — договор без кода ──────────────────────────────────────────
// АБСТРАКЦИЯ — выделить в объекте существенное и отбросить остальное:
// важно, что он умеет, а не как устроен.
interface CaseReporter {
  onTestEnd(caseId: string, status: string): string;
}
const runAll = (items: CaseReporter[]) => items.map((item) => item.onTestEnd('C157112', 'passed'));
console.log('3)', runAll(reporters).join(' · '));

// Ни один из трёх классов не писал implements CaseReporter — и все подошли:
// в TypeScript важна форма (урок 2).

// implements требует методы договора — и не запрещает свои:
class SimpleReporter implements CaseReporter {
  onTestEnd(caseId: string) { return caseId; }
  extra() { return 'метода extra нет в договоре — и это нормально'; }
}
console.log('4)', new SimpleReporter().extra());

// ── Чем интерфейс отличается от класса ────────────────────────────────────
// Вопрос с занятия. Коротко: интерфейс — это ТИП, класс — это КОД.
//
//                                  interface        abstract class      class
//   код методов                    нет              частично            весь
//   есть при запуске программы     нет              да                  да
//   можно сделать new              нет              нет                 да
//   сколько на один класс          implements A, B  extends — один      extends — один
//
// От интерфейса не «наследуются» — ему СООТВЕТСТВУЮТ. Класс ничего от него
// не получает: каждый метод договора он пишет сам.
// ❌ TS2693: 'CaseReporter' only refers to a type, but is being used as a value here.
// new CaseReporter();

// А унаследовать можно только один класс:
// ❌ TS1174: Classes can only extend a single class.
// class Mixed extends ListReporter, DotReporter {}

// Зачем тогда интерфейс, если есть классы? Затем, что ему соответствует
// что угодно подходящей формы — класс, объект-литерал, объект из чужой
// библиотеки, — и один класс может соответствовать нескольким договорам
// сразу. Так устроен Reporter из Playwright: это interface, и наш
// TestRailReporter ему соответствует, ничего от Playwright не наследуя.
const literalReporter: CaseReporter = { onTestEnd: (caseId) => `literal ${caseId}` };
console.log('5)', literalReporter.onTestEnd('C22041', 'failed'));

// ── abstract class — договор, в котором часть кода уже есть ───────────────
abstract class MarkReporter {
  abstract mark(status: string): string;
  onTestEnd(caseId: string, status: string) { return `${this.mark(status)} ${caseId}`; }
}
class StarReporter extends MarkReporter {
  mark(status: string) { return status === 'passed' ? '★' : '☆'; }
}
// ❌ TS2511: Cannot create an instance of an abstract class.
// new MarkReporter();
console.log('6)', new StarReporter().onTestEnd('C157112', 'passed'), runAll([new StarReporter()]));

// abstract mark(...) — метод без тела: наследник обязан его написать.
// Общий onTestEnd написан один раз. В проекте abstract нет — узнавать
// нужно, писать не придётся.

export {};
