/**
 * Урок 2 · Блок 1 — как описывать типы объектов.
 *
 * Это 90% того, что вы будете писать в файлах `C123456.helpers.ts`.
 * Что здесь: `type` · необязательные поля `?` · `readonly` · вложенность
 * и массивы объектов · функция как поле · `Record` · `type` против `interface`.
 *
 * Типы SessionIdentity, LoginOpts и CachedLoginOpts — настоящие, из
 * helpers/utils/session-store.ts и helpers/monolith/wl-login-helper.ts.
 */

// ── Именованный тип (type alias) ───────────────────────────────────────────
type SessionIdentity = {
  who: string;
  host: string;
  env: string;
};

const identity: SessionIdentity = {
  who: 'admin',
  host: 'ds.wellnessliving.com',
  env: 'staging',
};
console.log('именованный тип:', identity);

// ── Необязательные поля ────────────────────────────────────────────────────
type LoginOpts = {
  /** Игнорировать кэш и всегда логиниться через UI. */
  forceFresh?: boolean;
  /** Селектор, по которому проверяем, что логин прошёл. */
  postLoginCheck?: string;
  /** Таймаут проверки. По умолчанию 15с. */
  postLoginCheckTimeout?: number;
};

const emptyOpts: LoginOpts = {};
const freshOpts: LoginOpts = { forceFresh: true };
console.log('необязательные поля:', emptyOpts, freshOpts);

function describeTimeout(opts: LoginOpts): string {
  // ❌ TS18048: 'opts.postLoginCheckTimeout' is possibly 'undefined'
  // return `${opts.postLoginCheckTimeout * 2} мс`;

  return `${opts.postLoginCheckTimeout ?? 15000} мс`;
}
console.log('с дефолтом:', describeTimeout(emptyOpts));

// ── ВОПРОС С УРОКА: а что реально лежит в объекте, если поле не указали? ───
// Чтение отсутствующего ключа даёт undefined —
// но это не то же самое, что ключ со значением undefined.

console.log('ключи пустого объекта:', Object.keys(emptyOpts)); // []
console.log('есть ли ключ forceFresh:', 'forceFresh' in emptyOpts); // false
console.log('а чтение даёт:', emptyOpts.forceFresh); // undefined
console.log('и в JSON его нет:', JSON.stringify(emptyOpts)); // {}

// Для сравнения — ЯВНО положенный undefined. Ключ есть, значение undefined:
const explicitUndefined = { forceFresh: undefined };
console.log('явный undefined:', Object.keys(explicitUndefined), 'forceFresh' in explicitUndefined);
// [ 'forceFresh' ] true
//
// Почему это важно: `Object.keys`, спред, `JSON.stringify` и проверка `in`
// ведут себя по-разному в этих двух случаях.

// ── readonly ───────────────────────────────────────────────────────────────
type TestCase = {
  readonly id: string;
  title: string;
};

const testCase: TestCase = { id: 'C154002', title: 'Lead capture — toggles' };
testCase.title = 'новый заголовок';

// ❌ TS2540: Cannot assign to 'id' because it is a read-only property
// testCase.id = 'C000000';

console.log('readonly:', testCase);

// ── Вложенность и массивы объектов ─────────────────────────────────────────
type Booking = {
  id: string;
  client: { firstName: string; lastName: string };
  items: { sku: string; qty: number }[];
};

const booking: Booking = {
  id: 'B-1',
  client: { firstName: 'Ann', lastName: 'Lee' },
  items: [
    { sku: 'PASS-10', qty: 1 },
    { sku: 'TOWEL', qty: 2 },
  ],
};
console.log('вложенность:', booking.client.lastName, booking.items[0].sku);

type BookingClient = { firstName: string; lastName: string };
type ShortBooking = { id: string; client: BookingClient };

const shortBooking: ShortBooking = { id: 'B-2', client: { firstName: 'Bob', lastName: 'Ray' } };
console.log('вынесенный тип:', shortBooking);

// ── Функция как поле ───────────────────────────────────────────────────────
type CachedLoginOpts = {
  identity: SessionIdentity;
  probeUrl: string;
  isAuthenticated: (page: string) => boolean;
  doLogin: (page: string) => void;
  forceFresh?: boolean;
};

const cachedLogin: CachedLoginOpts = {
  identity,
  probeUrl: '/rs/index.html',
  isAuthenticated: (page) => page.includes('profile'),
  doLogin: (page) => console.log('логинимся на', page),
};
console.log('функция как поле:', cachedLogin.isAuthenticated('/rs/profile.html'));

// ── Record — произвольные ключи ────────────────────────────────────────────
type EnvVars = Record<string, string>;
const envVars: EnvVars = { APP_ENV: 'staging', BASE_URL: 'https://ds.wellnessliving.com' };
console.log('Record:', envVars.APP_ENV);

// то же самое старой записью — index signature
type EnvVarsOld = { [key: string]: string };
const envVarsOld: EnvVarsOld = { A: '1' };
console.log('index signature:', envVarsOld);

// ── type или interface ─────────────────────────────────────────────────────
interface Animal {
  name: string;
}
interface Animal {
  legs: number;
}
const dog: Animal = { name: 'Rex', legs: 4 };
console.log('interface слился сам с собой:', dog);

type Status = 'active' | 'blocked';
type Pair = [string, number];

const status: Status = 'active';
const pair: Pair = ['age', 30];
console.log('type умеет больше:', status, pair);

// Файл заканчивается пустым `export {};` — без него он считался бы глобальным
// скриптом, и его объявления столкнулись бы с соседними примерами и с вашим
// playground/scratch.ts (ошибка TS2451 «Cannot redeclare»). Одна строка
// делает файл модулем, и все имена становятся локальными.
export {};
