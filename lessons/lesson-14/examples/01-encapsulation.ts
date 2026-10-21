/**
 * Урок 14 · Инкапсуляция: private, геттер, сеттер.
 *
 * Что здесь: данные, которые можно сломать снаружи · private · геттер против
 * обычного метода и когда геттер действительно нужен (два случая из проекта) ·
 * сеттер — присваивание с проверкой.
 *
 *   node lessons/lesson-14/examples/01-encapsulation.ts   запустить
 *   yarn typecheck                                        проверить типы
 */

// ── Данные, которые можно сломать снаружи ─────────────────────────────────
// Счётчик попыток — тот же, что в домашке урока 13. Поле used открыто,
// и поменять его можно мимо метода next.
class OpenAttempts {
  used = 0;
  next() {
    this.used += 1;
    return `попытка ${this.used}`;
  }
}
const open = new OpenAttempts();
open.next();
open.used = -100;
console.log('1)', open.next());

// Счётчик теперь врёт и сам об этом не знает. В тесте это выглядело бы
// как ретрай, который идёт сто лишних раз.

// ── private — менять можно только методами ────────────────────────────────
// ИНКАПСУЛЯЦИЯ — данные и методы, которые с ними работают, собраны в одном
// объекте, а внутреннее устройство скрыто: менять данные можно только его
// собственными методами.
class Attempts {
  private used = 0;
  next() {
    this.used += 1;
    return `попытка ${this.used}`;
  }
}
const attempts = new Attempts();
attempts.next();
// ❌ TS2341: Property 'used' is private and only accessible within class 'Attempts'.
// attempts.used = -100;
console.log('2)', attempts.next(), Object.keys(attempts));

// Следит за private только TypeScript: при запуске поле обычное, Object.keys
// его видит (урок 13). Настоящая приватность в JavaScript пишется #used.

// ── Прочитать, не меняя: метод или геттер ─────────────────────────────────
// Узнать, сколько попыток потрачено, снаружи всё-таки нужно. Способов два.
class CountedAttempts {
  private used = 0;
  next() { this.used += 1; }
  count() { return this.used; }
  get spent() { return this.used; }
}
const counted = new CountedAttempts();
counted.next();
counted.next();
console.log('3)', counted.count(), counted.spent, typeof counted.count, typeof counted.spent);

// count() — обычный метод, вызывается со скобками.
// get spent() — ГЕТТЕР: та же функция, но снаружи выглядит как свойство,
// counted.spent без скобок. Присвоить ему нельзя:
// ❌ TS2540: Cannot assign to 'spent' because it is a read-only property.
// counted.spent = 0;

// Разницы в скорости нет, разница только в записи. Чаще всего обычного
// метода достаточно. Геттер берут в одном случае: когда значение должно
// ВЫГЛЯДЕТЬ КАК ДАННЫЕ. Два таких случая есть в проекте — ниже.

// ── Случай 1: вычисляемое поле не может устареть ──────────────────────────
// Упрощённая копия FILLER из C21173.helpers.ts. Геттеры бывают и у обычного
// объекта-литерала, не только у класса.
const filler = {
  first: 'Regular',
  last: 'Client',
  fullName: 'Regular Client',
  get name() { return `${this.first} ${this.last}`; },
};
filler.last = 'Filler';
console.log('4)', filler.name, '|', filler.fullName);

// fullName собран один раз и о смене фамилии не знает. name считается при
// каждом чтении. В спеке SUBJECT.name стоит рядом с SUBJECT.uid,
// SUBJECT.email — всё читается одинаково, как данные клиента.

// ── Случай 2: объект подходит туда, где ждут данные ───────────────────────
// Хелпер updateRelationshipClientDob (C58238.helpers.ts) принимает объект
// с полем email: string. REL1 в спеке объявлен с get email().
type Relative = { email: string; ageYears: number };
const describeRelative = (rel: Relative) => `${rel.email}, ${rel.ageYears} лет`;
const relWithGetter = { ageYears: 5, get email() { return 'c58238.rel.child-5@example.test'; } };
const relWithMethod = { ageYears: 5, email() { return 'c58238.rel.child-5@example.test'; } };
// ❌ TS2345: Argument of type '{ ageYears: number; email(): string; }' is not assignable to parameter of type 'Relative'.
// describeRelative(relWithMethod);
console.log('5)', describeRelative(relWithGetter), '|', typeof relWithMethod.email);

// Для того, кто читает, email у объекта с геттером — строка. С методом —
// функция, и под тип { email: string } объект не подходит. Метод пришлось
// бы вызывать, а значит переписывать хелпер и все места, где читают
// rel.email. Геттер встаёт на место поля, и снаружи разницы не видно.

// ── Сеттер — присваивание с проверкой ─────────────────────────────────────
// СЕТТЕР — функция, которая вызывается, когда свойству присваивают.
class RetryLimit {
  private value = 3;
  get limit() { return this.value; }
  set limit(next: number) {
    if (next < 1) throw new Error(`limit must be positive, got ${next}`);
    this.value = next;
  }
}
const retry = new RetryLimit();
retry.limit = 5;
console.log('6)', retry.limit);
try {
  retry.limit = 0;
} catch (error) {
  console.log('7)', retry.limit, '|', (error as Error).message);
}

// retry.limit = 5 — это вызов функции с аргументом 5. Одно имя работает
// в обе стороны: читаем — сработал геттер, присваиваем — сеттер. Вместе
// с private это инкапсуляция целиком: данные спрятаны, единственная дверь
// к ним — с проверкой на входе.
//
// Своих сеттеров в wl-e2e нет. Чужим пользуетесь постоянно: в браузере
// input.value = 'Yoga' — это сеттер, он перерисовывает поле.

export {};
