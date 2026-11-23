/**
 * Домашка урока 4 · Задание 1 — предсказать вывод.
 *
 * Готово, когда: напротив каждой строки с `// →` записан прогноз и одна фраза
 * «почему», файл запущен и прогнозы сверены. Там, где не совпало, — приписка,
 * в чём ошиблись.
 *
 * Прогноз пишется ДО запуска. Смысл не в том, чтобы угадать, а в том, чтобы
 * поймать место, где ваше представление о языке расходится с тем, что он
 * делает на самом деле.
 *
 *   node lessons/lesson-04/homework/01-predict-output.ts
 *
 * Сначала прочитайте весь код до строки 1), потом прогнозируйте по порядку.
 * Строки без номера тоже печатаются — их место в выводе тоже часть прогноза.
 */

function shout(text: string) {
  text.toUpperCase();
}

function logAndReturn(n: number): number {
  console.log('   внутри', n);
  return n;
}

function greetWith(name: string, greeting = 'Привет'): string {
  return `${greeting}, ${name}`;
}

function addTax(price: number, ratePercent = 10): number {
  return price + (price * ratePercent) / 100;
}

function countAll(...items: number[]): number {
  return items.length;
}

const scores = [4, 8, 15];
const half = ((n: number): number => n / 2)(10);

{
  var fromBlock = 'протекла';
}
for (var round = 0; round < 3; round++) {}

function countDown(n: number): string {
  return n <= 0 ? 'старт' : `${n} ${countDown(n - 2)}`;
}

console.log('1)', shout('hi'));                                                   // →
console.log('2)', logAndReturn(1), logAndReturn(2));                              // →
console.log('3)', greetWith('Ann'), '|', greetWith('Bob', undefined), '|', greetWith('Eve', '')); // →
console.log('4)', addTax(200), addTax(200, 0));                                   // →
console.log('5)', countAll(), countAll(scores.length), countAll(...scores), countAll(scores[0])); // →
console.log('6)', Math.max(...scores), [...scores, 16, 23].length, scores.length); // →
console.log('7)', typeof half, half);                                             // →
console.log('8)', typeof greetWith, typeof greetWith('Kim'));                     // →
console.log('9)', fromBlock, round);                                              // →
console.log('10)', tripleEarly(3));                                               // →
console.log('11)', countDown(5));                                                 // →

function tripleEarly(n: number): number {
  return n * 3;
}

const label = 'снаружи';
{
  const label = 'внутри';
  console.log('12)', label);                                                      // →
}
console.log('13)', label);                                                        // →

export {};
