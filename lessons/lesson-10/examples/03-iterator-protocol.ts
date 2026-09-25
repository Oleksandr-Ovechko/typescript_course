/**
 * Урок 10 · Протокол итератора.
 *
 * Что здесь: метод [Symbol.iterator] и next() руками · свой перебираемый
 * объект · почему его можно перебрать дважды · спред, деструктуризация,
 * Array.from и Set — один и тот же протокол под разными записями.
 *
 *   node lessons/lesson-10/examples/03-iterator-protocol.ts   запустить
 *   yarn typecheck                                            проверить типы
 */

// ── Что внутри for...of ───────────────────────────────────────────────────
// «Умеет отдавать элементы по одному» — не метафора, а метод с конкретным
// именем. Имя — не строка, а символ Symbol.iterator (что это — в 06).
// Метод возвращает ИТЕРАТОР: объект с методом next().
const suites = ['widgets', 'monolith', 'explorer'];
const it = suites[Symbol.iterator]();

// Каждый next() отдаёт { value, done }:
console.log('1)', it.next());
console.log('2)', it.next());
console.log('3)', it.next());
console.log('4)', it.next());

// На третьем вызове отдан последний элемент, а done всё ещё false: итератор
// массива не заглядывает вперёд. done: true приходит отдельным, четвёртым
// вызовом, и value в нём undefined.
//
// Итератор одноразовый: кончился — так и останется.
console.log('5) ещё раз:', it.next());

// Вот и весь for...of: взять итератор, звать next(), пока не придёт done: true.
// Руками то же самое выглядит так:
const iter = suites[Symbol.iterator]();
const collected: string[] = [];
for (let step = iter.next(); !step.done; step = iter.next()) {
  collected.push(step.value);
}
console.log('6) цикл руками:', collected);

// ── Свой перебираемый объект ──────────────────────────────────────────────
// Раз это договорённость, её можно выполнить самому. Обычный объект,
// не массив — но с методом [Symbol.iterator].
const attempts = {
  limit: 3,
  // Квадратные скобки — вычисляемое имя: имя метода берётся из значения
  // Symbol.iterator, а не из букв «Symbol.iterator».
  [Symbol.iterator](): Iterator<string> {
    let n = 0; // свой счётчик на КАЖДЫЙ вызов метода — живёт в замыкании (урок 6)
    const limit = this.limit; // this — сам attempts: метод вызван через него
    return {
      next: () => {
        if (n < limit) {
          n += 1;
          return { value: `попытка ${n}`, done: false };
        }
        return { value: undefined, done: true };
      },
    };
  },
};

console.log('7)', [...attempts]);

// Перебираем второй раз — и снова с начала. Спред позвал [Symbol.iterator]()
// заново, завёлся новый n. С массивом так же: каждый for...of получает свой итератор.
console.log('8) второй раз:', [...attempts]);

// На уроке это было записано в одну строку:
//
//   return { next: () => (n < this.limit ? { value: `попытка ${++n}`, done: false } : { value: undefined, done: true }) };
//
// Внутри те же четыре вещи: объект с next · стрелка, у которой скобки вокруг
// тела, потому что она возвращает объект · тернарник · ++n, который сначала
// увеличивает, потом подставляет (с n++ первой была бы «попытка 0»).

// ── Один протокол, четыре записи ──────────────────────────────────────────
// Всё ниже работает только потому, что у attempts есть [Symbol.iterator].
// Никаких других свойств ни одна из записей не читает.
const [first, ...rest] = attempts;
console.log('9) деструктуризация:', first, '· в rest', rest.length, '—', rest);
console.log('10) Array.from:', Array.from(attempts));
console.log('11) new Set:', new Set(attempts).size, 'элемента');
for (const a of attempts) console.log('12) for...of:', a);

// Обратите внимание на 9: в rest попали значения, которые отдал итератор,
// а не свойства объекта. Свойства limit там нет, как нет и самого метода:
// деструктуризация массива вообще не смотрит на свойства, она зовёт next().

export {};
