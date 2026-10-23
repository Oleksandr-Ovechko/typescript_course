/**
 * Урок 3 · Блок 3 — деструктуризация и спред.
 *
 * Что здесь: деструктуризация объекта, переименование, значение по умолчанию,
 * массивы и пропуск элементов · деструктуризация параметров функции — то
 * самое `({ page })` · спред как копия и как склейка · три уровня копирования и где здесь ловушка.
 *
 *   node lessons/lesson-03/examples/05-destructuring-spread.ts
 *   yarn typecheck
 */

// ── Деструктуризация объекта ───────────────────────────────────────────────
// Способ вытащить поля в отдельные переменные одной строкой.
const session = { who: 'admin', token: 'abc123', env: 'staging' };

// Как писали раньше:
const whoLong = session.who;
const envLong = session.env;

// То же самое одной строкой. Имена переменных обязаны совпадать с именами полей.
const { who, env } = session;

console.log('одно и то же:', whoLong === who, envLong === env);

// ── Переименование при деструктуризации ────────────────────────────────────
// Двоеточие читается как «взять поле слева, назвать его справа».
// Не путать с двоеточием в типах — здесь оно значит другое.
const { token: customToken } = session;
console.log('переименовали token →', customToken);

// ── Деструктуризация массива ───────────────────────────────────────────────
// Скобки квадратные, и совпадать с чем-либо не нужно: у массива нет имён
// полей, есть только позиции. Имена выбираем любые.
const sizes = ['s', 'm', 'l', 'xl'];

const [smallest, medium] = sizes;
console.log('первые два:', smallest, medium);

// Пропуск позиции — пустое место между запятыми. Читается как
// «второй элемент мне не нужен, переменную под него не заводи».
const [first, , third] = sizes;
console.log('через один:', first, third);

// Остаток собирается в массив теми же тремя точками, что и спред.
const [head, ...tail] = sizes;
console.log('голова:', head, '· хвост:', tail);

// ── Значение по умолчанию ──────────────────────────────────────────────────
// Если поля нет (в нём undefined), после `=` можно дать запасное значение.
// Так устроены хелперы wl-e2e с необязательными настройками —
// helpers/monolith/kiosks/attendance-kiosk-page.ts:39 (ветка draft):
//
//   { maxDays = 30, className, daySwitchTimeoutMs = 7000 }: WaitForClassOptions = {},
//
// `= {}` в конце — на случай, если объект настроек не передали вовсе.
type WaitOptions = { maxDays?: number; className?: string };

function describeWait({ maxDays = 30, className }: WaitOptions = {}): string {
  return `дней: ${maxDays}, класс: ${className}`;
}

console.log('всё задано   :', describeWait({ maxDays: 7, className: 'Yoga' })); // дней: 7, класс: Yoga
console.log('без maxDays  :', describeWait({ className: 'Yoga' }));             // дней: 30, класс: Yoga
console.log('без объекта  :', describeWait());                                  // дней: 30, класс: undefined

// ── Деструктуризация параметров функции ────────────────────────────────────
// Та самая конструкция, что стоит в каждом тесте.
type RunOptions = { page: string; retries: number };

function runLong(options: RunOptions): string {
  return `${options.page}, попыток ${options.retries}`;
}

function runShort({ page, retries }: RunOptions): string {
  return `${page}, попыток ${retries}`;
}

console.log('через точку   :', runLong({ page: '/rs/profile.html', retries: 2 }));
console.log('деструктуризация:', runShort({ page: '/rs/profile.html', retries: 2 }));

// В тесте это выглядит так:
//
//   test.beforeEach(async ({ page }, testInfo) => { ... });
//                          ^^^^^^^^  ^^^^^^^^
//                          1-й параметр, разобранный   2-й параметр,
//                          деструктуризацией           обычный
//
// Фигурные скобки относятся ТОЛЬКО к первому параметру, а не ко всей сигнатуре.
// Playwright передаёт колбэку объект со всеми доступными фикстурами — `page`,
// `browser`, `context` и другими; в скобках просят те, что нужны этому тесту.
// Можно было бы принять объект целиком и писать `fixtures.page`, но так никто
// не делает.

// ── Спред: копия объекта ───────────────────────────────────────────────────
// Три точки читаются как «разложи сюда всё содержимое».
const base = { locale: 'en', embedMode: 'iframe', retries: 3 };

const link = base;              // не копия! второе имя для того же объекта
const copy = { ...base };       // копия
const changed = { ...base, locale: 'ua' };  // копия с изменением

base.locale = 'fr';

console.log('ссылка :', link.locale);     // fr — менялся тот же объект
console.log('копия  :', copy.locale);     // en — копия сделана до изменения
console.log('с правкой:', changed.locale); // ua

// Порядок важен: что написано позже, то и побеждает.
console.log('спред первым:', { ...base, locale: 'ua' }.locale);  // ua

// А обратный порядок компилятор не пропускает — он видит, что первое значение
// заведомо мёртвое, и говорит об этом прямо:
// ❌ TS2783: 'locale' is specified more than once, so this usage will be overwritten
// console.log('спред вторым:', { locale: 'ua', ...base }.locale);

// ── Ловушка: спред копирует только верхний уровень ─────────────────────────
// Самое важное место файла. Спред делает новый объект, но всё вложенное
// остаётся общим с оригиналом.
const config = { locale: 'en', retry: { count: 3 } };
const shallow = { ...config };

console.log('сам объект скопирован :', shallow === config);            // false
console.log('а внутренность общая  :', shallow.retry === config.retry); // true

config.retry.count = 99;
console.log('поменяли оригинал → в копии:', shallow.retry.count);       // 99

// Три уровня, которые легко перепутать:
//   const a = obj;                  ссылка — не копия вообще
//   const b = { ...obj };           поверхностная копия — верхний уровень
//   const c = structuredClone(obj); глубокая копия — всё целиком
config.retry.count = 3;
const deep = structuredClone(config);
config.retry.count = 1;
console.log('глубокая копия не пострадала:', deep.retry.count);         // 3

// В `wl-e2e` на ветке draft глубокого копирования нет вовсе: ни
// `structuredClone`, ни приёма `JSON.parse(JSON.stringify(x))` — ноль вхождений.
// Значит, каждый спред там обязан быть безопасен именно как поверхностный.

// ── Спред на массивах ──────────────────────────────────────────────────────
const smoke = ['login', 'search'];
const all = [...smoke, 'regression'];
console.log('склейка:', all, '· исходный цел:', smoke);

export {};
