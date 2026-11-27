/**
 * Домашка урока 6 · Задание 1 — предсказать вывод.
 *
 * Готово, когда: напротив каждой строки с `// →` записан прогноз и одна фраза
 * «почему», файл запущен и прогнозы сверены. Там, где не совпало, — приписка,
 * в чём ошиблись.
 *
 * Прогноз пишется ДО запуска. Смысл не в том, чтобы угадать, а в том, чтобы
 * поймать место, где ваше представление о языке расходится с тем, что он
 * делает на самом деле.
 *
 *   node lessons/lesson-06/homework/01-predict-output.ts
 *
 * Сначала прочитайте весь код до строки 1), потом прогнозируйте по порядку.
 */

function introduce(this: { name: string }, mood: string): string {
  return `${this.name} ${mood}`;
}
const kate = { name: 'Kate' };
const max = { name: 'Max' };
const kateSays = introduce.bind(kate);
const maxSays = kateSays.bind(max);

const shelf = {
  label: 'полка',
  describe(): string {
    const read = () => this.label;
    return read();
  },
};

const ticket: { seat?: string | null; row?: number; price: number; zone: string } = {
  seat: null,
  price: 300,
  zone: 'A',
};
const { seat = 'любое', row = 1, ...restOfTicket } = ticket;

const scores = [5, 3, 8];
const [best, , last = 0] = scores;
const scoresCopy = [...scores, 10];

const stock: { apples?: number; pears?: number; plums?: number } = { apples: 0, pears: 0 };
stock.apples ??= 10;
stock.pears ||= 10;
stock.plums ??= 10;

const indexTypes: string[] = [];
for (const index in ['x', 'y']) {
  indexTypes.push(typeof index);
}

function check(n: number): number {
  if (n > 5) {
    throw new Error('больше пяти');
  }
  return n;
}
const passedOutside: number[] = [];
try {
  for (const n of [2, 7, 4]) {
    passedOutside.push(check(n));
  }
} catch {
  passedOutside.push(-1);
}
const passedInside: number[] = [];
for (const n of [2, 7, 4]) {
  try {
    passedInside.push(check(n));
  } catch {
    passedInside.push(-1);
  }
}

const steps: string[] = [];
try {
  steps.push('try');
  throw 'сигнал';
} catch (thrown) {
  steps.push(typeof thrown);
} finally {
  steps.push('finally');
}

console.log('1)', introduce.call(max, 'рад'), '|', kateSays('рада'), '|', maxSays('рад'));  // →
console.log('2)', shelf.describe());                                                       // →
console.log('3)', seat, row, restOfTicket);                                                // →
console.log('4)', best, last, scores.length, scoresCopy.length);                           // →
console.log('5)', stock);                                                                  // →
console.log('6)', indexTypes);                                                             // →
console.log('7)', passedOutside.join(' '), '|', passedInside.join(' '));                   // →
console.log('8)', steps.join(' '));                                                        // →

export {};
