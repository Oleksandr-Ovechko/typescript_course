/**
 * Урок 5 · Уточнения — места, где на занятии прозвучала неточность.
 *
 * Что здесь: промис и синхронный исполнитель · `await` над готовым промисом ·
 * порядок в цепочке · очереди во времени · `await` останавливает функцию,
 * а не программу · `forEach` и async · `.catch` на успехе · поля `Error` ·
 * метод промиса против функции `Promise`.
 *
 *   node lessons/lesson-05/examples/00-corrections.ts     запустить
 *   yarn typecheck                                        проверить типы
 *
 * Читать этот файл первым: дальше по примерам всё написано уже правильно.
 */

const pause = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

// ── Промис — не «асинхронный код». Исполнитель работает синхронно ──────────
// На занятии прозвучало, что промис асинхронен «точно так же, как setTimeout».
// Функция-исполнитель выполняется прямо в момент new Promise, до всякого await.
console.log('1) до создания промиса');
const started = new Promise<string>((resolve) => {
  console.log('2) тело промиса — прямо здесь, синхронно');
  resolve('готово');
});
console.log('3) после создания промиса');
console.log('4)', await started);

// Асинхронен не промис, а продолжение — то, что навешено через .then или await.
// Формулировка, которая не спорит сама с собой:
//   промис — это не асинхронный код, это способ дождаться асинхронного кода.

// ── await над готовым промисом всё равно откладывает продолжение ───────────
// Прозвучало «Promise.resolve — эта строка будет вести себя как синхронная».
// Не будет: продолжение уходит в очередь микрозадач, и синхронный код обгоняет.
async function readyMade(): Promise<void> {
  console.log('5) внутри функции, до await');
  await Promise.resolve();
  console.log('7) внутри функции, после await Promise.resolve()');
}
void readyMade();
console.log('6) синхронный код после вызова — обогнал');
await pause(10);

// ── Порядок в цепочке имеет значение ──────────────────────────────────────
// На вопрос «важен ли порядок, могу я поставить сначала .finally?» прозвучало
// «без разницы». Разница есть, и её видно на любой цепочке из трёх звеньев.
const brokenCleanup = (): void => {
  throw new Error('в finally тоже сломалось');
};

console.log(
  '8) .catch().finally() →',
  await Promise.reject(new Error('первая'))
    .catch((error: Error) => `поймали: ${error.message}`)
    .finally(brokenCleanup)
    .catch((error: Error) => `наружу ушло: ${error.message}`),
);

console.log(
  '9) .finally().catch() →',
  await Promise.reject(new Error('первая'))
    .finally(brokenCleanup)
    .catch((error: Error) => `поймали: ${error.message}`),
);

// С .then расхождение ещё нагляднее: .catch в середине цепочки гасит отказ,
// и следующий .then получает подставленное значение.
console.log('10) .catch().then() →', await Promise.reject(new Error('бум')).catch(() => 1).then((n) => `then увидел ${n}`));
console.log('11) .then().catch() →', await Promise.reject(new Error('бум')).then((n) => `then увидел ${n}`).catch(() => 'catch поймал'));

// ── Очереди: считать надо по времени, а не по порядку строк ────────────────
// Прозвучало: «после синхронного кода дожидаемся паузы, потом выводим промис,
// и только потом setTimeout». Печатается действительно 12-13-14, но промис
// и setTimeout срабатывают ДО того, как пауза закончилась.
const t0 = Date.now();
const at = (): string => `t≈${Math.round((Date.now() - t0) / 50) * 50}мс`;

async function orderDemo(): Promise<void> {
  setTimeout(() => console.log('14) setTimeout —', at()));
  void Promise.resolve().then(() => console.log('13) микрозадача —', at()));
  console.log('12) синхронный код —', at());
  await pause(50);
  console.log('15) после await pause(50) —', at());
}
await orderDemo();

// ── await останавливает функцию, а не программу ────────────────────────────
// Прозвучало «await приостанавливает выполнение программы» и сравнение
// с точкой останова в отладчике. Брейкпойнт замораживает процесс, await — нет:
// пока функция ждёт, всё остальное продолжает работать.
let ticks = 0;
const timer = setInterval(() => {
  ticks += 1;
}, 10);
console.log('16) до await, тиков:', ticks);
await pause(100);
console.log('17) после await pause(100), тиков:', ticks, '← фоновая работа шла всё это время');
clearInterval(timer);


// ── forEach вызывает async-колбэк, просто не ждёт его ──────────────────────
// Прозвучало «forEach не может вызывать асинхронные функции». Вызывает —
// и в этом вся беда: код выглядит рабочим.
const trace: string[] = [];
['a', 'b'].forEach(async (name) => {
  trace.push(`вызван ${name}`);
  await pause(10);
  trace.push(`доработал ${name}`);
});
trace.push('forEach вернул управление');
await pause(40);
console.log('18)', trace);

// И вывод «не пользуйтесь forEach, берите for...of» слишком широк.
// В wl-e2e 84 вызова .forEach( — и все в порядке, потому что .forEach(async
// там ноль. Правило не про forEach, а про forEach вместе с async.

// ── .catch на успешном промисе не вызывается вовсе ─────────────────────────
// Прозвучало «error там будет undefined» — как будто колбэк запускается
// и получает пустой аргумент. Он не запускается.
await Promise.resolve('успех')
  .then((value) => console.log('19) then получил:', value))
  .catch((error: unknown) => console.log('   catch вызвался, error =', error));
console.log('20) строки про catch выше нет — колбэк не запускался');

// ── Поля Error: name, message, cause, stack ────────────────────────────────
// Прозвучало «cause — причина ошибки, то есть ReferenceError». ReferenceError
// это name. cause — вложенная ошибка, её передают вторым аргументом.
const wrapped = new Error('запрос не прошёл', { cause: new Error('сеть недоступна') });
console.log('21) name   :', wrapped.name);
console.log('22) message:', wrapped.message);
console.log('23) cause  :', (wrapped.cause as Error).message, '← вложенная ошибка, не тип');

try {
  (undefined as unknown as { x: number }).x;
} catch (error) {
  console.log('24) а вот здесь name =', (error as Error).name);
}

// ── «Метод промиса» и «функция Promise» — разные вещи ──────────────────────
// На занятии all, race и any были названы методами промиса. Методов у промиса
// ровно три: then, catch, finally. Всё остальное висит на самом слове Promise.
console.log('25) Promise.all           :', typeof Promise.all);
console.log('26) у самого промиса .all :', typeof (Promise.resolve() as unknown as Record<string, unknown>)['all']);

// ❌ TS2339: Property 'all' does not exist on type 'Promise<void>'.
// Promise.resolve().all([]);

export {};
