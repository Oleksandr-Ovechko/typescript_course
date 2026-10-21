/**
 * Задание 1 · Предсказать вывод.
 *
 * Три класса один над другим. Напротив каждой стрелки `// →` напишите, что
 * напечатается, ДО запуска. Потом запустите и сверьте:
 *
 *   node lessons/lesson-14/homework/01-predict-output.ts
 *
 * Для каждой строки, где не совпало, припишите: в каком классе нашёлся
 * вызванный метод и чему был равен this. Ответ «потому что наследование»
 * не принимается.
 */

class StepLog {
  label() { return 'step'; }
  line(name: string) { return `${this.label()}: ${name}`; }
}
class WidgetStepLog extends StepLog {
  label() { return 'widget'; }
}
class TimedWidgetStepLog extends WidgetStepLog {
  line(name: string) { return `${super.line(name)} (1.2s)`; }
}

const base = new StepLog();
const widget = new WidgetStepLog();
const timed = new TimedWidgetStepLog();

console.log('1)', base.line('open'));
// → 1)

console.log('2)', widget.line('open'));
// → 2)
// в каком классе написан line, который здесь выполнился? чему равен this?

console.log('3)', timed.line('book'));
// → 3)
// что вернул super.line(...) и чей label он позвал?

console.log('4)', timed instanceof StepLog, base instanceof TimedWidgetStepLog);
// → 4)

console.log('5)', Object.hasOwn(WidgetStepLog.prototype, 'line'), Object.hasOwn(TimedWidgetStepLog.prototype, 'label'));
// → 5)

const steps = [base, widget, timed];
console.log('6)', steps.map((step) => step.line('save')).join(' | '));
// → 6)
// как называется то, что один и тот же вызов дал три разных результата?

export {};
