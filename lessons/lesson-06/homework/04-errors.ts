/**
 * Домашка урока 6 · Задание 4 — бросить ошибку и поймать её в цикле.
 *
 * Готово, когда: тела parseQuantity и sumQuantities написаны, файл печатает
 * восемь `true`, `yarn typecheck:hw6` без ошибок. На вопрос в конце есть ответ.
 *
 *   node lessons/lesson-06/homework/04-errors.ts
 *   yarn typecheck:hw6
 *
 * Сейчас обе функции возвращают заглушки — часть проверок печатает false.
 */

// А. Превратить текст в количество. Если получилось не число
//    (Number.isNaN, урок 2) или число меньше нуля — БРОСИТЬ ошибку:
//      не число      → new Error('не число: ' + text)
//      меньше нуля   → new Error('меньше нуля: ' + text)
//    Иначе вернуть число.
function parseQuantity(text: string): number {
  return 0;
}

// Б. Сложить все количества из списка. Плохие строки НЕ обрывают подсчёт:
//    их пропускаем, а сообщение ошибки дописываем в skipped.
//    Вернуть объект { sum, skipped }.
//    Сообщение доставайте через String(error) — почему не error.message,
//    в конспекте, раздел «В catch — unknown».
function sumQuantities(list: string[]): { sum: number; skipped: string[] } {
  return { sum: 0, skipped: [] };
}

function throwsWith(action: () => void, message: string): boolean {
  try {
    action();
    return false;
  } catch (error) {
    return String(error) === 'Error: ' + message;
  }
}

console.log('1)', parseQuantity('3') === 3);
console.log('2)', parseQuantity('0') === 0);
console.log('3)', throwsWith(() => parseQuantity('три'), 'не число: три'));
console.log('4)', throwsWith(() => parseQuantity('-2'), 'меньше нуля: -2'));

const result = sumQuantities(['3', 'три', '4', '-2', '1']);
console.log('5)', result.sum === 8);
console.log('6)', result.skipped.join(' | ') === 'Error: не число: три | Error: меньше нуля: -2');
console.log('7)', sumQuantities(['5']).skipped.length === 0);
console.log('8)', sumQuantities([]).sum === 0);

// Вопрос (ответ — комментарием здесь же). Допустим, в sumQuantities try
// стоит не внутри цикла, а снаружи, вокруг всего for...of. Какие sum
// и skipped получатся для ['3', 'три', '4', '-2', '1'] и почему?
// Проверьте: перенесите try, запустите, верните обратно.

export {};
