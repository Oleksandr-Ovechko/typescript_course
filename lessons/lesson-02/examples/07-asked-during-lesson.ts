/**
 * Урок 2 · Что разбирали сверх плана.
 *
 * Что здесь: тип объекта и массива в TypeScript · необязательное поле `?` ·
 * свои функции и глобальный объект.
 *
 *   node lessons/lesson-02/examples/07-asked-during-lesson.ts   запустить
 *   yarn typecheck                                              проверить типы
 *
 * Типы объектов подробно — урок 8, функции — урок 4. Здесь — чтобы узнавать
 * запись в чужом коде.
 */

// ── Тип объекта и массива ──────────────────────────────────────────────────
// Вместо имени примитива после двоеточия — описание объекта: какие поля,
// какого типа. Поля через ; — так пишут в типах.
const client: { name: string; visits: number } = { name: 'Ann', visits: 3 };

// Массив строк — string[]: тип элемента и квадратные скобки.
const clients: string[] = ['Ann', 'Bob', 'Charlie'];
console.log('1)', client, clients); // 1) { name: 'Ann', visits: 3 } [ 'Ann', 'Bob', 'Charlie' ]

// Каждое поле, перечисленное в типе, обязательно. Забыли положить — ошибка:
// ❌ TS2741: Property 'retries' is missing in type '{ name: string; visits: number; }' but required in type '{ name: string; visits: number; retries: number; }'.
// const strictClient: { name: string; visits: number; retries: number } = { name: 'Ann', visits: 3 };

// ── Необязательное поле ? ──────────────────────────────────────────────────
// retries?: number — «поля может не быть». Тогда при чтении под ним
// number или undefined (не null: null кладут руками).
const retryClient: { name: string; retries?: number } = { name: 'Ann' };
console.log('2)', retryClient.retries); // 2) undefined

// Поэтому положить его туда, где ждут именно number, TypeScript не даст:
// ❌ TS2322: Type 'number | undefined' is not assignable to type 'number'.
// const retries: number = retryClient.retries;

// ── Свои функции и глобальный объект ───────────────────────────────────────
// Свою функцию вызывают без точки: greetClient('Ann').
function greetClient(name: string) {
  return `Привет, ${name}!`;
}
console.log('3)', greetClient('Ann')); // 3) Привет, Ann!

// Становится ли она методом глобального объекта (в браузере — window)?
// Зависит от того, как загружен код. В старом браузерном <script> —
// да: function на верхнем уровне попадает в window. В модулях — нет,
// а все файлы курса и тесты на Playwright — модули (export {} в конце
// и "type": "module" в package.json). В Node объекта window нет вообще;
// общий для браузера и Node глобальный объект называется globalThis.
console.log('4)', typeof globalThis, 'greetClient' in globalThis); // 4) object false

export {};
