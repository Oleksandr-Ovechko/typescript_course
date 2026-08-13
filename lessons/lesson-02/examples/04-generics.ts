/**
 * Урок 2 · Блок 2 — дженерики: что означают угловые скобки.
 *
 * Круглые скобки передают ЗНАЧЕНИЕ в функцию, угловые передают ТИП в тип.
 * Что здесь: `Array<T>` против `T[]` · сколько бывает параметров ·
 * `Promise<T>` и забытый `await` · `Partial<T>` · свой дженерик.
 */

// ── Угловые скобки — аргумент типа ─────────────────────────────────────────
const numbersLong: Array<number> = [1, 2, 3];
const numbersShort: number[] = [1, 2, 3];
console.log('две записи одного типа:', numbersLong, numbersShort);

type Human = { name: string; age: number };

const peopleShort: Human[] = [{ name: 'Ann', age: 30 }];
const peopleLong: Array<Human> = peopleShort;
console.log('массив объектов:', peopleLong);

// ── Сколько бывает параметров ──────────────────────────────────────────────
const testTags: Set<string> = new Set(['smoke', 'regression']);
const ages: Map<string, number> = new Map([['Ann', 30]]);
const flags: Record<string, boolean> = { showPrice: true };
console.log('один и два параметра:', testTags, ages, flags);

// ── Promise<T> и забытый await ─────────────────────────────────────────────
async function fetchClientName(id: number): Promise<string> {
  return `client-${id}`;
}

async function clickBookButton(page: string): Promise<void> {
  console.log('кликаем на', page);
}

async function demo(): Promise<void> {
  await clickBookButton('/schedule');
  const name = await fetchClientName(7);
  console.log('после await тип стал string:', name);
}
void demo();

const notAName = fetchClientName(7);
console.log('без await это не строка, а:', notAName);

// ── Partial<T> ─────────────────────────────────────────────────────────────
type ClientData = {
  firstName: string;
  lastName: string;
  email: string;
};

function generateClientData(overrides: Partial<ClientData> = {}): ClientData {
  return {
    firstName: overrides.firstName ?? 'Ann',
    lastName: overrides.lastName ?? 'Lee',
    email: overrides.email ?? 'ann@example.com',
  };
}

console.log('без переопределений:', generateClientData());
console.log('с одним полем:', generateClientData({ email: 'qa@wl.com' }));

// ── Свой дженерик ──────────────────────────────────────────────────────────
function first<T>(items: T[]): T | undefined {
  return items[0];
}

const firstNumber = first([1, 2, 3]);
const firstName = first(['Ann', 'Bob']);
const firstHuman = first(peopleLong);
console.log('свой дженерик:', firstNumber, firstName, firstHuman?.name);

function firstUnknown(items: unknown[]): unknown {
  return items[0];
}
const lost = firstUnknown([1, 2, 3]);

// ❌ TS18046: 'lost' is of type 'unknown' — метода .toFixed компилятор не видит
// console.log(lost.toFixed(2));

console.log('тип потерян:', lost);

// Файл заканчивается пустым `export {};` — без него он считался бы глобальным
// скриптом, и его объявления столкнулись бы с соседними примерами и с вашим
// playground/scratch.ts (ошибка TS2451 «Cannot redeclare»). Одна строка
// делает файл модулем, и все имена становятся локальными.
export {};
