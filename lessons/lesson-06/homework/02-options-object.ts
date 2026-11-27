/**
 * Домашка урока 6 · Задание 2 — функция с одним объектом-параметром.
 *
 * Готово, когда: makeGreeting написана, файл печатает восемь `true`,
 * `yarn typecheck:hw6` без ошибок. На вопрос в конце есть ответ.
 *
 *   node lessons/lesson-06/homework/02-options-object.ts
 *   yarn typecheck:hw6
 *
 * Ниже — старая функция с тремя параметрами по позиции. Неудобно: чтобы
 * поменять только ending, приходится явно передавать и greeting.
 * Напишите makeGreeting — то же самое, но с ОДНИМ параметром-объектом:
 * разберите его шаблоном прямо в скобках и задайте умолчания там же.
 * Пример такой функции — formatPrice в конспекте.
 *
 * Сейчас makeGreeting возвращает пустую строку — часть проверок печатает false.
 */

function greetOld(name: string, greeting: string = 'Привет', ending: string = '!'): string {
  return `${greeting}, ${name}${ending}`;
}
console.log('0)', greetOld('Ann'), '|', greetOld('Bob', 'Привет', '?')); // 0) Привет, Ann! | Привет, Bob?

// Тип параметра не меняйте — меняйте то, что стоит на месте имени options,
// и тело функции.
function makeGreeting(options: { name: string; greeting?: string; ending?: string }): string {
  return '';
}

console.log('1)', makeGreeting({ name: 'Ann' }) === 'Привет, Ann!');
console.log('2)', makeGreeting({ name: 'Bob', ending: '?' }) === 'Привет, Bob?');
console.log('3)', makeGreeting({ name: 'Kate', greeting: 'Хай' }) === 'Хай, Kate!');
console.log('4)', makeGreeting({ ending: '.', name: 'Max', greeting: 'Hello' }) === 'Hello, Max.');
console.log('5)', makeGreeting({ name: 'Ann', greeting: undefined }) === 'Привет, Ann!');
console.log('6)', makeGreeting({ name: 'Ann', ending: '' }) === 'Привет, Ann');

// Объект можно собрать заранее и передать целиком. Функция его не меняет:
// умолчания живут в её переменных, а не дописываются в объект.
const options = { name: 'Bob', greeting: 'Йо' };
console.log('7)', makeGreeting(options) === 'Йо, Bob!');
console.log('8)', options.greeting === 'Йо' && Object.keys(options).length === 2);

// Вопрос (ответ — комментарием здесь же). Проверки 5 и 6 похожи: в обеих
// свойство «есть, но пустое». Почему в 5 сработало умолчание, а в 6 — нет?
// Что напечатала бы проверка 6, если бы умолчание срабатывало и на ''?

export {};
