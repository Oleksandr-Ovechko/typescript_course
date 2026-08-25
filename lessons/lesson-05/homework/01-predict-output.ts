/**
 * Домашка урока 5 · Задание 1 — предсказать вывод.
 *
 * Готово, когда: напротив каждой строки с `// →` записан прогноз, файл запущен
 * и прогнозы сверены. Там, где не совпало, — приписка почему.
 *
 * Прогноз пишется ДО запуска. Смысл не в том, чтобы угадать строку, а в том,
 * чтобы поймать место, где ваша модель исполнения расходится с реальностью.
 * Без объяснения задание не засчитывается.
 *
 *   node lessons/lesson-05/homework/01-predict-output.ts
 *
 * Осторожно: часть строк печатается НЕ в том порядке, в каком написана.
 * Предсказывать нужно и значение, и порядок — где именно строка появится
 * в выводе. Для порядка удобно проставить номера: 1, 2, 3…
 */

const pause = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
const round = (ms: number): number => Math.round(ms / 50) * 50;

// ── Блок 1. Промис ─────────────────────────────────────────────────────────

const p1 = new Promise<string>((resolve) => {
  console.log('A');                                   // →
  resolve('B');
});
console.log('C');                                     // →
console.log(await p1);                                // →

let calls = 0;
const p2 = new Promise<number>((resolve) => {
  calls += 1;
  setTimeout(() => resolve(10), 20);
});
console.log(await p2, await p2, calls);                // →

const p3 = new Promise<string>((resolve) => {
  resolve('первое');
  resolve('второе');
});
console.log(await p3);                                 // →

console.log(typeof pause(10));                         // →

// ── Блок 2. Три метода и цепочка ───────────────────────────────────────────

console.log(await Promise.resolve(3).then((n) => n * 2));                        // →
console.log(await Promise.resolve('X').finally(() => 'Y'));                      // →
console.log(await Promise.reject(new Error('!')).catch(() => 'Z'));              // →

console.log(await Promise.reject(new Error('!')).catch(() => 1).then((n) => n + 1));   // →
console.log(await Promise.reject(new Error('!')).then((n) => n).catch(() => 'поймали')); // →

// ── Блок 3. Очереди ────────────────────────────────────────────────────────

async function queues(): Promise<void> {
  setTimeout(() => console.log('D'));                  // →
  void Promise.resolve().then(() => console.log('E')); // →
  console.log('F');                                    // →
  await pause(50);
  console.log('G');                                    // →
}
await queues();

// ── Блок 4. Забытый await ──────────────────────────────────────────────────

let ready = false;
async function prepare(): Promise<void> {
  await pause(20);
  ready = true;
}

async function run(): Promise<void> {
  prepare();
  console.log('сразу:', ready);                        // →
  await pause(40);
  console.log('потом:', ready);                        // →
}
await run();

const collected: string[] = [];
['a', 'b'].forEach(async (name) => {
  await pause(10);
  collected.push(name);
});
console.log('после forEach:', collected);              // →
await pause(40);
console.log('через 40 мс :', collected);               // →

// ── Блок 5. Несколько промисов сразу ───────────────────────────────────────

const startA = Date.now();
await pause(100);
await pause(100);
console.log('два await подряд, мс:', round(Date.now() - startA));   // →

const startB = Date.now();
await Promise.all([pause(100), pause(100)]);
console.log('Promise.all, мс     :', round(Date.now() - startB));   // →

const readyPair = [pause(100), pause(100)];
const startC = Date.now();
for (const one of readyPair) {
  await one;
}
console.log('цикл по готовым, мс :', round(Date.now() - startC));   // →

const rejectAfter = (ms: number, message: string): Promise<never> =>
  new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms));

console.log(
  await Promise.race([pause(60).then(() => 'медленный успех'), rejectAfter(20, 'быстрый отказ')])
    .catch((error: Error) => `race: ${error.message}`),
);                                                     // →

console.log(
  await Promise.any([rejectAfter(20, 'быстрый отказ'), pause(60).then(() => 'медленный успех')]),
);                                                     // →

// ВОПРОС. Три замера выше — 200, 100 и снова 100 миллисекунд. В последнем случае
// цикл с `await` внутри, то есть ждём по очереди, — а времени ушло столько же,
// сколько на `Promise.all`. Почему?
//
// ОТВЕТ:

export {};
