/**
 * Домашка урока 5 · Задание 2 — починить четыре функции.
 *
 * Готово, когда: файл запускается и печатает четыре строки «✅», а в конце
 * не бросает Error.
 *
 *   node lessons/lesson-05/homework/02-fix-four-bugs.ts
 *   yarn typecheck:hw5
 *
 * В каждой функции ровно ОДИН баг, и все четыре — с этого урока.
 * Менять код проверок внизу файла нельзя: чинить нужно сами функции.
 *
 * Обратите внимание: `yarn typecheck:hw5` проходит и ДО того, как вы что-то
 * почините. Это не сбой проверки — это тема урока. Компилятору здесь нечего
 * сказать, все четыре бага он считает совершенно законным кодом.
 */

const pause = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

// ── Баг 1. Состояние читается раньше, чем действие произошло ───────────────
// Функция должна вернуть true: к моменту возврата регистрация завершена.
async function registerClient(): Promise<boolean> {
  let registered = false;

  async function submitForm(): Promise<void> {
    await pause(20);
    registered = true;
  }

  submitForm();
  return registered;
}

// ── Баг 2. Собранный список оказывается пустым ─────────────────────────────
// Функция должна вернуть ['A', 'B', 'C'] — имена в верхнем регистре.
async function collectNames(names: string[]): Promise<string[]> {
  const result: string[] = [];

  names.forEach(async (name) => {
    await pause(10);
    result.push(name.toUpperCase());
  });

  return result;
}

// ── Баг 3. Ошибка пролетает мимо try/catch ─────────────────────────────────
// Функция должна вернуть строку 'подставили запасное', а не бросить наружу.
async function loadSettings(): Promise<string> {
  async function fetchFromServer(): Promise<string> {
    await pause(10);
    throw new Error('сервер не ответил');
  }

  try {
    return fetchFromServer();
  } catch {
    return 'подставили запасное';
  }
}

// ── Баг 4. Три ожидания складываются, хотя могли бы идти вместе ────────────
// Функция должна укладываться в время самого долгого шага, а не в их сумму.
// Порядок в результате важен: ['виджет', 'меню', 'футер'].
async function loadThreeWidgets(): Promise<string[]> {
  const first = await pause(100).then(() => 'виджет');
  const second = await pause(100).then(() => 'меню');
  const third = await pause(100).then(() => 'футер');

  return [first, second, third];
}

// ───────────────────────────────────────────────────────────────────────────
// Ниже ничего не меняем: это проверки.
// ───────────────────────────────────────────────────────────────────────────

const failures: string[] = [];

function check(number: number, name: string, passed: boolean, got: unknown): void {
  if (passed) {
    console.log(`✅ ${number}. ${name}`);
    return;
  }
  console.log(`❌ ${number}. ${name} — получили:`, got);
  failures.push(`${number}. ${name}`);
}

const registered = await registerClient();
check(1, 'registerClient дожидается отправки формы', registered === true, registered);

const names = await collectNames(['a', 'b', 'c']);
check(2, 'collectNames собирает все имена', names.join(',') === 'A,B,C', names);

const settings = await loadSettings().catch((error: Error) => `улетело наружу: ${error.message}`);
check(3, 'loadSettings ловит отказ в своём try/catch', settings === 'подставили запасное', settings);

const startedAt = Date.now();
const widgets = await loadThreeWidgets();
const elapsed = Date.now() - startedAt;
check(
  4,
  `loadThreeWidgets укладывается в один шаг (ушло ${elapsed} мс)`,
  elapsed < 200 && widgets.join(',') === 'виджет,меню,футер',
  { elapsed, widgets },
);

if (failures.length > 0) {
  throw new Error(`ещё не починено: ${failures.join(' · ')}`);
}

console.log('\nВсе четыре починены.');

export {};
