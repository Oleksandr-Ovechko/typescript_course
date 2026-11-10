/**
 * Домашка урока 2 · Задание 1 — предсказать вывод.
 *
 * Готово, когда: напротив каждой строки с `// →` записан прогноз и одна фраза
 * «почему», файл запущен и прогнозы сверены. Там, где не совпало, — приписка,
 * в чём ошиблись.
 *
 * Прогноз пишется ДО запуска. Смысл не в том, чтобы угадать, а в том, чтобы
 * поймать место, где ваше представление о языке расходится с тем, что он
 * делает на самом деле.
 *
 *   node lessons/lesson-02/homework/01-predict-output.ts
 *
 * Строки идут вперемешку по всем пяти темам урока.
 */

const spots = 3;
const code = '  C19633 ';
code.trim();
const emptyCell = '';
const zeroCell = 0;
const nameCell = 'Ann';

console.log('1)', typeof null, typeof []);                              // →
console.log('2)', '7' + 3, 7 + 3 + '1');                                // →
console.log('3)', `мест: ${spots + 1}`, 'мест: ${spots + 1}');          // →
console.log('4)', Boolean('0'), Boolean(0), Boolean([]));               // →
console.log('5)', emptyCell || 'пусто', zeroCell || 'пусто', nameCell || 'пусто'); // →
console.log('6)', null == undefined, null === undefined);               // →
console.log('7)', `[${code}]`);                                         // →
console.log('8)', 'a-b-c'.replace('-', '+'));                           // →
console.log('9)', '🙂'.length, 'ok'.length);                            // →
console.log('10)', 0.1 + 0.2 === 0.3, 0.25 + 0.5 === 0.75);             // →
console.log('11)', Number(''), parseFloat(''), parseInt('9.99'));       // →
console.log('12)', typeof (5).toFixed(1), (5).toFixed(1) + 1);          // →

export {};
