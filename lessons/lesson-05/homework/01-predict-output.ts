/**
 * Домашка урока 5 · Задание 1 — предсказать вывод.
 *
 * Готово, когда: напротив каждой строки с `// →` записан прогноз и одна фраза
 * «почему», файл запущен и прогнозы сверены. Там, где не совпало, — приписка,
 * в чём ошиблись.
 *
 * Прогноз пишется ДО запуска. Смысл не в том, чтобы угадать, а в том, чтобы
 * поймать место, где ваше представление о языке расходится с тем, что он
 * делает на самом деле.
 *
 *   node lessons/lesson-05/homework/01-predict-output.ts
 *
 * Сначала прочитайте весь код до строки 1), потом прогнозируйте по порядку.
 */

function makeBox(): { put: (n: number) => void; look: () => number } {
  let stored = 0;
  return {
    put: (n) => {
      stored = n;
    },
    look: () => stored,
  };
}
const box = makeBox();
const otherBox = makeBox();
box.put(7);

let sign = 'Яблоки';
function makeSignReader(): () => string {
  return () => sign;
}
function makeOwnSignReader(): () => string {
  const sign = 'Свои яблоки';
  return () => sign;
}
const readSign = makeSignReader();
const readOwnSign = makeOwnSignReader();
sign = 'Груши';

const fromVar: (() => number)[] = [];
for (var i = 1; i <= 3; i++) {
  fromVar.push(() => i);
}
const fromLet: (() => number)[] = [];
for (let j = 1; j <= 3; j++) {
  fromLet.push(() => j);
}

const first = { score: 1 };
const second = first;
second.score = 5;
const third = { score: 5 };

const order = { id: 1, client: { name: 'Ann' } };
const orderCopy = { ...order, id: 2 };
orderCopy.client.name = 'Bob';

const field = 'color';
const car = { field: 'red', [field]: 'blue' };

const stock: { apples?: number; pears?: number } = { apples: 0 };

const counter = {
  value: 10,
  inc(): number {
    this.value = this.value + 1;
    return this.value;
  },
};
const counterCopy = { ...counter };
counterCopy.inc();
counterCopy.inc();

console.log('1)', box.look(), otherBox.look());                                    // →
console.log('2)', readSign(), '|', readOwnSign());                                 // →
console.log('3)', fromVar[0](), fromVar[2]());                                     // →
console.log('4)', fromLet[0](), fromLet[2]());                                     // →
console.log('5)', first.score, first === second, first === third);                 // →
console.log('6)', order.id, order.client.name);                                    // →
console.log('7)', car.field, car.color);                                           // →
console.log('8)', stock.apples ?? 'нет', stock.pears ?? 'нет', stock.apples || 'нет'); // →
console.log('9)', counter.value, counterCopy.value, counter.inc === counterCopy.inc); // →

export {};
