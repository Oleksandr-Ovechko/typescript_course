/**
 * Домашка урока 4 · Задание 1 — предсказать вывод.
 *
 * Готово, когда: напротив каждой строки с `// →` записан прогноз и одна фраза
 * «почему», файл запущен и прогнозы сверены. Там, где не совпало, — приписка,
 * в чём ошиблась модель. Без объяснения задание не засчитывается.
 *
 * Прогноз пишется ДО запуска. Смысл не в том, чтобы угадать строку, а в том,
 * чтобы поймать место, где ваша модель расходится с реальностью.
 *
 *   node lessons/lesson-04/homework/01-predict-output.ts
 *
 * Строки идут вперемешку по всем пяти блокам урока. `as unknown as …` стоит
 * там, где иначе компилятор не пропустил бы заведомо странный код, — в рантайме
 * его нет (см. «Зачем приведение двойное» в конспекте).
 * Осторожно: одна пара строк печатается НЕ там, где написана.
 */

console.log('1)', typeof null);                                         // →
console.log('2)', '7' + 3);                                             // →
console.log('3)', [2, 10, 1].sort());                                   // →
console.log('4)', 0.1 + 0.2 === 0.3);                                   // →
console.log('5)', Boolean('false'));                                    // →

for (var k = 0; k < 2; k++) setTimeout(() => console.log('6)', k));     // →

console.log('7)', parseInt('9.99'));                                    // →
console.log('8)', ('7' as unknown as number) - 3);                      // →
console.log('9)', 'a-b-c'.replace('-', '+'));                           // →
console.log('10)', typeof (5).toFixed(1));                              // →
console.log('11)', ('' as unknown) == '0');                             // →
console.log('12)', Number(''));                                         // →
console.log('13)', '🙂'.length);                                        // →
console.log('14)', 1 + 2 + '3');                                        // →
console.log('15)', Number.isNaN('abc'), isNaN('abc' as unknown as number)); // →

const spots = [3, 0, 12];
console.log('16)', spots[5] + 1);                                       // →

const base = { tags: ['smoke'] };
const copy = { ...base };
copy.tags.push('regression');
console.log('17)', base.tags);                                          // →

console.log('18)', ([] as unknown) == false);                           // →
console.log('19)', (1.005).toFixed(2) + 1);                             // →

const list = [1];
list.push(2);
console.log('20)', list);                                               // →

export {};
