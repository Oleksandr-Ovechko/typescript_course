/**
 * Урок 3 · Уточнения — места, где на занятии прозвучала неточность.
 *
 * Что здесь: спред копирует поверхностно · три уровня копирования · файл без
 * `export` ничего никуда не склеивает · `@` не означает `node_modules` ·
 * `const` поднимается, но лежит в мёртвой зоне · `??` называется оператором
 * нулевого слияния · `find` возвращает `T | undefined`.
 *
 *   node lessons/lesson-03/examples/00-corrections.ts     запустить
 *   yarn typecheck                                        проверить типы
 *
 * Читать этот файл первым: дальше по примерам всё написано уже правильно.
 */

// ── Спред копирует поверхностно ────────────────────────────────────────────
// Самое важное уточнение урока. Спред делает НОВЫЙ объект, но только верхний
// уровень. Всё, что лежит внутри вложенным объектом, остаётся общим.
const config = { locale: 'en', retry: { count: 3, delay: 500 } };
const spread = { ...config };

console.log('spread === config:', spread === config);
console.log('spread.retry === config.retry:', spread.retry === config.retry);

config.retry.count = 99;
console.log('поменяли config.retry.count → spread.retry.count:', spread.retry.count);

// ── Три уровня копирования ─────────────────────────────────────────────────
// Их легко перепутать, потому что все три выглядят похоже.
const original = { locale: 'en', retry: { count: 1 } };

const link = original;                    // 1. ссылка — не копия вообще
const shallow = { ...original };          // 2. поверхностная копия
const deep = structuredClone(original);   // 3. глубокая копия

original.locale = 'ua';
original.retry.count = 42;

console.log('ссылка       :', link.locale, link.retry.count);       // ua 42
console.log('поверхностная:', shallow.locale, shallow.retry.count); // en 42 ← внутренность общая
console.log('глубокая     :', deep.locale, deep.retry.count);       // en 1

// Метода `Object.deepCopy` не существует — глубокую копию делает глобальная
// функция `structuredClone`. В `wl-e2e` на ветке draft не встречается ни она,
// ни приём `JSON.parse(JSON.stringify(x))`: глубокого копирования там нет.

// ── Файл без export: что происходит на самом деле ──────────────────────────
// Прозвучало, что такие файлы «склеиваются в один большой JS-файл» и что код
// «не запустится, упадёт на этапе компиляции». Ни то, ни другое.
//
// Два файла с одинаковой `function login()` дадут при `tsc`:
//     a.ts(1,10): error TS2393: Duplicate function implementation.
//     b.ts(1,10): error TS2393: Duplicate function implementation.
// но `node a.ts` и `node b.ts` при этом отработают оба и напечатают своё.
//
// Ничего никуда не собирается: при `noEmit` компилятор вообще не создаёт файлов.
// Общая область видимости — правило ПРОВЕРКИ ТИПОВ, а не сборки. Это ровно тот
// же вывод, что и на уроке 2: в рантайме типов нет, и `node` про них не знает.
//
// Коды ошибок разные: для функций `TS2393`, для `const` и `let` — `TS2451`.

// ── Собачка не означает node_modules ───────────────────────────────────────
// В тестах встречаются оба вида голого пути:
//     import { test } from '@playwright/test';
//     import { ... } from 'wl-e2e-automation-helpers/monolith/...';
//
// Оба разрешаются через `node_modules`. Локальный пакет монорепы лежит там же —
// Yarn кладёт туда симлинк, это видно командой `ls -la node_modules`:
//     wl-e2e-automation-helpers -> ../helpers
//
// `@` — часть ИМЕНИ пакета (scoped package, неймспейс в npm), про место она
// ничего не говорит. Граница проходит по форме пути:
//     './file', '../../helpers/x'  — относительный путь, файл рядом
//     '@playwright/test', 'wl-e2e-automation-helpers'  — голый, идём в node_modules

// ── const поднимается, но трогать его нельзя ───────────────────────────────
// Прозвучало, что переменные «не поднимаются». Поднимаются — просто до строки
// объявления лежат в мёртвой зоне (TDZ). Разница видна по тексту ошибки:
//     ReferenceError: Cannot access 'x' before initialization   ← поднялась
//     ReferenceError: x is not defined                          ← если бы нет
// tsc на таком коде даёт TS2448 и TS2454. Подробнее — на уроке 4.

// ── ?? — оператор нулевого слияния, а не «логическое И» ────────────────────
// Логическое И — это `&&`, отдельный оператор. Пара, которую сравнивали
// на уроке, называется «`||` и `??`».
const zero: number | undefined = 0;

console.log('||  →', zero || 100);   // 100 — 0 это falsy
console.log('??  →', zero ?? 100);   // 0   — 0 это не null и не undefined
console.log('&&  →', zero && 100);   // 0   — третий оператор, не разбирался

// ── find возвращает T | undefined ──────────────────────────────────────────
// Прозвучало «find возвращает единственное правильное значение». А если ничего
// не нашлось — возвращает `undefined`, и тип это учитывает.
const spots = [3, 0, 12, 25];
const firstFree = spots.find((spot) => spot === 0);

// ❌ TS2322: тип 'number | undefined' нельзя присвоить типу 'number'
// const exact: number = firstFree;

console.log('find нашёл:', firstFree, '· не нашёл:', spots.find((s) => s === 777));

// Вот ради таких значений и нужен блок 0 этого урока:
console.log('с подстраховкой:', spots.find((s) => s === 777) ?? -1);

export {};
