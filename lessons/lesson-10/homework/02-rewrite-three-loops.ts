/**
 * Задание 2 · Переписать три цикла.
 *
 * Три функции, в каждой цикл выбран неудачно — и в каждой из-за этого
 * настоящий баг. Починить нужно не подгонкой условия, а заменой конструкции:
 *
 *   A. `forEach`, который пытается остановиться    → `for...of` с `break`
 *   B. `for` по индексу, которому индекс не нужен  → `for...of`
 *   C. `for...in` по объекту                        → `for...of` по `Object.entries`
 *
 *   node lessons/lesson-10/homework/02-rewrite-three-loops.ts   запустить
 *   yarn typecheck:hw10                                         проверить типы
 *
 * Готово, когда файл печатает шесть ✅ и ни одного ❌.
 *
 * ⚠️ `yarn typecheck:hw10` проходит и ДО того, как вы что-нибудь почините
 * (кроме задания 3). Все три бага — законный код с точки зрения компилятора.
 *
 * Код проверок трогать нельзя: чинить нужно сами функции. Проверки смотрят
 * и на результат, и на исходник функции — поэтому просто поправить `<=`
 * на `<` в B недостаточно.
 */

// ── A. Найти первый упавший кейс ──────────────────────────────────────────
// Должна вернуть id ПЕРВОГО упавшего кейса и сколько кейсов пришлось
// посмотреть, чтобы его найти. Остальные смотреть не нужно.
//
// Подсказка: конспект, «Конструкция языка против вызова функции».

type RunResult = { id: string; status: 'passed' | 'failed' };

const run: RunResult[] = [
  { id: 'C157112', status: 'passed' },
  { id: 'C22041', status: 'failed' },
  { id: 'C19877', status: 'failed' },
  { id: 'C93515', status: 'passed' },
];

function firstFailure(results: RunResult[]): { id: string | undefined; checked: number } {
  let checked = 0;
  let id: string | undefined;
  results.forEach((r) => {
    checked += 1;
    if (r.status === 'failed') {
      id = r.id;
      return;
    }
  });
  return { id, checked };
}

// ── B. Собрать подписи кейсов ─────────────────────────────────────────────
// Индекс здесь нужен только затем, чтобы достать элемент. А раз так —
// он лишний, и ошибка на единицу появляется ровно из-за него.
//
// Подсказка: конспект, «Счётчик и потолок» — когда счётчик действительно нужен.

const cases = ['C157112', 'C22041', 'C19877'];

function labels(codes: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i <= codes.length; i++) {
    out.push(`[${codes[i]}]`);
  }
  return out;
}

// ── C. Заполнить поля адреса ──────────────────────────────────────────────
// Модель `billing-account-balance-page.ts`: объект «селектор → значение»,
// по каждому полю — одно действие. Здесь действие — запись в массив.
//
// У объекта address есть «запасные» значения по умолчанию — они лежат
// не в нём самом, а в объекте, от которого он создан (как именно это
// устроено — урок про прототипы; сейчас достаточно факта). for...in их
// тоже видит, Object.entries — нет.
//
// Подсказка: конспект, «Перебор объекта».

const defaults = { '#country': 'US' };
const address: Record<string, string> = Object.assign(Object.create(defaults), {
  '#street': 'Main St 1',
  '#city': 'Austin',
});

function fillAddress(fields: Record<string, string>): string[] {
  const filled: string[] = [];
  for (const selector in fields) {
    filled.push(`${selector}=${fields[selector]}`);
  }
  return filled;
}

// ── Проверки. Трогать нельзя ──────────────────────────────────────────────

const check = (label: string, condition: boolean, hint: string): void =>
  console.log(condition ? '✅' : '❌', label, condition ? '' : `— ${hint}`);

const src = (fn: (...args: never[]) => unknown): string => fn.toString();
const usesForOf = (fn: (...args: never[]) => unknown): boolean => /for\s*\(\s*const\s[^;]*?\sof\s/.test(src(fn));

const a = firstFailure(run);
check('A: найден первый упавший', a.id === 'C22041', `сейчас: ${a.id}`);
check('A: посмотрели ровно два кейса', a.checked === 2 && usesForOf(firstFailure) && !src(firstFailure).includes('forEach'),
  `сейчас: checked=${a.checked}, forEach ${src(firstFailure).includes('forEach') ? 'на месте' : 'убран'}`);

const b = labels(cases);
check('B: три подписи без undefined', JSON.stringify(b) === JSON.stringify(['[C157112]', '[C22041]', '[C19877]']), `сейчас: ${JSON.stringify(b)}`);
check('B: индекса больше нет', usesForOf(labels) && !/\[i\]/.test(src(labels)), 'цикл всё ещё ходит по индексу');

const c = fillAddress(address);
check('C: только собственные поля', JSON.stringify(c) === JSON.stringify(['#street=Main St 1', '#city=Austin']), `сейчас: ${JSON.stringify(c)}`);
check('C: ключ и значение сразу, через Object.entries', usesForOf(fillAddress) && src(fillAddress).includes('Object.entries') && !/\sin\s/.test(src(fillAddress)),
  'нужен for...of по Object.entries с деструктуризацией');

export {};
