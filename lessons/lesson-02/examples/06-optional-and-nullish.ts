/**
 * Урок 2 · Блок 4 — `?.` и `??`.
 *
 * НА УРОКЕ ЭТОТ БЛОК МЫ НЕ УСПЕЛИ — разберём в начале третьего.
 * Файл лежит здесь, чтобы можно было посмотреть заранее.
 *
 * Что здесь: optional chaining · `??` против `||` и почему ноль теряется ·
 * логическое присваивание · запрет смешивать `??` с `||` без скобок.
 */

// ── Optional chaining ──────────────────────────────────────────────────────
type Profile = { email?: string; phone?: string };
type ClientWithProfile = { name: string; profile?: Profile };

const fullClient: ClientWithProfile = { name: 'Ann', profile: { email: 'ann@wl.com', phone: '' } };
const emptyClient: ClientWithProfile = { name: 'Bob' };

// ❌ TS18048: 'emptyClient.profile' is possibly 'undefined'
//    (а если бы TS не остановил — TypeError: Cannot read properties of undefined)
// console.log(emptyClient.profile.email);

console.log('есть:', fullClient.profile?.email);
console.log('нет:', emptyClient.profile?.email);

function describeOptional(maybeFn: (() => string) | undefined, list: string[] | undefined): void {
  console.log('метод:', maybeFn?.(), '· индекс:', list?.[0]);
}
describeOptional(undefined, undefined);
describeOptional(() => 'вызвалась', ['первый']);

// ── ?? против || ───────────────────────────────────────────────────────────
const zero: number | undefined = 0;
const blank: string | undefined = '';

console.log('0  || 100 =', zero || 100, '· 0  ?? 100 =', zero ?? 100);
console.log("'' || 'def' =", blank || 'def', "· '' ?? 'def' =", blank ?? 'def');

function seatsLabelBroken(spotsLeft: number | undefined): string {
  return `осталось мест: ${spotsLeft || 10}`;
}
function seatsLabelFixed(spotsLeft: number | undefined): string {
  return `осталось мест: ${spotsLeft ?? 10}`;
}
console.log('БАГА:', seatsLabelBroken(0));
console.log('верно:', seatsLabelFixed(0));

// ── Логическое присваивание ────────────────────────────────────────────────
let timeout: number | undefined;
timeout ??= 15000;
console.log('??= :', timeout);

let title = '';
title ||= 'Без названия';
console.log('||= :', title);

// ❌ TS5076: '??' and '||' operations cannot be mixed without parentheses
//    (в чистом JS это SyntaxError — движок не разбирает такое выражение)
// const x = a ?? b || c;

const a: string | undefined = undefined;
const b = '';
const c = 'запасной';
console.log('со скобками:', (a ?? b) || c);

// Файл заканчивается пустым `export {};` — без него он считался бы глобальным
// скриптом, и его объявления столкнулись бы с соседними примерами и с вашим
// playground/scratch.ts (ошибка TS2451 «Cannot redeclare»). Одна строка
// делает файл модулем, и все имена становятся локальными.
export {};
