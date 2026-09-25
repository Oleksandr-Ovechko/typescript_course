/**
 * Урок 10 · Циклы, которыми пишут каждый день.
 *
 * Что здесь: `for` со счётчиком как цикл-ретрай с потолком · `while` ·
 * `break` против `continue` · `for...of` против `forEach` · ранний выход
 * через `some` и `every` · `for...in` и почему по массиву им не ходят ·
 * перебор объекта через `Object.entries` и через `Object.keys` с индексом.
 *
 *   node lessons/lesson-10/examples/01-loops.ts     запустить
 *   yarn typecheck                                  проверить типы
 */

const pause = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

// ── Счётчик и потолок ─────────────────────────────────────────────────────
// Самая частая форма цикла в wl-e2e — повторить действие не больше N раз
// и выйти, как только получилось. Настоящий хелпер
// helpers/monolith/client-profile/add-relationship-page.ts:
//
//   for (let attempt = 0; attempt < 3; attempt++) {
//     await searchInput.fill(clientData);
//     await searchInput.press('Enter');
//     if (await resultItem.isVisible({ timeout: 5_000 }).catch(() => false)) {
//       break;
//     }
//   }
//
// Та же форма без Playwright. Три части заголовка:
//   let attempt = 0     — выполняется ОДИН раз, до первого прохода;
//   attempt < LIMIT     — проверяется ПЕРЕД каждым проходом;
//   attempt++           — выполняется ПОСЛЕ каждого прохода.
const LIMIT = 3;
let found = false;
for (let attempt = 0; attempt < LIMIT; attempt++) {
  console.log('1) попытка', attempt + 1, 'из', LIMIT);
  if (attempt === 1) {
    found = true;
    break;
  }
}
console.log('2) нашли:', found);

// Третьей попытки не было: вышли по break раньше, чем условие стало ложным.
// `let`, а не `const`, — потому что attempt++ меняет переменную.
//
// Потолок обязателен (правило W5): цикл без него не падает, а зависает,
// и тест умирает по общему таймауту с бесполезным сообщением.

// ── Цикл без счётчика ─────────────────────────────────────────────────────
// `while` берут, когда число проходов заранее неизвестно: есть условие,
// счётчика нет. Например, разобрать очередь, пока она не опустеет.
const queue = ['C157112', 'C22041', 'C19877'];
const handled: string[] = [];
while (queue.length > 0) {
  handled.push(queue.shift() as string);
}
console.log('3) while разобрал очередь:', handled, '· осталось:', queue.length);

// `while (true)` без break внутри — зависший процесс. Память при этом сама
// по себе не растёт (если в теле ничего не копится), зато ядро процессора
// занято целиком, и дальше не выполняется ничего — ни таймеры, ни промисы.
// В wl-e2e while — несколько сотен против девяти тысяч for: у теста почти
// всегда должен быть потолок.

// ── Прервать проход или весь цикл ─────────────────────────────────────────
// continue — «этот проход закончить, перейти к следующему».
// break    — «выйти из цикла совсем».
const codes = ['C157112', 'skip', 'C22041', 'C19877'];
const taken: string[] = [];
for (const code of codes) {
  if (code === 'skip') continue;
  if (taken.length === 2) break;
  taken.push(code);
}
console.log('4)', taken);

// 'skip' пропущен через continue и в taken не попал. На C19877 в taken уже
// два кода — сработал break, и C19877 тоже не попал.

// ── Конструкция языка против вызова функции ───────────────────────────────
// forEach принимает ФУНКЦИЮ и вызывает её на каждом элементе. return внутри
// выходит из этой функции, а не из перебора.
const suites = ['widgets', 'monolith', 'explorer'];
let count = 0;
suites.forEach((s) => {
  count += 1;
  if (s === 'monolith') return;
});
console.log('5) forEach прошёл:', count, '— return не остановил');

// for...of — конструкция языка, тело цикла принадлежит той же функции,
// в которой цикл написан. Поэтому работает break:
let countOf = 0;
for (const s of suites) {
  countOf += 1;
  if (s === 'monolith') break;
}
console.log('6) for...of прошёл:', countOf, '— break остановил');

// …и по той же причине работает await. Каждый проход честно ждёт предыдущий:
const clicked: string[] = [];
for (const s of suites) {
  await pause(5);
  clicked.push(s);
}
console.log('7) после for...of с await:', clicked.length, 'из 3');

// forEach с async-колбэком: каждый колбэк — отдельная асинхронная функция,
// forEach её не ждёт и возвращается сразу.
const clickedEach: string[] = [];
suites.forEach(async (s) => {
  await pause(5);
  clickedEach.push(s);
});
console.log('8) сразу после forEach с await:', clickedEach.length, 'из 3');
await pause(30);
console.log('9) через 30 мс:', clickedEach.length, 'из 3 — дописались, когда тест уже ушёл дальше');

// Так выглядит самая частая форма перебора в wl-e2e, цикл по локаторам
// (helpers/monolith/setup/staff/configure-instructor.ts):
//
//   for (const label of await page.locator('label.css-rs-form-week-select-list').all()) {
//     const input = label.locator('input[name="a_day[]"]');
//     if (!(await input.isChecked())) {
//       await label.click();
//     }
//   }
//
// На forEach это развалилось бы молча — ровно как строки 8 и 9 выше.
// Подробнее про эту ловушку — урок 5, 05-forgotten-await.ts.

// ── Ранний выход без цикла ────────────────────────────────────────────────
// Если нужен только ответ «есть ли такой», цикл писать не нужно.
// some останавливается на первом true, every — на первом false.
// Оба возвращают true/false, а не элемент: элемент возвращает find.
let looked = 0;
const hasMonolith = suites.some((s) => {
  looked += 1;
  return s === 'monolith';
});
console.log('10) some:', hasMonolith, '— просмотрел', looked, 'из', suites.length);

let checked = 0;
const allShort = suites.every((s) => {
  checked += 1;
  return s.length < 8;
});
console.log('11) every:', allShort, '— просмотрел', checked, '(остановился на первом false: monolith)');
console.log('12) find:', suites.find((s) => s === 'monolith'), '— а вот find отдаёт сам элемент');

// ── Перебор объекта ───────────────────────────────────────────────────────
// for...in перебирает КЛЮЧИ объекта. У массива ключи — индексы, и это строки.
const viaIn: unknown[] = [];
for (const k in suites) viaIn.push(k, typeof k);
console.log('13)', viaIn);

// Поэтому по массиву ходят for...of. А вот на объекте for...in работает
// по назначению — но отдаёт только ключи, за значением надо лезть обратно:
const timeouts = { short: 5_000, medium: 10_000, long: 15_000 };
for (const key in timeouts) {
  console.log('14) for...in:', key, '→', timeouts[key as keyof typeof timeouts]);
}

// `key as keyof typeof timeouts` — не украшение. for...in типизирует ключ
// как string (у объекта в рантайме могут оказаться и чужие ключи), и без
// приведения timeouts[key] не компилируется.
//
// Как пишут в проекте — Object.entries отдаёт пары [ключ, значение],
// деструктуризация раскладывает пару по двум переменным:
for (const [key, ms] of Object.entries(timeouts)) {
  console.log('15) Object.entries:', key, '→', ms);
}

// Так в wl-e2e больше полутора сотен циклов, например
// helpers/monolith/client-profile/billing-account-balance-page.ts:
//
//   for (const [selector, value] of Object.entries(addressFields)) {
//     await page.locator(selector).fill(value);
//   }
//
// Третий способ — обычный for по списку ключей. Работает, но букв больше всего:
const keys = Object.keys(timeouts) as (keyof typeof timeouts)[];
for (let i = 0; i < keys.length; i++) {
  const key = keys[i];
  console.log('16) Object.keys + индекс:', key, '→', timeouts[key]);
}

// Итого: по массиву — for...of, по объекту — Object.entries. for...in в wl-e2e
// не встречается ни разу; его надо уметь прочитать в чужом коде.

export {};
