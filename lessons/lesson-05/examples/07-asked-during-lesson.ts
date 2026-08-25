/**
 * Урок 5 · Что спрашивали на занятии.
 *
 * Что здесь: три помощника урока построчно · почему хелпер с `Promise<void>`
 * «ничего не возвращает», хотя внутри всё происходит · промис внутри промиса.
 *
 *   node lessons/lesson-05/examples/07-asked-during-lesson.ts     запустить
 *   yarn typecheck                                                проверить типы
 *
 * Ничего нового по темам здесь нет — это ответы на вопросы, заданные вслух.
 */

// ── Три помощника урока построчно ──────────────────────────────────────────
// Они лежали на экране весь урок, и разобрать их попросили в самом конце.

// pause — модель «долгой работы»: ровно то, чем в тестах занимается сеть.
const pause = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
//    │       │                │            │           │            │
//    │       │                │            │           │            └─ через ms мс вызвать resolve
//    │       │                │            │           └─ исполнитель: reject не нужен, его не пишем
//    │       │                │            └─ создаём промис прямо здесь — он уже пошёл
//    │       │                └─ обещаем промис, внутри которого НИЧЕГО (void)
//    │       └─ сколько ждать
//    └─ стрелочная функция без фигурных скобок: тело и есть возвращаемое значение

// rejectAfter — то же самое, но с обратным знаком: только отказ, успеха нет.
const rejectAfter = (ms: number, message: string): Promise<never> =>
  new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms));
//             │
//             └─ первый параметр не нужен, но пропустить его нельзя: подчёркивание
//                значит «здесь есть аргумент, и я им не пользуюсь»
//
// Promise<never> читается так: успеха не будет никогда, значит, и типа
// у результата нет. never — с урока 2.

// round — чтобы замеры времени не прыгали в последней цифре.
const round = (ms: number): number => Math.round(ms / 50) * 50;

console.log('1)', await pause(10), '← pause не возвращает ничего, поэтому undefined');
console.log('2)', await rejectAfter(10, 'так и задумано').catch((error: Error) => error.message));
console.log('3)', round(147), '·', round(302));

// ── Почему хелпер «ничего не возвращает», а тип у него Promise<void> ───────
// Вопрос задавали трижды разными словами. Настоящий хелпер из проекта:
//
//   // helpers/monolith/add-client/client-add-page.ts:27
//   export async function openAddClientForm(page: Page): Promise<void> {
//     await page.locator('a.js-menu-item-user-create').click();
//     await expect(page.locator(`${ADD_CLIENT_FORM} input[name="s_firstname"]`)).toBeVisible();
//   }
//
// Внутри происходит многое: клик, ожидание элемента до 15 секунд. Но НАРУЖУ
// функция не отдаёт ничего — в теле нет ни одного return. void — это не
// «ничего не делает», это «нечего забрать».
//
// А Promise вокруг void появляется не потому, что мы так решили: слово async
// ЗАСТАВЛЯЕТ функцию вернуть промис. Мы не назначаем ей тип — мы постфактум
// констатируем, что она промис.
async function doWork(): Promise<void> {
  await pause(10); // работа есть
  // return нет — забирать нечего
}
console.log('4) вызвали, не ждём:', doWork());
console.log('5) дождались      :', await doWork());

// Тот же ответ ещё короче — на typeof, в трёх точках жизни:
console.log('6)', typeof doWork, '→', typeof doWork(), '→', typeof (await doWork()));
// function (сама функция) → object (промис в руках) → undefined (результата нет)

// ── Промис внутри промиса ──────────────────────────────────────────────────
// Место, которое сбивает при чтении pause: внутри стрелочной функции стоит
// new Promise, а внутри него — ещё и setTimeout. Кажется, что промисов два.
//
// Промис здесь один. setTimeout промисом не является — он просто вызывает
// resolve, когда придёт время. Наружу уходит объект промиса, а не результат
// его работы: результат появится позже, и забрать его можно только через await.
const outer = pause(20).then(() => 'результат, которого сначала не было');
console.log('7) сразу        :', outer);
console.log('8) через 20 мс  :', await outer);

// Если промис действительно вложен в промис, движок его разворачивает сам —
// await не приходится писать дважды:
const nested = new Promise<Promise<string>>((resolve) => resolve(Promise.resolve('внутренний')));
console.log('9)', await nested);

export {};
