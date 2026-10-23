/**
 * Урок 14 · Наследование: extends, переопределение, super.
 *
 * Что здесь: класс поверх класса · наследник переписывает один метод, и код
 * родителя зовёт новый · super.метод() — дописать, а не заменить · super(...)
 * в конструкторе на двух настоящих классах ошибок проекта.
 *
 *   node lessons/lesson-14/examples/02-inheritance.ts   запустить
 *   yarn typecheck                                      проверить типы
 */

// ── Класс поверх класса ───────────────────────────────────────────────────
// Репортер, который печатает строку на каждый тест, — как list в Playwright.
// onTestEnd собирает строку и внутри зовёт this.mark.
class ListReporter {
  mark(status: string): string { return status === 'passed' ? '✓' : '✘'; }
  onTestEnd(caseId: string, status: string) { return `${this.mark(status)} ${caseId}`; }
}

// НАСЛЕДОВАНИЕ — новый класс описывается на основе существующего.
class WidgetsListReporter extends ListReporter {
  project = 'widgets';
}
const widgetsList = new WidgetsListReporter();
console.log('1)', widgetsList.onTestEnd('C157112', 'passed'), '|', widgetsList.project, '|', widgetsList instanceof ListReporter);

// В WidgetsListReporter написано одно поле, а onTestEnd есть — взят у
// родителя. extends делает цепочку прототипов на звено длиннее (урок 13).

// ── Переопределение: наследник меняет один метод ──────────────────────────
// ПЕРЕОПРЕДЕЛЕНИЕ — метод с тем же именем в наследнике. Вызывается он.
class DotReporter extends ListReporter {
  mark(status: string) { return status === 'passed' ? '·' : 'F'; }
}
const list = new ListReporter();
const dot = new DotReporter();
console.log('2)', list.onTestEnd('C157112', 'passed'), '|', dot.onTestEnd('C157112', 'passed'));
console.log('3)', list.onTestEnd('C22041', 'failed'), '|', dot.onTestEnd('C22041', 'failed'));

// onTestEnd написан один раз — в родителе. Но внутри него this.mark(...),
// а this — тот объект, у которого вызвали метод, то есть dot. У dot свой
// mark — он и сработал. Код родителя вызвал метод наследника, ничего о нём
// не зная. Настоящие --reporter=list и --reporter=dot печатают те же значки:
// list — ✓/✘ со строкой теста, dot — одни точки и F, без номера кейса.
//
// mark(status: string): string у родителя — тип возврата указан явно.
// Без него TypeScript решил бы, что mark возвращает только '✓' | '✘',
// и не дал бы наследнику вернуть точку (TS2416).

// ── super.метод() — дописать, а не заменить ───────────────────────────────
class VerboseReporter extends ListReporter {
  onTestEnd(caseId: string, status: string) { return `${super.onTestEnd(caseId, status)} (${status})`; }
}
console.log('4)', new VerboseReporter().onTestEnd('C22041', 'failed'));

// super.onTestEnd(...) — «вызови этот же метод у родителя». super — не
// метод, а ключевое слово: «звено выше». Родитель собрал строку, наследник
// дописал своё.

// ── super(...) в конструкторе — настоящий класс проекта ───────────────────
// C94015.helpers.ts: единственный constructor на весь проект. Текст
// сообщения укорочен, остальное дословно.
class OverlapRefusal extends Error {
  constructor(diagnostics: string) {
    super(`the checkout refused this session. It rendered: ${diagnostics}`);
    this.name = 'OverlapRefusal';
  }
}
const refusal = new OverlapRefusal('Client is booked');
console.log('5)', refusal.name, '|', refusal.message, '|', refusal instanceof Error);

// super(...) в конструкторе — вызов РОДИТЕЛЬСКОГО КОНСТРУКТОРА: Error кладёт
// текст в message. Правило жёсткое: super(...) раньше первого this. Объект
// создаёт самый верхний конструктор; пока его не вызвали, this ещё нет.
//
// Два super — разные вещи: super(...) в конструкторе — родительский
// конструктор; super.onTestEnd() в методе — родительский метод.

// ── Что кладёт Error в экземпляр, а что берётся из прототипа ──────────────
// C176591.helpers.ts: второй класс ошибок проекта, с пустым телом.
class AchProvisioningGap extends Error {}
const gap = new AchProvisioningGap('ACH account cannot be provisioned');
console.log('6)', gap.name, '|', Object.hasOwn(gap, 'message'), Object.hasOwn(gap, 'stack'), Object.hasOwn(gap, 'name'));

// Конструктор Error кладёт в экземпляр message и stack. name он не кладёт —
// name лежит в Error.prototype, и там написано 'Error'. Поэтому у пустого
// наследника имя 'Error', а OverlapRefusal записывает своё сам —
// собственное свойство закрывает прототипное (урок 12).
//
// Зачем пустой класс? Ради одного: gap instanceof AchProvisioningGap —
// эту ошибку можно отличить от любой другой.

export {};
