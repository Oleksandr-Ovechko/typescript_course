/**
 * Урок 5 · Забытый `await`.
 *
 * Что здесь: действие ещё не произошло · ошибку не видит `try/catch` ·
 * не ловит ни компилятор, ни линтер · `forEach` с `async` · `for...of` ·
 * `map` с `async`.
 *
 *   node lessons/lesson-05/examples/05-forgotten-await.ts     запустить
 *   yarn typecheck                                            проверить типы
 *
 * Плавающий промис (floating promise) — вызов асинхронной функции, результат
 * которой никто не дождался. Работа идёт, а код уже ушёл дальше.
 */

const pause = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

// ── Действие ещё не произошло, а код уже проверяет результат ───────────────
let clicked = false;
async function click(): Promise<void> {
  await pause(20);
  clicked = true;
}

async function forgetful(): Promise<void> {
  click(); // ← await забыт
  console.log('1) сразу после вызова clicked =', clicked);
  await pause(30);
  console.log('2) а через 30 мс clicked =', clicked);
}
await forgetful();

// Клик произошёл — но позже, чем следующая строка. В тесте это значит:
// проверяем состояние страницы ДО того, как действие на неё подействовало.
// Классическое «локально проходит, на CI падает».

// Со словом await хронология другая: click() доходит до своего await pause(20),
// forgetful останавливается и ждёт, и только потом читает clicked.
let clickedAgain = false;
async function clickAgain(): Promise<void> {
  await pause(20);
  clickedAgain = true;
}
async function careful(): Promise<void> {
  await clickAgain();
  console.log('3) с await clicked =', clickedAgain);
}
await careful();

// ── Ошибку не видит try/catch ──────────────────────────────────────────────
// Вызов стоит ПРЯМО ВНУТРИ try, функция гарантированно отказывает — и catch
// всё равно не срабатывает.
async function angry(): Promise<string> {
  await pause(10);
  throw new Error('внутри async');
}

let floating: Promise<string> | undefined;

try {
  floating = angry(); // ← await забыт
  console.log('4) try/catch промолчал');
} catch {
  console.log('4) поймали');
}

await floating?.catch((error: Error) => console.log('5) а ошибка была:', error.message));

// К моменту, когда try/catch закончился, ошибки ещё не было: angry внутри себя
// ждёт десять миллисекунд. try/catch ловит только то, что случилось, ПОКА ОН
// ВЫПОЛНЯЕТСЯ, а без await он выполняется мгновенно.
//
// Сравните с 04-async-await.ts: там та же функция, тот же try/catch — и ошибка
// поймана. Разница в одном слове.
//
// Последние две строки (let ... | undefined и .catch в конце) написаны только
// ради того, чтобы файл дожил до конца прогона. В настоящем коде их нет,
// и получается падение процесса из 03-microtasks.ts.

// ── Не ловит ни компилятор, ни линтер ──────────────────────────────────────
// click(); без await — совершенно законный TypeScript. Функция возвращает
// Promise<void>, результат не используется, ошибки нет. Ни одной строки
// с ❌ в этом файле нет — и это и есть тема раздела.
//
// Правило ESLint, которое это ловит, существует: no-floating-promises.
// Проверено командой npx eslint --print-config <файл> в wl-e2e: из асинхронных
// правил там включено ТОЛЬКО no-async-promise-executor. Забытый await
// в проекте не ловит ничто, кроме глаз на ревью.
//
// Единственная защита — привычка: если функция async, перед ней стоит await.
// Исключения бывают, но они пишутся явно — словом void:
void pause(1); // «я знаю, что не жду, и это намеренно»

// ── forEach с async не работает ────────────────────────────────────────────
async function forEachDemo(): Promise<void> {
  const done: string[] = [];
  ['a', 'b'].forEach(async (name) => {
    await pause(10);
    done.push(name);
  });
  console.log('6) сразу после forEach:', done);
  await pause(30);
  console.log('7) а через 30 мс:', done);
}
await forEachDemo();

// forEach не знает про промисы. Он ВЫЗЫВАЕТ колбэк — с этим всё в порядке, —
// получает промис, выбрасывает его и идёт дальше. Каждый вызов оказывается
// плавающим промисом.
//
// Правило не «не пользуйтесь forEach» (в wl-e2e он вызывается 84 раза и всё
// в порядке), а «forEach вместе с async — никогда»: .forEach(async в проекте
// не встречается ни разу.

// ── for...of работает ──────────────────────────────────────────────────────
async function forOfDemo(): Promise<void> {
  const done: string[] = [];
  for (const name of ['a', 'b']) {
    await pause(10);
    done.push(name);
  }
  console.log('8) после for...of:', done);
}
await forOfDemo();

// Разница не в том, что «for...of умеет асинхронно», а в том, что это ЦИКЛ,
// а не метод с колбэком. await внутри цикла останавливает саму функцию,
// в которой цикл написан, — вместе с циклом. Останавливать forEach нечем:
// колбэк — отдельная функция, и ждёт она сама себя.
//
// Поэтому в wl-e2e перебирают через for (const x of ...) — 583 вхождения.

// ── map с async даёт массив промисов ───────────────────────────────────────
const pending = ['a', 'b'].map(async (name) => {
  await pause(10);
  return name.toUpperCase();
});
console.log('9)', pending);
console.log('10)', await Promise.all(pending));

// map с async-колбэком возвращает массив ПРОМИСОВ, а не значений. Это не
// ошибка: в отличие от forEach, он их не выбрасывает, а отдаёт наружу — и это
// готовый вход для Promise.all. Прямой мостик в 06-many-promises.ts.
//
// .map(async в wl-e2e встречается ровно один раз.

export {};
