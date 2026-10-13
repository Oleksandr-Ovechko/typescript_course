/**
 * Задание 1 · Предсказать вывод.
 *
 * Напротив каждой стрелки `// →` напишите, что напечатается. Прогноз пишется
 * ДО запуска. Задание не засчитывается без объяснения.
 *
 *   node lessons/lesson-13/homework/01-predict-output.ts
 *
 * Не совпало — самое ценное место: припишите, где на самом деле лежит
 * свойство (в экземпляре, в Класс.prototype, в Object.prototype) и почему.
 * Ответ «потому что прототип» не принимается.
 */

class CaseRun {
  caseId: string;
  attempts: number[] = [];
  constructor(caseId: string) {
    this.caseId = caseId;
  }
  add(durationMs: number) {
    this.attempts.push(durationMs);
  }
  slowest() {
    return Math.max(...this.attempts);
  }
}

const runA = new CaseRun('C157112');
const runB = new CaseRun('C22041');
runA.add(1200);
runA.add(3400);

// ── Блок 1. Где что лежит ─────────────────────────────────────────────────

console.log('1)', Object.hasOwn(runA, 'caseId'), Object.hasOwn(runA, 'attempts'), Object.hasOwn(runA, 'add'));
// → 1)
// объяснение:

console.log('2)', runA.add === runB.add, runA.attempts === runB.attempts);
// → 2)
// объяснение:

console.log('3)', typeof CaseRun, typeof runA, typeof runA.add);
// → 3)
// объяснение:

console.log('4)', Object.getPrototypeOf(runA) === CaseRun.prototype, Object.getPrototypeOf(runA) === Object.getPrototypeOf(runB));
// → 4)
// объяснение:

console.log('5)', Object.keys(runA), runB.attempts.length);
// → 5)
// объяснение:

// ── Блок 2. Функция, её prototype и экземпляр ─────────────────────────────

console.log('6)', (runA as { prototype?: unknown }).prototype, typeof CaseRun.prototype);
// → 6)
// объяснение (у кого есть свойство prototype, а у кого нет):

console.log('7)', Object.hasOwn(CaseRun.prototype, 'slowest'), Object.hasOwn(CaseRun.prototype, 'attempts'), 'toString' in runA);
// → 7)
// объяснение:

console.log('8)', runA instanceof CaseRun, runA instanceof Object, Object.getPrototypeOf(CaseRun.prototype) === Object.prototype);
// → 8)
// объяснение:

// ── Блок 3. Своё закрывает прототипное ────────────────────────────────────

runB.slowest = () => -1;
console.log('9)', runA.slowest(), runB.slowest(), Object.hasOwn(runB, 'slowest'), Object.hasOwn(CaseRun.prototype, 'slowest'));
// → 9)
// объяснение (поменялся ли метод у runA и почему):

const slowestOfA = runA.slowest;
let outcome: string;
try {
  outcome = String(slowestOfA());
} catch (error) {
  outcome = (error as Error).message;
}
console.log('10)', outcome);
// → 10)
// объяснение (чему равен this внутри вызова и на какой строке метод упал):

export {};
