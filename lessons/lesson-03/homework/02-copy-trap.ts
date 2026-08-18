/**
 * Домашка урока 3 · Задание 2 — копирование объектов.
 *
 * Готово, когда: напротив каждой строки с `// →` записан прогноз, файл запущен
 * и прогнозы сверены. Там, где не совпало, — приписка почему.
 *
 * Предсказывать нужно ДО запуска. Смысл задания не в том, чтобы угадать вывод,
 * а в том, чтобы поймать свою модель исполнения там, где она врёт.
 *
 *   node lessons/lesson-03/homework/02-copy-trap.ts
 */

type RunConfig = {
  project: string;
  browser: { name: string; headless: boolean };
};

const original: RunConfig = {
  project: 'widgets',
  browser: { name: 'chromium', headless: true },
};

const link = original;
const shallow = { ...original };
const deep = structuredClone(original);

original.project = 'monolith';
original.browser.name = 'firefox';

console.log(link.project);           // →
console.log(shallow.project);        // →
console.log(deep.project);           // →

console.log(link.browser.name);      // →
console.log(shallow.browser.name);   // →
console.log(deep.browser.name);      // →

console.log(link === original);            // →
console.log(shallow === original);         // →
console.log(shallow.browser === original.browser);  // →

// А теперь то же самое, но порядок другой.
const base = { locale: 'en', retries: 3 };

console.log({ ...base, locale: 'ua' }.locale);   // →

// А эту строку компилятор не пропускает:
//     ❌ TS2783: 'locale' is specified more than once, so this usage will be overwritten
// console.log({ locale: 'ua', ...base }.locale);
//
// ВОПРОС. Что напечаталось бы, если бы компилятор её пропустил? Почему он вообще
// счёл нужным предупредить — ведь синтаксически строка корректна?
//
// ОТВЕТ:

// ЗАДАНИЕ. Ниже функция, которая должна вернуть настройки с выключенным
// headless, НЕ трогая исходный объект. Сейчас она это правило нарушает.
// Найдите где и почините — так, чтобы `assert` в конце прошёл.
function withHeadlessOff(config: RunConfig): RunConfig {
  const copy = { ...config };
  copy.browser.headless = false;
  return copy;
}

const source: RunConfig = {
  project: 'explorer',
  browser: { name: 'chromium', headless: true },
};
const patched = withHeadlessOff(source);

console.log('patched.browser.headless:', patched.browser.headless);  // → должно быть false
console.log('source.browser.headless :', source.browser.headless);   // → должно остаться true

if (source.browser.headless !== true) {
  throw new Error('исходный объект изменился — функция ещё не починена');
}

export {};
