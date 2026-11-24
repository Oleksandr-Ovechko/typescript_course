/**
 * Домашка урока 5 · Задание 3 — копия, которая не портит оригинал.
 *
 * Готово, когда: тела withName и withCity написаны, файл печатает восемь
 * `true`, `yarn typecheck:hw5` без ошибок. На вопрос в конце есть ответ.
 *
 *   node lessons/lesson-05/homework/03-copy.ts
 *   yarn typecheck:hw5
 *
 * Обе функции возвращают НОВЫЙ объект с изменением, а переданный оставляют
 * как был. Без structuredClone и JSON — через `...`.
 *
 * Сейчас обе возвращают сам переданный объект — часть проверок печатает false.
 */

// А. Копия person, у которой name заменён на новый.
function withName(
  person: { name: string; address: { city: string } },
  name: string,
): { name: string; address: { city: string } } {
  return person;
}

// Б. Копия person, у которой address.city заменён на новый.
//    Подумайте, что скопирует `...` на втором уровне.
function withCity(
  person: { name: string; address: { city: string } },
  city: string,
): { name: string; address: { city: string } } {
  return person;
}

const ann = { name: 'Ann', address: { city: 'Kyiv' } };

const renamed = withName(ann, 'Anna');
console.log('1)', renamed.name === 'Anna');
console.log('2)', ann.name === 'Ann');
console.log('3)', renamed !== ann);

const moved = withCity(ann, 'Lviv');
console.log('4)', moved.address.city === 'Lviv');
console.log('5)', ann.address.city === 'Kyiv');
console.log('6)', moved.name === 'Ann');
console.log('7)', moved !== ann);
console.log('8)', moved.address !== ann.address);

// Вопрос (ответ — комментарием здесь же). Допустим, withCity написана так:
//   const copy = { ...person }; copy.address.city = city; return copy;
// Какие проверки напечатают false и почему? Что именно скопировал `...`
// в свойство address?

export {};
