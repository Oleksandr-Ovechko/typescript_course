/**
 * Урок 5 · Три метода промиса: `.then`, `.catch`, `.finally`.
 *
 * Что здесь: кто что получает · что каждый возвращает · зачем нужен `.finally`
 * (разобрано на уроке по вопросу) · цепочка и почему `.catch` ставят в конце ·
 * настоящий идиом проекта `.then(() => true).catch(() => false)`.
 *
 *   node lessons/lesson-05/examples/02-then-catch-finally.ts     запустить
 *   yarn typecheck                                               проверить типы
 *
 * Методов у промиса ровно три — эти. Всё остальное (all, race, any) висит
 * на самом слове Promise и разобрано в 06-many-promises.ts.
 */

// ── Кто что получает ───────────────────────────────────────────────────────
// .then — значение, .catch — ошибку, .finally — ничего, и срабатывает в обоих
// случаях. Отсюда и название.
await Promise.resolve('успех').then((value) => console.log('1) .then получил:', value));
await Promise.reject(new Error('отказ')).catch((error: Error) => console.log('2) .catch получил:', error.message));
await Promise.resolve('успех').finally(() => console.log('3) .finally после успеха'));
await Promise.reject(new Error('отказ'))
  .finally(() => console.log('4) .finally после отказа'))
  .catch(() => undefined);

// Последняя строка: после .finally пришлось дописать .catch. .finally отказ
// НЕ обрабатывает — он пропускает его дальше. Без этого .catch файл упал бы,
// см. 03-microtasks.ts, раздел про несловленный отказ.

// А на успешном промисе колбэк .catch не вызывается вовсе — не «вызывается
// с undefined», а не вызывается:
await Promise.resolve('успех').catch(() => console.log('   этой строки не будет'));

// ── Что каждый возвращает ──────────────────────────────────────────────────
// Смотрим не на печать, а на результат выражения. Три разных поведения.
const afterThen = await Promise.resolve(2).then((n) => n * 10);
const afterCatch = await Promise.reject(new Error('нет')).catch(() => 'подставили запасное');
const afterFinally = await Promise.resolve('значение').finally(() => 'это вернуть нельзя');
console.log('5)', afterThen, '·', afterCatch, '·', afterFinally);

// .then     ПРЕОБРАЗУЕТ: что вернул колбэк, то и поедет дальше — было 2, стало 20.
// .catch    ПОДСТАВЛЯЕТ ЗАПАСНОЕ: отказ превращается в обычное значение,
//           и дальше промис снова успешный.
// .finally  НИЧЕГО НЕ МЕНЯЕТ: его return игнорируется, наружу идёт исходное
//           'значение'. Он нужен для уборки — закрыть, освободить, залогировать.

// ── Зачем .finally: убрать за собой в обеих ветках ─────────────────────────
// Разбиралось на уроке по вопросу «а в каких случаях он нужен?».
// Модель: открыли соединение, сходили на сервер, соединение надо закрыть —
// и когда получилось, и когда нет.
let openConnections = 0;
const openConnection = (): Promise<string> => {
  openConnections += 1;
  return Promise.resolve('соединение');
};
const request = (shouldFail: boolean): Promise<string> =>
  shouldFail ? Promise.reject(new Error('запрос упал')) : Promise.resolve('данные');
const closeConnection = (): void => {
  openConnections -= 1;
};

async function fetchWith(shouldFail: boolean): Promise<string> {
  await openConnection();
  return request(shouldFail)
    .then((data) => `получили: ${data}`)
    .catch((error: Error) => `ошибка: ${error.message}`)
    .finally(closeConnection); // одна строка вместо двух одинаковых
}

console.log('6)', await fetchWith(false), '· открытых соединений:', openConnections);
console.log('7)', await fetchWith(true), '· открытых соединений:', openConnections);

// Без .finally закрытие пришлось бы писать дважды: в .then и в .catch. Забыли
// в одной ветке — соединение висит ровно в том случае, когда что-то сломалось.
//
// В wl-e2e .finally у промиса не встречается ни разу, а вот try/…/finally —
// 564 раза. Идея та же, запись другая.

// ── Цепочка: .catch ловит и то, что бросил .then ───────────────────────────
// Работает потому, что .then возвращает НОВЫЙ промис — есть на что навесить
// следующее звено.
const chained = await Promise.resolve(1)
  .then((n) => n + 1)
  .then((n) => {
    throw new Error(`бросили на ${n}`);
  })
  .catch((error: Error) => `поймали: ${error.message}`);
console.log('8)', chained);

// ── Порядок звеньев меняет результат ───────────────────────────────────────
// .catch в середине гасит отказ, и следующий .then получает подставленное
// значение. .catch в конце ловит всё, что случилось выше. Поэтому его и ставят
// в конец, а не в середину.
console.log('9) .catch().then() →', await Promise.reject(new Error('бум')).catch(() => 1).then((n) => `then увидел ${n}`));
console.log('10) .then().catch() →', await Promise.reject(new Error('бум')).then((n) => `then увидел ${n}`).catch(() => 'catch поймал'));

// ── Настоящий идиом проекта ────────────────────────────────────────────────
// waitFor не возвращает «нашёл / не нашёл» — он либо молча проходит, либо
// БРОСАЕТ. Просто await здесь не годится: тест упадёт вместо того, чтобы
// пойти по второй ветке.
function waitForVisible(willAppear: boolean): Promise<void> {
  return new Promise((resolve, reject) =>
    setTimeout(() => (willAppear ? resolve() : reject(new Error('Timeout 15000ms exceeded'))), 10),
  );
}

const appeared = await waitForVisible(true)
  .then(() => true)
  .catch(() => false);
const missing = await waitForVisible(false)
  .then(() => true)
  .catch(() => false);
console.log('11)', appeared, missing);

// Модель конструкции из wl-e2e — она встречается в 347 файлах:
//
//   // projects/widgets/setup-run/009-c4793-appointment-widget-no-merchant/
//   //   004-create-instructor.spec.ts:40
//   const hasAgreementToSign = await page
//     .locator('button.js-button-sign')
//     .waitFor({ state: 'visible', timeout: 15_000 })
//     .then(() => true)
//     .catch(() => false);
//
// Вот зачем .then и .catch нужны в мире, где везде await: они превращают
// исключение в значение, с которым уже можно писать if.

export {};
