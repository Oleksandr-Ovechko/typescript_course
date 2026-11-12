/**
 * Домашка урока 3 · Задание 1 — предсказать вывод.
 *
 * Готово, когда: напротив каждой строки с `// →` записан прогноз и одна фраза
 * «почему», файл запущен и прогнозы сверены. Там, где не совпало, — приписка,
 * в чём ошиблись.
 *
 * Прогноз пишется ДО запуска. Смысл не в том, чтобы угадать, а в том, чтобы
 * поймать место, где ваше представление о языке расходится с тем, что он
 * делает на самом деле.
 *
 *   node lessons/lesson-03/homework/01-predict-output.ts
 *
 * Сначала прочитайте код до строки 1), потом прогнозируйте строки по порядку.
 */

const pageSize: number = 0;
const filter: string | null = null;
const query: string = '';
const typedName: string = '';
const total: number = 15;
const durationMs: number = 500;

const unit: string = 'Day(s)';
let days = 0;
switch (unit) {
  case 'Day(s)':
    days = days + 1;
  case 'Week(s)':
    days = days + 7;
    break;
  case 'Month(s)':
    days = days + 30;
}

const rows = ['C1', 'C2', 'C3'];
let passes = 0;
for (let index = 1; index <= rows.length; index++) {
  passes++;
}

console.log('1)', '100' < '20', 100 < 20);                                    // →
console.log('2)', Boolean('0'), Boolean(''), Boolean(' '), Boolean('false')); // →
console.log('3)', 'Zebra' < 'apple', 'ёж' > 'яма');                           // →
console.log('4)', pageSize || 20, pageSize && 20);                            // →
console.log('5)', typedName && 'есть имя', typedName || 'гость');             // →
console.log('6)', !(total > 10), total > 10 && total < 20 && total);          // →
console.log('7)', pageSize ?? 20, pageSize || 20, filter ?? 'все', `[${query ?? 'все'}]`); // →
console.log('8)', durationMs < 3000 ? 'нормально' : durationMs < 1000 ? 'быстро' : 'медленно'); // →
console.log('9)', days);                                                      // →
console.log('10)', rows.length, rows[rows.length], rows[rows.length - 1]);    // →
console.log('11)', passes);                                                   // →
for (const key in rows) {
  console.log('12)', key + 1);                                                // →
}

export {};
