/**
 * Урок 10 · Итерируемое и массивоподобное.
 *
 * Что здесь: два разных свойства — «умеет отдавать элементы по одному»
 * и «есть length и числовые индексы» · что умеет Array.from и чего не умеет
 * спред · Array.from({ length: N }, fn) · строка и Set тоже итерируемы ·
 * почему в wl-e2e повсюду Array.from над DOM-коллекциями.
 *
 *   node lessons/lesson-10/examples/02-iterable-and-array-like.ts   запустить
 *   yarn typecheck                                                  проверить типы
 */

// ── Два разных свойства ───────────────────────────────────────────────────
// Итерируемый объект умеет отдавать элементы по одному: с ним работают
// for...of, спред [...x], деструктуризация и Array.from.
//
// Массивоподобный объект — это length плюс числовые ключи 0, 1, 2…
// Методов массива (map, filter, find) у него нет.
//
// Свойства независимы. Бывает одно без другого и оба сразу:
//
//   массив                      итерируемый  + массивоподобный + методы массива
//   NodeList, select.options    итерируемый  + массивоподобный, методов нет
//   Set                         итерируемый, без length и индексов
//   { length: 2, 0: 'a', … }    только массивоподобный
//
// Замер на живой странице в браузере:
//
//   select.options — что это         [object HTMLOptionsCollection]
//   select.options итерируемый?      true
//   select.options.map есть?         undefined
//   querySelectorAll — что это       [object NodeList]
//   querySelectorAll.map есть?       undefined
//
// То есть перебрать можно, а методов массива нет. У NodeList есть forEach —
// исключение, но он ничего не возвращает. map, filter и find нет ни у кого из двух.

// ── Array.from умеет больше, чем спред ────────────────────────────────────
// Объект, у которого есть только length и числовые ключи:
const arrayLike = { length: 2, 0: 'первый', 1: 'второй' } as ArrayLike<string>;

// Array.from хватает length и индексов:
console.log('1)', Array.from(arrayLike));

// Спред требует итерируемое — массивоподобного ему мало:
// ❌ TS2488: Type 'ArrayLike<string>' must have a '[Symbol.iterator]()' method that returns an iterator.
// console.log([...arrayLike]);

// В рантайме это TypeError: arrayLike is not iterable — та же мысль, только
// уже при падении. Компилятор ловит её раньше.

// ── Массив заданной длины ─────────────────────────────────────────────────
// Второй аргумент Array.from — функция-преобразователь, вызывается на каждом
// элементе. Первый её параметр — сам элемент, второй — индекс. Здесь элементов
// нет (у { length: 3 } только длина), поэтому первый параметр пропускаем
// подчёркиванием.
console.log('2)', Array.from({ length: 3 }, (_, i) => `попытка ${i + 1}`));

// Идиома «сделать массив на N элементов». Не устаревшая: Array.from появился
// в ES2015, в одной редакции со спредом, for...of и генераторами.

// ── Строка и Set тоже итерируемы ──────────────────────────────────────────
console.log('3)', [...'C157112'].join(' '), '→', [...'C157112'].length, 'символов');
console.log('4)', [...new Set(['widgets', 'monolith', 'widgets'])], '— дедупликация через Set');
const [firstLetter, ...otherLetters] = 'C157112';
console.log('5) деструктуризация строки:', firstLetter, '+', otherLetters.length, 'символов');

// Спред строки разбирает её по настоящим символам — отсюда и правильный
// счёт эмодзи из урока 4.

// ── Почему в проекте Array.from, а не спред ───────────────────────────────
// В wl-e2e Array.from — больше двух тысяч вызовов, почти все над
// DOM-коллекциями внутри page.evaluate: Array.from(select.options),
// Array.from(document.querySelectorAll(...)).
//
// В браузере [...document.querySelectorAll('a')] работает. Но компилятор
// об этом не знает. В tsconfig проекта (и этого курса — он копия):
//
//   "lib": ["ES2022", "DOM"]
//
// Нет "DOM.Iterable" — а в TypeScript 5.9, который стоит в проекте, именно
// там объявлено, что NodeList и HTMLOptionsCollection итерируемы. Для него
// они только массивоподобные. Значит, спред и for...of — ошибка типов,
// а Array.from, которому хватает ArrayLike, проходит.
//
// ⚠️ В VS Code две строки с ❌ ниже, раскомментированные, НЕ подчеркнутся.
// Редактор проверяет встроенным TypeScript 6.0, а в 6.0 "DOM.Iterable" влили
// в "DOM" — там NodeList итерируем при любом lib. Ошибку покажет только
// yarn typecheck, то есть та проверка, которая решает судьбу PR.
// Чтобы редактор видел то же: Ctrl+Shift+P → «TypeScript: Select TypeScript
// Version» → «Use Workspace Version».
//
// Функция ниже нигде не вызывается: document в ноде нет, и код нужен
// только для того, чтобы его проверил компилятор.
function inBrowserOnly(): void {
  const inputs = document.querySelectorAll<HTMLInputElement>('input.js-cell-phone');
  const select = document.querySelector('select');

  // Так в проекте и пишут — компилируется:
  const values = Array.from(inputs).map((el) => el.value);
  const labels = select ? Array.from(select.options).map((o) => o.text) : [];
  void values;
  void labels;

  // ❌ TS2488: Type 'NodeListOf<HTMLInputElement>' must have a '[Symbol.iterator]()' method that returns an iterator.
  // const spread = [...inputs];

  // ❌ TS2488: Type 'NodeListOf<HTMLInputElement>' must have a '[Symbol.iterator]()' method that returns an iterator.
  // for (const el of inputs) void el;
}
void inBrowserOnly;

// То есть Array.from в проекте — не привычка и не «старый способ»: это
// запись, которая проходит проверку под любой версией TypeScript. Спред над
// DOM-коллекцией проходит в редакторе и падает в yarn typecheck.
//
// ⚠️ На рабочей ветке autonomous-test-gen-experiment такой спред всё же
// встречается — 111 раз, все в projects/monolith; похоже, их писали, глядя
// на редактор, где ошибки нет. Для yarn typecheck каждый — ошибка TS2488. Их не видно, потому что tsc при синтаксической ошибке
// не доходит до проверки типов вовсе: сообщает только синтаксис и молчит
// про всё остальное. А синтаксическая ошибка там есть — в одном
// из *.helpers.ts внутри JSDoc стоит `*/` посреди текста, и комментарий
// закрывается раньше времени. Вывод на будущее: «tsc показал пятнадцать
// ошибок» не значит «ошибок пятнадцать».

export {};
