/**
 * Задание 1 · Предсказать вывод.
 *
 * Напротив каждой стрелки `// →` напишите, что напечатается. Прогноз пишется
 * ДО запуска. Задание не засчитывается без объяснения.
 *
 *   node lessons/lesson-10/homework/01-predict-output.ts
 *
 * Цель не в том, чтобы угадать строку, а в том, чтобы поймать место, где ваша
 * модель расходится с реальностью. Совпало — хорошо; не совпало — самое ценное
 * место, припишите почему.
 *
 * В объяснении не принимается «потому что итератор». Нужно по шагам: кто
 * вызвал `next()`, сколько раз и что тот вернул. Для циклов — на каком проходе
 * сработали `continue` и `break`.
 */

// ── Блок 1. Циклы ─────────────────────────────────────────────────────────

const pool = ['C157112', 'skip', 'C22041', 'C19877', 'C93515'];

let seen = 0;
const picked: string[] = [];
for (let i = 0; i < pool.length; i++) {
  seen += 1;
  if (pool[i] === 'skip') continue;
  if (picked.length === 2) break;
  picked.push(pool[i]);
}
console.log('1)', picked, seen);

// → 1)
// объяснение (сколько проходов начались и на каком вышли):

let visits = 0;
const forEachResult = pool.forEach((code) => {
  visits += 1;
  if (code === 'C22041') return;
});
console.log('2)', visits, forEachResult);

// → 2)
// объяснение (что вернул forEach и почему return не помог):

console.log('3)', pool.some((code) => code.startsWith('C19')));

// → 3)
// объяснение (что именно отдаёт some — элемент или что-то другое):

const joined: unknown[] = [];
for (const k in ['a', 'b']) joined.push(k + 1);
console.log('4)', joined);

// → 4)
// объяснение (какого типа k и что сделал +):

// ── Блок 2. Протокол итератора ────────────────────────────────────────────

const it = ['x', 'y'][Symbol.iterator]();
it.next();
console.log('5)', it.next(), it.next());

// → 5)
// объяснение (сколько раз вызван next и что вернул каждый):

const countdown = {
  from: 3,
  [Symbol.iterator](): Iterator<number> {
    let n = this.from;
    return { next: () => (n > 0 ? { value: n--, done: false } : { value: undefined, done: true }) };
  },
};
console.log('6)', [...countdown], [...countdown]);

// → 6)
// объяснение (почему второй спред не пустой — или пустой):

const [head, , third] = countdown;
console.log('7)', head, third);

// → 7)
// объяснение (кто здесь вызывает next и сколько раз):

// ── Блок 3. Генераторы ────────────────────────────────────────────────────

function* steps(): Generator<string, string, unknown> {
  yield 'открыть';
  yield 'заполнить';
  return 'сохранить';
}
console.log('8)', [...steps()]);

// → 8)
// объяснение (куда делось то, что после return):

const s = steps();
s.next();
s.next();
console.log('9)', s.next(), s.next());

// → 9)
// объяснение (что отдаёт next после return — и после того, как всё кончилось):

const trace: string[] = [];
function* guarded(): Generator<number> {
  try {
    yield 1;
    yield 2;
    yield 3;
  } finally {
    trace.push('finally');
  }
}
for (const n of guarded()) {
  trace.push(`n=${n}`);
  if (n === 2) break;
}
console.log('10)', trace);

// → 10)
// объяснение (почему finally выполнился — или не выполнился, — хотя до конца не дошли):

const produced: number[] = [];
function* naturals(): Generator<number> {
  let n = 0;
  while (true) {
    n += 1;
    produced.push(n);
    yield n;
  }
}
const nat = naturals();
console.log('11)', produced.length);

// → 11)
// объяснение (началось ли тело генератора в момент вызова naturals()):

nat.next();
nat.next();
for (const n of naturals()) if (n >= 3) break;
console.log('12)', produced);

// → 12)
// объяснение (сколько генераторов здесь работало и сколько шагов сделал каждый):

// ── Вопрос в конце ────────────────────────────────────────────────────────
// На занятии прозвучало, что `for...in` может сразу отдать ключ и значение:
//
//   for (const [key, value] in timeouts) { ... }
//
// Ответьте на три вопроса:
//   а) какую ошибку даст на этой строке `tsc` (код и смысл);
//   б) что напечатал бы тот же цикл в чистом JavaScript, где проверки типов нет,
//      для timeouts = { short: 5000 } — и почему именно это;
//   в) как на самом деле получить ключ и значение одной строкой.
//
// Проверить (б) можно без TypeScript:
//   node -e "for (const [k, v] in { short: 5000 }) console.log(k, v)"
//
// ответ:

export {};
