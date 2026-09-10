/**
 * Задание 1 · Предсказать вывод.
 *
 * Напротив каждой стрелки `// →` напишите, что напечатается, и в каком порядке.
 * Прогноз пишется ДО запуска. Задание не засчитывается без объяснения.
 *
 *   node lessons/lesson-06/homework/01-predict-output.ts
 *
 * Цель не в том, чтобы угадать строку, а в том, чтобы поймать место, где ваша
 * модель расходится с реальностью. Совпало — хорошо; не совпало — самое ценное
 * место, припишите почему.
 *
 * В объяснении не принимается «потому что замыкание». Нужно по шагам: какое
 * окружение, чья цепочка, в какой момент значение прочитали.
 */

// ── Блок 1. Окружения ─────────────────────────────────────────────────────

const suite = 'widgets';

function outer(): void {
  const suite = 'monolith';

  function inner(): void {
    console.log('1)', suite);
  }

  inner();
}
outer();
console.log('2)', suite);

// → 1)
// → 2)
// объяснение:

function makeTag(): () => string {
  const tag = 'внутренний';
  return (): string => tag;
}

const tag = 'внешний';
const readTag = makeTag();

function elsewhere(): void {
  const tag = 'из места вызова';
  void tag;
  console.log('3)', readTag());
}
elsewhere();
void tag;

// → 3)
// объяснение:

// ── Блок 2. Замыкание ─────────────────────────────────────────────────────

function makeStep(): () => number {
  let step = 0;
  return (): number => {
    step += 2;
    return step;
  };
}

const first = makeStep();
const second = makeStep();

console.log('4)', first(), first());
console.log('5)', second());
console.log('6)', first());

// → 4)
// → 5)
// → 6)
// объяснение:

let skin = 'default';
const readSkin = (): string => skin;
const copySkin = ((snapshot: string) => (): string => snapshot)(skin);
skin = 'christmas';

console.log('7)', readSkin(), '·', copySkin());

// → 7)
// объяснение (почему две функции, написанные рядом, отвечают по-разному):

// ── Блок 3. Этап сборки ───────────────────────────────────────────────────

const queue: Array<() => void> = [];

function collect(name: string, body: () => void): void {
  queue.push(body);
  console.log('8) собрали:', name);
}

let widgetName: string | undefined;

collect(`проверяем ${widgetName}`, () => console.log('10) внутри:', widgetName));

widgetName = 'schedule';
console.log('9) запускаем');
for (const run of queue) run();

// → 8)
// → 9)
// → 10)
// объяснение (почему в строке 8 и в строке 10 одна переменная даёт разное):

// ── Блок 4. this ──────────────────────────────────────────────────────────

const reporter = {
  name: 'C157112',
  viaThis(): string {
    return `this: ${this.name}`;
  },
};

const detached = reporter.viaThis;

console.log('11)', reporter.viaThis());
try {
  console.log('12)', detached());
} catch (error) {
  console.log('12) упало:', (error as Error).message);
}

// → 11)
// → 12)
// объяснение:

type Named = { name: string };

function describeIt(this: Named, mark: string): string {
  return `${mark}${this.name}${mark}`;
}

const widgets: Named = { name: 'widgets' };
const monolith: Named = { name: 'monolith' };

const bound = describeIt.bind(widgets);
const rebound = bound.bind(monolith);

console.log('13)', describeIt.call(monolith, '*'));
console.log('14)', typeof describeIt.bind(widgets));
console.log('15)', rebound('~'));

// → 13)
// → 14)
// → 15)
// объяснение (почему 15 именно такая):

// ── Вопрос без кода ───────────────────────────────────────────────────────
// В строке 7 первая функция показывает новое значение, вторая — старое.
// Что нужно изменить, чтобы `readSkin()` тоже вернула `default`, — не трогая
// ни строку с `const readSkin`, ни строку с `console.log`?
//
// Подсказка: менять можно только строку `skin = 'christmas';`. Ответ есть
// в конспекте, в разделе про захват переменной.
//
// ответ:

export {};
