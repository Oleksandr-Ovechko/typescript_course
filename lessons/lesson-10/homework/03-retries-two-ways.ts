/**
 * Задание 3 · Перебираемый объект двумя способами.
 *
 * `retries(limit)` отдаёт подписи попыток: `попытка 1 из 3`, `попытка 2 из 3`,
 * `попытка 3 из 3`. Написать его нужно дважды:
 *
 *   3.1 руками — объект с методом `[Symbol.iterator]`, который возвращает
 *       объект с `next()`. Ни одного `function*` и `yield`.
 *   3.2 генератором.
 *
 *   node lessons/lesson-10/homework/03-retries-two-ways.ts   запустить
 *   yarn typecheck:hw10                                      проверить типы
 *
 * Готово, когда файл печатает десять ✅, `yarn typecheck:hw10` чист
 * и в конце файла есть ответ на вопрос.
 *
 * ⚠️ Сейчас `yarn typecheck:hw10` НЕ проходит, и это часть задания: обе
 * функции объявлены с типом возврата `unknown`, а по `unknown` нельзя пройти
 * ни спредом, ни `for...of` (TS2488). Разберитесь, какой тип должен быть
 * у каждой, — это упражнение на то, что именно требует протокол.
 *
 * Код проверок трогать нельзя: чинить нужно сами функции.
 */

// ── Задание 3.1. Руками ───────────────────────────────────────────────────
// Подсказка: конспект, «Свой перебираемый объект». Подумайте, где должен
// жить счётчик, чтобы один и тот же объект можно было перебрать дважды.

function retriesByHand(limit: number): unknown {
  void limit;
  throw new Error('не реализовано — задание 3.1');
}

// ── Задание 3.2. Генератором ──────────────────────────────────────────────
// Подсказка: конспект, «Функция, которая умеет замирать».

function retriesGenerator(limit: number): unknown {
  void limit;
  throw new Error('не реализовано — задание 3.2');
}

// ── Проверки. Трогать нельзя ──────────────────────────────────────────────

const check = (label: string, run: () => unknown, expected: unknown): void => {
  let actual: unknown;
  try {
    actual = run();
  } catch (error) {
    actual = `упало: ${(error as Error).message}`;
  }
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(ok ? '✅' : '❌', label, ok ? '' : `— сейчас: ${JSON.stringify(actual)}, ждали: ${JSON.stringify(expected)}`);
};

const three = ['попытка 1 из 3', 'попытка 2 из 3', 'попытка 3 из 3'];

check('3.1 спред', () => [...retriesByHand(3)], three);
check('3.1 ноль попыток — пусто', () => [...retriesByHand(0)], []);
check('3.1 один объект, два спреда — оба полные', () => {
  const r = retriesByHand(3);
  return [[...r].length, [...r].length];
}, [3, 3]);
check('3.1 работает и написан без function*', () => [retriesByHand.constructor.name, [...retriesByHand(1)]], ['Function', ['попытка 1 из 1']]);

check('3.2 спред', () => [...retriesGenerator(3)], three);
check('3.2 деструктуризация', () => {
  const [first, ...rest] = retriesGenerator(3);
  return [first, rest.length];
}, ['попытка 1 из 3', 2]);
check('3.2 это генератор', () => retriesGenerator.constructor.name, 'GeneratorFunction');
// Эта проверка фиксирует факт, а не баг. Объясните его в ответе ниже.
check('3.2 один объект, два спреда — второй ПУСТОЙ', () => {
  const r = retriesGenerator(3);
  return [[...r].length, [...r].length];
}, [3, 0]);

check('обе записи дают одно и то же', () => [...retriesByHand(5)].join() === [...retriesGenerator(5)].join(), true);
check('break посреди for...of', () => {
  const seen: string[] = [];
  for (const label of retriesGenerator(10)) {
    seen.push(label);
    if (seen.length === 2) break;
  }
  return seen;
}, ['попытка 1 из 10', 'попытка 2 из 10']);

// ── Вопрос ────────────────────────────────────────────────────────────────
// Один абзац: чем две записи отличаются и чем нет. Обязательно ответьте:
//   — кто в каждой записи вызывает next() и откуда берётся { value, done };
//   — где в каждой записи живёт счётчик;
//   — почему в 3.1 один объект перебирается дважды, а в 3.2 второй спред пуст.
//     (Подсказка: что именно вернул retriesGenerator(3) — перебираемый объект
//     или уже итератор? И что возвращает его собственный [Symbol.iterator]()?
//     Проверьте: `const g = retriesGenerator(3); console.log(g[Symbol.iterator]() === g);`)
//
// ответ:

export {};
