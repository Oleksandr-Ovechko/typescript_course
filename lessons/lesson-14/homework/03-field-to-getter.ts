/**
 * Задание 3 · Поле в геттер.
 *
 * Объект клиента собран так, что fullName считается один раз — при создании.
 * После правки фамилии он расходится с first и last, и поиск в интерфейсе
 * ищет не того человека.
 *
 * Замените поле fullName геттером с тем же именем. Больше ничего не меняйте:
 * хелпер describeClient и строки, где читают client.fullName, должны
 * остаться как есть.
 *
 *   node lessons/lesson-14/homework/03-field-to-getter.ts
 *
 * Готово, когда все проверки печатают ✅ и на вопрос в конце есть ответ.
 */

const client = {
  first: 'Regular',
  last: 'Client',
  uid: '7731',
  fullName: 'Regular Client',
};

// ── Хелпер и проверки (не менять) ─────────────────────────────────────────
const describeClient = (c: { fullName: string; uid: string }) => `${c.fullName} (uid ${c.uid})`;
const check = (label: string, actual: unknown, expected: unknown) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(ok ? '✅' : '❌', label, ok ? '' : `— сейчас: ${JSON.stringify(actual)}, ждали: ${JSON.stringify(expected)}`);
};

check('до правки', client.fullName, 'Regular Client');
client.last = 'Filler';
check('после правки фамилии', client.fullName, 'Regular Filler');
check('хелпер получил свежее имя', describeClient(client), 'Regular Filler (uid 7731)');
check('fullName по-прежнему читается без скобок', typeof client.fullName, 'string');
check('fullName теперь геттер', typeof Object.getOwnPropertyDescriptor(client, 'fullName')?.get, 'function');

// ── Вопрос ────────────────────────────────────────────────────────────────
// Почему здесь не подошёл бы метод fullName()? Назовите строку в этом файле,
// которая перестала бы компилироваться, и код ошибки.
//
// ответ:

export {};
