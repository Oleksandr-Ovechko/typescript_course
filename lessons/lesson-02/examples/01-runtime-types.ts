/**
 * Урок 2 · Блок 0.8 — главное за оба урока: ТИПОВ В РАНТАЙМЕ НЕТ.
 *
 * Типы стираются при сборке. Тип — обещание компилятору, а не проверка данных.
 * Отсюда правило проекта: тест может запуститься и пройти с ошибкой типов,
 * ловит её только tsc — `yarn typecheck`, а в `yarn gate` — `check:typecheck`.
 *
 * Рядом лежит broken/01-type-error.ts — тот же тезис в две команды.
 */

// ── Типы стираются при сборке ──────────────────────────────────────────────
type Client = { name: string; age: number };
const client: Client = { name: 'Ann', age: 30 };

// ❌ TS2693: 'Client' only refers to a type, but is being used as a value here
// console.log(Client);

console.log('объект есть, тип — нет:', client);

const fromNetwork = JSON.parse('{"name": "Bob", "age": "тридцать"}') as Client;

console.log('TS думает, что age: number →', fromNetwork.age);
console.log('а в рантайме там →', typeof fromNetwork.age);
console.log('и вот результат «математики»:', fromNetwork.age * 2);

function readAge(raw: unknown): number {
  if (typeof raw === 'object' && raw !== null && 'age' in raw && typeof raw.age === 'number') {
    return raw.age;
  }
  throw new Error('age отсутствует или не число');
}

try {
  readAge(fromNetwork);
} catch (error) {
  console.log('честная проверка поймала:', error instanceof Error ? error.message : error);
}

// Файл заканчивается пустым `export {};` — без него он считался бы глобальным
// скриптом, и его объявления столкнулись бы с соседними примерами и с вашим
// playground/scratch.ts (ошибка TS2451 «Cannot redeclare»). Одна строка
// делает файл модулем, и все имена становятся локальными.
export {};
