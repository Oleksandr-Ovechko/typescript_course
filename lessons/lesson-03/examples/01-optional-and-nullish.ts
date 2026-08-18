/**
 * Урок 3 · Блок 0 — `?.` и `??` в том виде, в каком они разбирались на занятии.
 *
 * Что здесь: восемь falsy-значений · `||` против `??` на нуле и пустой строке ·
 * реальный паттерн `textContent?.trim() ?? ''` из `wl-e2e` · логическое
 * присваивание · почему `||` и `??` нельзя смешивать без скобок.
 *
 *   node lessons/lesson-03/examples/01-optional-and-nullish.ts
 *   yarn typecheck
 *
 * Базовый разбор `?.` лежит в уроке 2: `lessons/lesson-02/examples/06-...`.
 * Здесь — то, что добавилось на третьем занятии.
 */

// ── Восемь falsy-значений ──────────────────────────────────────────────────
// Их ровно восемь, список закрытый. Всё остальное в JavaScript — truthy,
// включая пустой массив, пустой объект и строку '0'.
const falsy: unknown[] = [false, 0, -0, 0n, '', null, undefined, NaN];
console.log('всего falsy:', falsy.length, '· ни одно не прошло:', falsy.every((v) => !v));
console.log('а вот это truthy:', Boolean([]), Boolean({}), Boolean('0'));

// ── || против ?? ───────────────────────────────────────────────────────────
// `||` смотрит на falsy — все восемь значений выше.
// `??` смотрит только на два: null и undefined.
// Расходятся они ровно там, где ноль или пустая строка — законное значение.
type Profile = { name?: string; spots?: number };

function describeSpots(profile: Profile): string {
  const viaOr = profile.spots || 10;
  const viaNullish = profile.spots ?? 10;
  return `|| → ${viaOr} · ?? → ${viaNullish}`;
}

console.log('мест нет вообще:', describeSpots({}));
console.log('мест ровно ноль:', describeSpots({ spots: 0 }));

const blank: string | undefined = '';
console.log('пустая строка: || →', JSON.stringify(blank || 'по умолчанию'), '· ?? →', JSON.stringify(blank ?? 'по умолчанию'));

// Ноль свободных мест — это настоящий ответ, а не «значения нет».
// Поэтому для чисел и строк по умолчанию берут `??`, а `||` — осознанно,
// когда пустая строка действительно должна считаться отсутствием.

// ── Как это выглядит в реальном коде ───────────────────────────────────────
// helpers/monolith/client-web/book-now-page.ts:59 — внутри page.evaluate():
//
//   const catName = category.querySelector('.js-service-category')?.textContent?.trim() ?? '';
//
// Читается справа налево по цепочке отказов: элемента может не быть → `?.`;
// текста у элемента может не быть → второй `?.`; если после всего вышло
// null или undefined → пустая строка.
type FakeElement = { textContent: string | null } | null;

function readText(element: FakeElement): string {
  return element?.textContent?.trim() ?? '';
}

console.log('есть текст :', JSON.stringify(readText({ textContent: '  Yoga  ' })));
console.log('нет текста :', JSON.stringify(readText({ textContent: null })));
console.log('нет элемента:', JSON.stringify(readText(null)));

// ── Логическое присваивание ────────────────────────────────────────────────
// «Если слева пусто — запиши справа». В `wl-e2e` на ветке draft не встречается
// ни разу: `??=`, `||=` и `&&=` дают ноль вхождений. Знать, чтобы узнать.
let timeout: number | undefined;
timeout ??= 1500;
console.log('timeout после ??=:', timeout);

let label = '';
label ||= 'без названия';
console.log('label после ||=:', JSON.stringify(label));

// ── Смешивать || и ?? без скобок нельзя ────────────────────────────────────
// Пустая строка — falsy, но не nullish. Ровно на таком значении два оператора
// расходятся, поэтому и приоритет угадать нельзя.
const primary: string | null = '';
const secondary = 'из настроек';
const fallback = 'по умолчанию';

// ❌ TS5076: '??' and '||' operations cannot be mixed without parentheses.
// const mixed = primary ?? secondary || fallback;

// Приоритет не угадывается — его требуют указать явно, как скобки в арифметике.
console.log('скобки слева :', JSON.stringify((primary ?? secondary) || fallback));
console.log('скобки справа:', JSON.stringify(primary ?? (secondary || fallback)));
// Результаты разные — поэтому компилятор и требует выбрать явно.

export {};
