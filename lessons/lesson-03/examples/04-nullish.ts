/**
 * Урок 3 · `??` — запасное значение, только если значения нет.
 *
 * Что здесь: `??` против `||` · чем различаются на нуле и пустой строке ·
 * цепочка `??` · тип «или» `number | null`, без которого TypeScript
 * не пропустит пример.
 *
 *   node lessons/lesson-03/examples/04-nullish.ts   запустить
 *   yarn typecheck                                  проверить типы
 *
 * «Запасное значение» — то, что берут, когда своего нет: имя не ввели —
 * «гость», таймаут не задали — 30 секунд. Весь вопрос в том, что считать
 * «своего нет».
 */

// ── || против ?? ───────────────────────────────────────────────────────────
// x || запас — запас, если x ЛОЖНОЕ (любое из восьми: 0, '', false, …).
// x ?? запас — запас, только если x — null или undefined.
// Ноль, пустая строка и false для ?? — настоящие значения, он их сохраняет.
const timeoutMs: number = 0;
console.log('1)', timeoutMs || 30_000, timeoutMs ?? 30_000); // 1) 30000 0

const retries: number = 0;
const label: string | null = null;
console.log('2)', retries ?? 3, retries || 3, label ?? 'нет'); // 2) 0 3 нет

// ?? возвращает первое значение, которое не null и не undefined, даже
// если оно ложное: false ?? true — это false.
const headless: boolean = false;
const savedTitle: string = '';
console.log('3)', headless ?? true, `[${savedTitle ?? 'без названия'}]`); // 3) false []

//   слева                  x || запас    x ?? запас
//   0, '', false           запас         x
//   null, undefined        запас         запас
//   всё остальное          x             x

// ── Тип «или» ──────────────────────────────────────────────────────────────
// string | null — «строка или null». Так записывают значение, которого
// может не быть. Подробно такие типы — в уроке про union.
// Без | null TypeScript не даст положить null в строковую переменную:
// ❌ TS2322: Type 'null' is not assignable to type 'string'.
// const titleNoUnion: string = null;
const titleFromPage: string | null = null;
console.log('4)', titleFromPage ?? 'без названия'); // 4) без названия

// ── Цепочка ?? ─────────────────────────────────────────────────────────────
// «Из командной строки, иначе из конфига, иначе по умолчанию». Идёт слева
// направо и отдаёт первое значение, которое не null и не undefined.
const timeoutFromCli: number | undefined = undefined;
const timeoutFromConfig: number | undefined = 10_000;
console.log('5)', timeoutFromCli ?? timeoutFromConfig ?? 30_000); // 5) 10000

// Ноль в конфиге — это значение: цепочка на нём и остановится.
const zeroFromConfig: number | undefined = 0;
console.log('6)', timeoutFromCli ?? zeroFromConfig ?? 30_000); // 6) 0

export {};
