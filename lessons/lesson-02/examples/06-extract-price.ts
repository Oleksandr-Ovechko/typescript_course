/**
 * Урок 2 · Всё вместе: как проект достаёт цену.
 *
 * Что здесь: почистить строку цены, превратить в число и не потерять
 * копейки — сначала своими руками, потом так, как это сделано в рабочем
 * проекте. Страница не нужна: вместо текста со страницы — строка.
 *
 *   node lessons/lesson-02/examples/06-extract-price.ts   запустить
 *   yarn typecheck                                        проверить типы
 */

// ── Своими руками ──────────────────────────────────────────────────────────
// Методы идут цепочкой: каждый отдаёт новую строку, и у неё сразу
// вызывается следующий.
const cellText = '$1,234.56';
const digitsOnly = cellText.replaceAll('$', '').replaceAll(',', '');
console.log('1)', digitsOnly, parseInt(digitsOnly), parseFloat(digitsOnly)); // 1) 1234.56 1234 1234.56
// parseInt потерял 56 центов, parseFloat — нет.

// ── Как в рабочем проекте ──────────────────────────────────────────────────
// Хелпер extractPrice в проекте на Playwright (функцию целиком — см. конспект):
//
//   const text = await locator.evaluate((el) => el.getAttribute('data-amount') || el.textContent || '');
//   return parseFloat(text.replace(/[^0-9.]/g, ''));
//
// Первая строка — цепочка ||: атрибут с суммой; нет атрибута (null) — текст
// элемента; нет и текста — пустая строка.
// Вторая — убрать всё, кроме цифр и точки (/[^0-9.]/g — регулярное
// выражение, урок 13), и прочитать с дробной частью.
const attribute = null;
const elementText = '$1,234.56';
const text = attribute || elementText || '';
console.log('2)', parseFloat(text.replace(/[^0-9.]/g, ''))); // 2) 1234.56

export {};
