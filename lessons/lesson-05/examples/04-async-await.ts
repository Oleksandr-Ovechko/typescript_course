/**
 * Урок 5 · `async` и `await` — вторая запись того же самого.
 *
 * Что здесь: `async` всегда возвращает промис · `throw` внутри неё — это отказ ·
 * что на самом деле глушит `.catch(() => undefined)` · почему внутри `try`
 * нужен именно `return await`.
 *
 *   node lessons/lesson-05/examples/04-async-await.ts     запустить
 *   yarn typecheck                                        проверить типы
 */

const pause = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

// ── async всегда возвращает промис ─────────────────────────────────────────
// Слово async заменяет собой всю обёртку new Promise(...). Точнее, оно
// не «подсказывает» тип, а ЗАСТАВЛЯЕТ функцию вернуть промис.
async function five(): Promise<number> {
  return 5;
}
console.log('1)', five() instanceof Promise, '· после await:', await five());

// return 5 внутри async возвращает не пятёрку, а промис, внутри которого
// пятёрка. Поэтому в wl-e2e у каждого хелпера в сигнатуре стоит Promise<void> —
// 9072 вхождения. Это не украшение, это буквально то, что функция отдаёт.

// ── Промис в трёх точках жизни ─────────────────────────────────────────────
// Спрашивали на уроке: «хелпер ничего не возвращает — почему Promise<void>?»
// Ответ проще всего увидеть на typeof.
console.log('2) сама функция      :', typeof pause);
console.log('3) вызвали, не ждём  :', typeof pause(10), '←', pause(10));
console.log('4) дождались         :', typeof (await pause(10)));

// function → object → undefined.
// Пока не дождались — в руках объект-промис. Дождались — в руках результат,
// а результата у void-функции нет, отсюда undefined. Промис никуда не «прячет»
// значение: его просто не было.

// ── throw внутри async — это отказ, а не исключение ────────────────────────
async function angry(): Promise<string> {
  await pause(10);
  throw new Error('внутри async');
}

try {
  await angry();
} catch (error) {
  console.log('5) try/catch вокруг await поймал:', (error as Error).message);
}

// С await всё как обычно — try/catch работает. Запомнить надо другое: поймал он
// не «исключение из функции», а ОТКАЗ ПРОМИСА, КОТОРЫЙ ДОЖДАЛИСЬ.
// Уберём await — и catch замолчит. Это 05-forgotten-await.ts.

// ── .catch(() => undefined) — 950 вхождений в проекте ──────────────────────
const swallowed = await angry().catch(() => undefined);
console.log('6) после .catch(() => undefined):', swallowed);

// Смысл — «попробуй, а не вышло, и ладно». Полезно там, где элемента может
// не быть по замыслу.
//
// Опасно там, где его не быть не должно: такая запись глушит ЛЮБУЮ ошибку —
// и опечатку в селекторе, и упавшую сеть. Тест не падает, а тихо идёт дальше
// с undefined и в конце показывает «passed».
//
// Это try/catch {} со всеми его недостатками. Ставить только там, где точно
// знаешь, что глушишь. Клод такую конструкцию тоже любит дописывать —
// проверять за ним.

// ── return await против return внутри try ──────────────────────────────────
async function withoutAwait(): Promise<string> {
  try {
    return angry(); // промис уезжает наружу ДО того, как откажет
  } catch {
    return 'поймали в withoutAwait';
  }
}

async function withAwait(): Promise<string> {
  try {
    return await angry(); // отказ случается внутри try
  } catch {
    return 'поймали в withAwait';
  }
}

console.log('7)', await withoutAwait().catch(() => 'ошибка улетела наружу'));
console.log('8)', await withAwait());

// Обычно return await считают лишним — и он лишний везде, кроме try.
// Без await функция отдаёт промис наружу и выходит из try ДО того, как промис
// отказал; catch в этот момент уже не действует.
//
// Правило короткое: внутри try — всегда return await.

export {};
