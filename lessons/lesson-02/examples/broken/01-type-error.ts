/**
 * СЛОМАНО НАМЕРЕННО. Исключён из `yarn typecheck`.
 *
 * Две команды подряд — вся суть темы «типов в рантайме нет»:
 *
 *   node lessons/lesson-02/examples/broken/01-type-error.ts   → РАБОТАЕТ, печатает NaN
 *   yarn typecheck:broken                                     → две ошибки типов
 *
 * Node не проверяет типы, он их просто вырезает. Playwright тоже не проверяет.
 * Ошибку ловит только tsc: `yarn typecheck`, а в `yarn gate` — `check:typecheck`.
 */

// Ошибка 1 — TS2322: Type 'string' is not assignable to type 'number'.
const spotsLeft: number = 'три';

function seatsAfterBooking(available: number, booked: number): number {
  return available - booked;
}

// Ошибка 2 — TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.
console.log('свободных мест:', seatsAfterBooking(spotsLeft, 'один'));
