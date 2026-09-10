/**
 * Задание 2 · Написать два помощника.
 *
 * Оба построены на одном и том же механизме: функция возвращает функцию,
 * та помнит окружение места, где написана. Первый — про замыкание,
 * второй — про контекст. Никакой разницы под капотом между ними нет.
 *
 *   node lessons/lesson-06/homework/02-write-two-helpers.ts   запустить
 *   yarn typecheck:hw6                                        проверить типы
 *
 * Готово, когда файл печатает шесть ✅ и `yarn typecheck:hw6` чист.
 *
 * ⚠️ Сейчас `yarn typecheck:hw6` НЕ проходит, и это часть задания:
 * в `bindTo` намеренно неверный тип возврата. Разберитесь, каким он должен
 * быть, — само по себе это упражнение на то, что именно возвращает `bind`.
 */

// ── Задание 2.1. makeSkinNamer ────────────────────────────────────────────
// Возвращает функцию, которая при каждом вызове выдаёт следующее имя:
// `prefix_1`, `prefix_2`, `prefix_3`. Два разных именователя не должны
// мешать друг другу: у каждого свой счёт с единицы.
//
// Подсказка: makeCounter из конспекта плюс prefix. Оба лежат в одном окружении.

function makeSkinNamer(prefix: string): () => string {
  void prefix;
  throw new Error('не реализовано — задание 2.1');
}

// ── Задание 2.2. bindTo ───────────────────────────────────────────────────
// Свой bind: принимает функцию, которая пользуется `this`, и объект-контекст,
// а возвращает НОВУЮ функцию с прибитым контекстом. Вызывать fn внутри bindTo
// нельзя — он должен вызываться только тогда, когда вызовут результат.
//
// В конспекте bindTo написан для одной конкретной функции. Здесь — для любой,
// поэтому подпись с дженериками:
//   T — тип контекста, A — типы аргументов, R — тип результата.
//
// Тип возврата ниже неверный. Почините его и напишите тело.

function bindTo<T, A extends unknown[], R>(fn: (this: T, ...args: A) => R, context: T): unknown {
  void fn;
  void context;
  throw new Error('не реализовано — задание 2.2');
}

// ── Проверки. Трогать нельзя, чинить нужно функции выше ───────────────────

type Suite = { name: string };

function describeSuite(this: Suite, prefix: string, suffix: string): string {
  return `${prefix}${this.name}${suffix}`;
}

const widgets: Suite = { name: 'widgets' };
const monolith: Suite = { name: 'monolith' };

const check = (label: string, actual: unknown, expected: unknown): void =>
  console.log(actual === expected ? '✅' : '❌', label, '→', actual, expected === actual ? '' : `(ждали ${String(expected)})`);

const christmas = makeSkinNamer('christmas');
const default_ = makeSkinNamer('default');

check('первый именователь, вызов 1', christmas(), 'christmas_1');
check('первый именователь, вызов 2', christmas(), 'christmas_2');
check('второй именователь начинает свой счёт', default_(), 'default_1');
check('первый продолжает со своего', christmas(), 'christmas_3');

const describeWidgets = bindTo(describeSuite, widgets);
const describeMonolith = bindTo(describeSuite, monolith);

check('bindTo прибил widgets', describeWidgets('[', ']'), '[widgets]');
check('bindTo прибил monolith', describeMonolith('<', '>'), '<monolith>');

// А эта строка проверяет типы, а не поведение: если тип возврата починен
// правильно, компилятор знает, что аргументов два и оба строки.
// @ts-expect-error — TS2345: 42 не строка, аргументы должны сохранить свои типы
describeWidgets(42, ']');

export {};
