/**
 * Урок 5 · Объекты.
 *
 * Что здесь: литерал и свойства · короткая запись · обращение через . и [] ·
 * ключи — строки · вычисляемые свойства · опциональная цепочка ?. · ссылка
 * и сравнение · поверхностная копия через ... · глубокая копия structuredClone.
 *
 *   node lessons/lesson-05/examples/02-objects.ts   запустить
 *   yarn typecheck                                  проверить типы
 */

// ── Литерал и свойства ─────────────────────────────────────────────────────
// Объект — набор пар «ключ — значение». { … } справа от = — литерал:
// создаёт новый объект прямо здесь. Ключ с пробелом пишут в кавычках.
// new Object() делает то же, но так почти не пишут.
const book = {
  title: 'Дюна',
  year: 1965,
  'in stock': true,
};
console.log('1)', book); // 1) { title: 'Дюна', year: 1965, 'in stock': true }

// Короткая запись: { width, height } — то же, что { width: width, height: height }.
const width = 3;
const height = 4;
console.log('2)', { width, height }); // 2) { width: 3, height: 4 }

// Примитивы (строки, числа, true/false и т. д.) — НЕ объекты. Свойство
// у строки не заведёшь: в модуле это TypeError.
console.log('3)', typeof book, typeof 'Дюна', typeof 1965); // 3) object string number

// ── Обращение к свойствам ──────────────────────────────────────────────────
//   book.title         обычный случай
//   book['in stock']   ключ с пробелом или особыми символами
//   book[fieldName]    ключ лежит в переменной: берётся её ЗНАЧЕНИЕ
console.log('4)', book.title, book['year'], book['in stock']); // 4) Дюна 1965 true
const fieldName = 'year';
console.log('5)', book[fieldName]); // 5) 1965

// Читают и меняют одной записью. Через const объявлена переменная,
// а не содержимое объекта, поэтому свойство менять можно.
book.year = 1966;
console.log('6)', book.year); // 6) 1966

// Несуществующее свойство TypeScript не пропустит. JavaScript не упал бы,
// а отдал undefined: node -e "const shelf = { title: 'Дюна' }; console.log(shelf.price)"
// ❌ TS2339: Property 'price' does not exist on type '{ title: string; year: number; 'in stock': boolean; }'.
// console.log(book.price);

// Ключи объекта — строки. Число в ключе превращается в строку.
console.log('7)', Object.keys({ 1: 'один', 2: 'два' })); // 7) [ '1', '2' ]

// ── Вычисляемые свойства ───────────────────────────────────────────────────
// { [key]: value } — ключом станет ЗНАЧЕНИЕ key, а не слово key. В [ ] любое
// выражение, оно вычисляется при создании объекта.
// Record<string, number> — тип «объект, где ключи — строки, значения — числа».
function makePair(key: string, value: number): Record<string, number> {
  return { [key]: value };
}
const prefix = 'max';
const limits = { [`${prefix}Age`]: 99, [prefix + 'Size']: 10 };
console.log('8)', makePair('age', 30), limits); // 8) { age: 30 } { maxAge: 99, maxSize: 10 }

// Без скобок ключ — просто слово.
const key = 'color';
const car = { key: 'red', [key]: 'blue' };
console.log('9)', car); // 9) { key: 'red', color: 'blue' }

// ── Опциональная цепочка ?. ────────────────────────────────────────────────
// address?: в типе — свойство необязательное. Прочитать .city у undefined
// нельзя: JavaScript упадёт при выполнении этой строки (TypeError),
// а TypeScript предупредит заранее, ещё до запуска (TS18048).
// ?. дальше не идёт, если слева null или undefined, и даёт undefined.
// 0 и '' для него — обычные значения.
const owner: { name: string; address?: { city: string } } = { name: 'Ann' };
const tenant: { name: string; address?: { city: string } } = {
  name: 'Bob',
  address: { city: 'Kyiv' },
};
console.log('10)', owner.address?.city, tenant.address?.city); // 10) undefined Kyiv

// ❌ TS18048: 'owner.address' is possibly 'undefined'.
// console.log(owner.address.city);

// ?? (урок 3) подставляет запасное значение только вместо null и undefined.
console.log('11)', owner.address?.city ?? 'город не указан'); // 11) город не указан

// ── Ссылка ─────────────────────────────────────────────────────────────────
// Переменная хранит не объект, а ССЫЛКУ на него. Присваивание копирует
// ссылку: original и sameObject — один объект. === у объектов сравнивает
// ссылки, а не содержимое: twin — другой объект с тем же содержимым.
//
//   original ───┐
//               ├──► { score: 2 }
//   sameObject ─┘
//   twin ──────────► { score: 2 }
const original = { score: 1 };
const sameObject = original;
sameObject.score = 2;
const twin = { score: 2 };
console.log('12)', original.score, original === sameObject, original === twin); // 12) 2 true false

// Переприсвоить const-переменную нельзя — менять сам объект можно.
// ❌ TS2588: Cannot assign to 'original' because it is a constant.
// original = { score: 3 };

// ── Копирование ────────────────────────────────────────────────────────────
// { ...profile } — новый объект, в который разложены свойства profile.
// Кто записан позже, тот и останется: name у копии — 'Bob'.
// Это ПОВЕРХНОСТНАЯ копия: копируется верхний уровень. В contacts лежит
// объект, значит скопировалась ССЫЛКА на него — телефон общий у обоих.
//
//   profile ────► { name: 'Ann', contacts ─┐ }
//                                          ├──► { phone: '222' }
//   shallowCopy ► { name: 'Bob', contacts ─┘ }
const profile = { name: 'Ann', contacts: { phone: '111' } };
const shallowCopy = { ...profile, name: 'Bob' };
shallowCopy.contacts.phone = '222';
console.log('13)', profile.name, shallowCopy.name, profile.contacts.phone); // 13) Ann Bob 222

// structuredClone — полная копия на любой глубине.
const deepCopy = structuredClone(profile);
deepCopy.contacts.phone = '333';
console.log('14)', profile.contacts.phone, deepCopy.contacts.phone); // 14) 222 333

// Чтобы поменять вложенное и не тронуть оригинал, копируют и вложенный
// уровень: { ...profile, contacts: { ...profile.contacts, phone: '444' } }.
const updated = { ...profile, contacts: { ...profile.contacts, phone: '444' } };
console.log('15)', profile.contacts.phone, updated.contacts.phone); // 15) 222 444

export {};
