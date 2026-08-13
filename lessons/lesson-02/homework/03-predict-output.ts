/**
 * ДЗ 3 — Предсказать вывод и объяснить.
 *
 * Правила: сначала на бумаге, потом `node lessons/lesson-02/homework/03-predict-output.ts`.
 * За каждое расхождение — письменно записать, ПОЧЕМУ ошиблись. Правильный
 * ответ без объяснения не засчитывается: цель — поймать свою модель мира,
 * а не угадать строку.
 *
 * Готово, когда: напротив каждой строки стоит ваш прогноз и объяснение.
 */

// ── Ссылки и мутация ────────────────────────────────────────────────────────
const a = { spots: 5 };
const b = a;
b.spots = 0;
console.log('1)', a.spots); // прогноз:            почему:

const left = { x: 1 };
const right = { x: 1 };
console.log('2)', left === right); // прогноз:            почему:

function reset(config: { spots: number }): void {
  config.spots = 99;
}
const cfg = { spots: 1 };
reset(cfg);
console.log('3)', cfg.spots); // прогноз:            почему:

// ── ?? против || ────────────────────────────────────────────────────────────
const zero: number | undefined = 0;
const blank: string | undefined = '';
console.log('4)', zero || 100, zero ?? 100); // прогноз:            почему:
console.log('5)', blank || 'def', blank ?? 'def'); // прогноз:            почему:

// ── Массивы ─────────────────────────────────────────────────────────────────
const arr: number[] = [1, 2, 3];
arr[6] = 7;
console.log('6)', arr.length, arr); // прогноз:            почему:
const popped = arr.pop();
console.log('7)', popped, arr.length); // прогноз:            почему:

// ── Set и Map ───────────────────────────────────────────────────────────────
const set = new Set([1, 1, 2]);
console.log('8)', set.size, [...set.keys()]); // прогноз:            почему:

const map = new Map<object, string>();
map.set({ id: 1 }, 'первый');
console.log('9)', map.get({ id: 1 })); // прогноз:            почему:

// ── typeof ──────────────────────────────────────────────────────────────────
console.log('10)', typeof null, typeof [], typeof (() => 1)); // прогноз:            почему:

// ── Ключи объекта ───────────────────────────────────────────────────────────
const keyed: Record<string, string> = {};
keyed[1] = 'один';
console.log('11)', Object.keys(keyed), typeof Object.keys(keyed)[0]); // прогноз:            почему:
