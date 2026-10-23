/**
 * Урок 10 · Асинхронный перебор.
 *
 * Что здесь: async function* и for await...of · асинхронный генератор ленив,
 * а не параллелен · поток ноды уже умеет for await · настоящий код из wl-e2e,
 * который читает скачанный файл, и что в нём на самом деле происходит с памятью.
 *
 *   node lessons/lesson-10/examples/05-async-iteration.ts   запустить
 *   yarn typecheck                                          проверить типы
 */

const pause = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

// ── for await...of ────────────────────────────────────────────────────────
// Тот же протокол, что в 03, только next() возвращает ПРОМИС { value, done },
// а цикл дожидается каждого. Метод называется Symbol.asyncIterator.
async function* chunks(): AsyncGenerator<string> {
  for (const part of ['первый', 'второй', 'третий']) {
    await pause(10);
    yield part;
  }
}
const got: string[] = [];
for await (const chunk of chunks()) got.push(chunk);
console.log('1)', got);

// ── Асинхронный генератор ленив, а не параллелен ──────────────────────────
// Легко решить, что асинхронный генератор «крутится в фоне», пока основной
// код занят своим. Нет: как и обычный, он не делает ничего, пока его
// не спросили. Тело стартует на первом next().
async function* traced(): AsyncGenerator<string> {
  console.log('3) генератор: тело пошло');
  yield 'кусок';
}
const t = traced();
console.log('2) генератор создан — тело ещё не выполнялось');
console.log('4) получили:', (await t.next()).value);

// ── Поток уже итерируем ───────────────────────────────────────────────────
// Потоки ноды (Readable) реализуют Symbol.asyncIterator сами. Оборачивать их
// в свой генератор, чтобы пройти for await, не нужно — это уже сделано.
// Проверить на настоящем потоке (печатает function):
//
//   node -e "const {Readable}=require('node:stream');console.log(typeof Readable.from(['a'])[Symbol.asyncIterator])"
//
// В этом файле поток изображает обычный объект с тем же методом: типов ноды
// в курсе нет, и Readable с Buffer не прошли бы yarn typecheck.
const stream = {
  async *[Symbol.asyncIterator](): AsyncGenerator<string> {
    for (const line of ['BEGIN:VCALENDAR\n', 'BEGIN:VEVENT\n', 'END:VEVENT\n', 'END:VCALENDAR\n']) {
      await pause(5);
      yield line;
    }
  },
};
console.log('5) у потока есть Symbol.asyncIterator:', typeof stream[Symbol.asyncIterator]);

const parts: string[] = [];
for await (const piece of stream) parts.push(piece);
const text = parts.join('');
console.log('6) кусков:', parts.length, '· склеено строк:', text.trim().split('\n').length);

// ── Настоящий код из wl-e2e ───────────────────────────────────────────────
// for await в проекте встречается восемь раз на test-generation и семь на draft,
// и все — вот эта форма.
// projects/widgets/tests/regression-run/appointment-widget/new-appointment-widget/C139796.helpers.ts:656
// (есть и на test-generation, и на draft):
//
//   const stream = await download.createReadStream();
//   const chunks: Buffer[] = [];
//   for await (const chunk of stream) {
//     chunks.push(Buffer.from(chunk));
//   }
//   return {
//     fileName: download.suggestedFilename(),
//     text: Buffer.concat(chunks).toString('utf8'),
//     ...
//   };
//
// Это проверка «Add to calendar»: скачанный .ics надо прочитать и разобрать.
// Что здесь происходит с памятью:
//
// - поток отдаёт файл кусками, и for await их дожидается по одному;
// - но каждый кусок кладётся в chunks, а после цикла Buffer.concat склеивает
//   их в одну строку. В памяти оказывается ВЕСЬ файл целиком.
//
// И это правильно: .ics разбирается целиком, по кускам его не проверить.
// Файл маленький — одно-два события, упереться в память тут нечем.
//
// Переписать это «на генератор» ничего бы не дало: поток и так асинхронно
// итерируем (строка 5), а память определяет не способ чтения, а то, что
// делают с кусками. Читать по кускам имеет смысл, когда каждый кусок можно
// обработать и выбросить, — например, посчитать строки в гигабайтном логе.

export {};
