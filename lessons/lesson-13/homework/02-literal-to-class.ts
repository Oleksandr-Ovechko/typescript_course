/**
 * Задание 2 · Из литерала — в класс.
 *
 * Ниже — счётчик попыток, сделанный функцией, которая возвращает объект
 * с методами (как makeReport на занятии). У каждого счётчика своя копия
 * методов.
 *
 * Перепишите его классом Attempts — заготовка стоит ниже. Функцию
 * makeAttempts не трогайте: она нужна для сравнения.
 *
 *   node lessons/lesson-13/homework/02-literal-to-class.ts
 *
 * Готово, когда все проверки внизу печатают ✅.
 *
 * Счётчик — это цикл-ретрай с потолком из урока 10, только с памятью:
 * он помнит, сколько попыток уже потрачено.
 */

// ── Как сейчас ────────────────────────────────────────────────────────────
const makeAttempts = (limit: number) => ({
  limit,
  used: 0,
  /** Тратит одну попытку и возвращает её подпись. Попытки кончились — бросает. */
  next() {
    if (this.used >= this.limit) throw new Error(`no attempts left (limit ${this.limit})`);
    this.used += 1;
    return `попытка ${this.used} из ${this.limit}`;
  },
  /** Сколько попыток осталось. */
  left() {
    return this.limit - this.used;
  },
});

// ── Ваш класс ─────────────────────────────────────────────────────────────
// Нужно: поле limit (приходит снаружи), поле used (начинается с нуля),
// методы next() и left() — с тем же поведением, что выше.
class Attempts {
  limit = 0;
  used = 0;
  constructor(limit: number) {
    void limit;
  }
  next(): string {
    return '';
  }
  left(): number {
    return -1;
  }
}

// ── Проверки (не менять) ──────────────────────────────────────────────────
const check = (label: string, actual: unknown, expected: unknown) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(ok ? '✅' : '❌', label, ok ? '' : `— сейчас: ${JSON.stringify(actual)}, ждали: ${JSON.stringify(expected)}`);
};
const thrown = (fn: () => unknown) => {
  try {
    fn();
    return 'не бросил';
  } catch (error) {
    return (error as Error).message;
  }
};

const old = makeAttempts(2);
const first = new Attempts(2);
const second = new Attempts(3);

check('первая попытка подписана так же, как у makeAttempts', first.next(), old.next());
check('вторая попытка', first.next(), 'попытка 2 из 2');
check('попыток не осталось', first.left(), 0);
check('третья попытка бросает ту же ошибку', thrown(() => first.next()), 'no attempts left (limit 2)');
check('у второго счётчика свои данные', [second.left(), second.used], [3, 0]);
check('метод у двух экземпляров один', first.next === second.next, true);
check('методы лежат в прототипе, а не в экземпляре', [Object.hasOwn(first, 'next'), Object.hasOwn(Attempts.prototype, 'next')], [false, true]);
check('данные лежат в экземпляре', Object.keys(first).sort(), ['limit', 'used']);
check('а у старого счётчика методы свои', Object.hasOwn(old, 'next'), true);

// ── Вопрос ────────────────────────────────────────────────────────────────
// Создали тысячу счётчиков. Сколько функций next существует в памяти
// в варианте с makeAttempts и сколько — в варианте с классом? Почему?
//
// ответ:

export {};
