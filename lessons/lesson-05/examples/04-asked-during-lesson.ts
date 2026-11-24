/**
 * Урок 5 · Сверх плана: что прозвучало на занятии, но в план не входило.
 *
 * Что здесь: магазин яблок — замыкание на бытовом примере · почему внешнее
 * foo не видно и когда видно · добавить свойство в объект и что скажет
 * TypeScript · const и объект · копия через JSON и что она теряет.
 *
 *   node lessons/lesson-05/examples/04-asked-during-lesson.ts   запустить
 *   yarn typecheck                                              проверить типы
 */

// ── Магазин яблок ──────────────────────────────────────────────────────────
// appleShop открывает магазин: заводит склад apples и отдаёт функцию
// «привезти яблоки». Каждый вызов appleShop — новый магазин со своим складом.
// Функция-привоз — замыкание: она видит apples своего магазина.
function appleShop(): (newApples: number) => string {
  let apples = 0;
  return (newApples: number) => {
    apples = apples + newApples;
    return `на складе ${apples}`;
  };
}
const firstShop = appleShop();
const secondShop = appleShop();
console.log('1)', firstShop(3), firstShop(2), secondShop(99)); // 1) на складе 3 на складе 5 на складе 99

// ── Внешнее имя: видно или нет ─────────────────────────────────────────────
// На занятии внутри магазина было своё foo — и переназначение внешнего foo
// ни на что не повлияло. Функция ищет имя по цепочке: сначала в окружении
// своего магазина. Там своё foo ЗАТЕНЯЕТ внешнее — до внешнего поиск
// не доходит. (Живо это окружение после вызова фабрики — благодаря
// замыканию.) Без своего foo поиск доходит до внешнего, читает его при
// каждом вызове — и видит новое значение.
let shopSign = 'Яблоки';
function shopWithOwnSign(): () => string {
  const shopSign = 'Свои яблоки';
  return () => shopSign;
}
function shopWithOuterSign(): () => string {
  return () => shopSign;
}
const ownSign = shopWithOwnSign();
const outerSign = shopWithOuterSign();
shopSign = 'Груши';
console.log('2)', ownSign(), '|', outerSign()); // 2) Свои яблоки | Груши

// ── Добавить свойство в объект ─────────────────────────────────────────────
// JavaScript разрешает дописать новое свойство когда угодно. TypeScript —
// нет: тип объекта выведен из литерала, свойства b в нём нет.
const loose = { a: 1 };
loose.a = 2;
// ❌ TS2339: Property 'b' does not exist on type '{ a: number; }'.
// loose.b = 4;

// Если свойство может появиться позже — его объявляют необязательным: b?:.
// Пока его не задали, там undefined, и в выводе объекта его нет.
const flexible: { a: number; b?: number } = { a: 1 };
console.log('3)', flexible); // 3) { a: 1 }
flexible.b = 4;
console.log('4)', flexible); // 4) { a: 1, b: 4 }

// ── const и объект ─────────────────────────────────────────────────────────
// const не даёт переприсвоить ПЕРЕМЕННУЮ. Объект, на который она ссылается,
// менять можно. С let можно и то, и другое.
const fixedBox = { size: 1 };
fixedBox.size = 2;
// ❌ TS2588: Cannot assign to 'fixedBox' because it is a constant.
// fixedBox = { size: 3 };
let freeBox = { size: 1 };
freeBox = { size: 3 };
console.log('5)', fixedBox.size, freeBox.size); // 5) 2 3

// ── Копия через JSON ───────────────────────────────────────────────────────
// JSON.stringify превращает объект в строку, JSON.parse — строку в новый
// объект. Это глубокая копия, но только для простых данных: методы и
// свойства со значением undefined пропадают, Date становится строкой.
// На маленьких простых объектах это быстрее structuredClone.
const record = { name: 'Ann', when: new Date(0), note: undefined, show(): string { return 'hi'; } };
console.log('6)', JSON.parse(JSON.stringify(record))); // 6) { name: 'Ann', when: '1970-01-01T00:00:00.000Z' }

export {};
