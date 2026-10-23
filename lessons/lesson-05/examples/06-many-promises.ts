/**
 * Урок 5 · Несколько промисов сразу.
 *
 * Что здесь: три `await` подряд против `Promise.all` · где на самом деле
 * возникает параллельность · `all` падает на первой ошибке и ничего
 * не отменяет · `allSettled`, `race`, `any` · два настоящих куска кода.
 *
 *   node lessons/lesson-05/examples/06-many-promises.ts     запустить
 *   yarn typecheck                                          проверить типы
 *
 * Всё, что в этом файле, — статические функции на самом слове Promise.
 * Они не «у промиса»: они делают один промис из нескольких и принимают массив.
 * Методов у промиса ровно три, и они в 02-then-catch-finally.ts.
 */

const pause = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
const rejectAfter = (ms: number, message: string): Promise<never> =>
  new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms));
const round = (ms: number): number => Math.round(ms / 50) * 50;

// ── Три await подряд против Promise.all ────────────────────────────────────
const startSeq = Date.now();
await pause(100);
await pause(100);
await pause(100);
console.log('1) три await подряд, мс:', round(Date.now() - startSeq));

const startAll = Date.now();
await Promise.all([pause(100), pause(100), pause(100)]);
console.log('2) Promise.all, мс:', round(Date.now() - startAll));

// Три ожидания по очереди складываются. Promise.all ждёт их одновременно —
// и общее время равно самому долгому, а не сумме. В wl-e2e — сотни вхождений
// (около 650 на 22.10.2026).
//
// Здесь же видно, почему «ставить await везде и не париться» — плохой совет:
// это ровно разница между 300 и 100.

// ── Параллельность даёт не Promise.all ─────────────────────────────────────
const threeAtOnce = [pause(100), pause(100), pause(100)];
const startPre = Date.now();
for (const one of threeAtOnce) {
  await one;
}
console.log('3) await в цикле по готовым промисам, мс:', round(Date.now() - startPre));

// Цикл с await внутри — и всё равно 100 мс, а не 300. Потому что все три
// промиса были созданы ДО цикла, то есть уже работали параллельно.
//
// Параллельность возникает в момент СОЗДАНИЯ промиса.
// Promise.all — способ дождаться, а не способ ускорить.

// ── Promise.all падает сразу, но ничего не останавливает ───────────────────
let longFinished = false;
const longOne = pause(200).then(() => {
  longFinished = true;
});

const startFail = Date.now();
try {
  await Promise.all([longOne, rejectAfter(50, 'быстрая ошибка')]);
} catch (error) {
  console.log(
    '4) all упал через',
    round(Date.now() - startFail),
    'мс:',
    (error as Error).message,
    '· долгий доработал?',
    longFinished,
  );
}
await pause(200);
console.log('5) а теперь долгий доработал?', longFinished);

// Две вещи сразу. Promise.all отказывает на ПЕРВОЙ ошибке, не дожидаясь
// остальных — 50 мс, а не 200. И при этом «долгий» никто не отменял:
// он спокойно доработал до конца и выставил свой флаг уже после того,
// как код ушёл в catch.
//
// Промис нельзя отменить — можно только перестать его ждать. В тестах это
// значит, что после падения фоновая работа продолжает менять состояние.

// ── allSettled — когда нужны все ───────────────────────────────────────────
const settled = await Promise.allSettled([Promise.resolve('ок'), Promise.reject(new Error('нет'))]);
console.log('6)', settled.map((result) => result.status));

// Не бросает вовсе: возвращает отчёт по каждому. В wl-e2e встречается один раз
// на весь проект — знать в лицо, применять по необходимости.

// ── race и any ─────────────────────────────────────────────────────────────
// Гонка (race) — ждём несколько промисов и берём тот, который завершился
// первым. Отказ считается завершением тоже.
try {
  await Promise.race([pause(100), rejectAfter(20, 'быстрый отказ')]);
} catch (error) {
  console.log('7) race поймал отказ:', (error as Error).message);
}

console.log('8)', await Promise.any([rejectAfter(10, 'отказ'), pause(60).then(() => 'успех')]));

// race берёт первый ЛЮБОЙ результат — если первым пришёл отказ, отказом всё
// и закончится. any берёт первый УСПЕШНЫЙ и отказы игнорирует.
//
// По названиям кажется, что должно быть наоборот, — это отметили на уроке.
// Мнемоника: race — это про скорость, кто угодно, лишь бы первым.
// any — «хоть какой-нибудь, но чтоб сработал».
//
// В wl-e2e race — сотни вхождений, any — единицы (323 и 11 на 22.10.2026).

// ── Настоящий Promise.all: почему не два await ─────────────────────────────
//
//   // helpers/monolith/components/marketing-suite-banner.ts:31
//   const [newTab] = await Promise.all([page.context().waitForEvent('page'), cta.click()]);
//
// Здесь Promise.all не про скорость. Двумя строками написать нельзя:
//
//   await cta.click();                                        // вкладка уже открылась
//   const newTab = await page.context().waitForEvent('page'); // ждём событие, которого уже не будет
//
// Слушать событие надо ДО того, как оно произойдёт. Promise.all — способ
// запустить слушателя и действие в одном шаге. Плюс деструктуризация массива
// с урока 3: const [newTab] = ...

// ── Настоящий race: какой из двух экранов появился ─────────────────────────
const screen = await Promise.race([
  pause(60).then(() => 'agreement' as const),
  pause(20).then(() => 'store-settings' as const),
]);
console.log('9) появился экран:', screen);

// Модель настоящего кода:
//
//   // projects/widgets/setup-run/001-default-business/default-business.helpers.ts:41
//   const destination = await Promise.race([
//     page.locator('button.js-button-sign').waitFor({ state: 'visible' }).then(() => 'agreement' as const),
//     page.getByText('Add Payment Method', { exact: true }).waitFor({ state: 'visible' }).then(() => 'store-settings' as const),
//   ]);
//
//   if (destination === 'store-settings') {
//     return;
//   }
//
// Заранее неизвестно, какой из двух экранов покажет приложение. Ставим оба
// ожидания в гонку, и то, что появилось первым, назовёт себя строкой.
// Здесь сходится половина курса: гонка, .then, as const с урока 2 и сужение
// union'а по значению.
//
// И встречный вопрос к этому коду: что вернёт race, если ОБА промиса откажут?
// Отказ того, который отказал первым.

export {};
