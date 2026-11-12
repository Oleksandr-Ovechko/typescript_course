/**
 * Урок 3 · Ветвления: `if`, тернарник, `switch`.
 *
 * Что здесь: `if`/`else if`/`else` и почему решает порядок · тернарник
 * и цепочка тернарников, она же через `if` · `switch`, `break`, `default` ·
 * что бывает без `break`.
 *
 *   node lessons/lesson-03/examples/03-branches.ts   запустить
 *   yarn typecheck                                   проверить типы
 */

// ── if, else if, else ──────────────────────────────────────────────────────
// Условия проверяются сверху вниз. Выполняется ПЕРВАЯ ветка, где условие
// true, остальные даже не проверяются.
const statusCode: number = 404;
if (statusCode < 300) {
  console.log('не напечатается: успех');
} else if (statusCode < 500) {
  console.log('1) ошибка клиента:', statusCode); // 1) ошибка клиента: 404
} else {
  console.log('не напечатается: ошибка сервера');
}

// Порядок решает. Здесь первым стоит более широкое условие, и до «успеха»
// код не дойдёт никогда: всё, что меньше 300, меньше и 500.
const okCode: number = 250;
if (okCode < 500) {
  console.log('2) ошибка клиента?', okCode); // 2) ошибка клиента? 250
} else if (okCode < 300) {
  console.log('не напечатается: успех');
}

// В скобках не обязательно сравнение: значение приводится к true/false
// по правилам ложных значений. Пустая строка — ложь.
const typedName: string = '';
if (typedName) {
  console.log('не напечатается: имя введено');
} else {
  console.log('3) пустая строка — ложь, ушли в else'); // 3) пустая строка — ложь, ушли в else
}

// Тело из одной инструкции можно записать без фигурных скобок.
// Так читать труднее, и в проектах скобки обычно ставят всегда.
if (statusCode === 404) console.log('4) без скобок тоже работает'); // 4) без скобок тоже работает

// ── Тернарник ──────────────────────────────────────────────────────────────
// if выбирает, какой кусок ВЫПОЛНИТЬ. Тернарник выбирает ЗНАЧЕНИЕ:
//   условие ? A : B   — если true, результат A, если false — B.
// Тернарник — выражение, у него есть значение. Поэтому он стоит справа
// от = или внутри console.log(…).
console.log('5)', statusCode < 400 ? 'прошёл' : 'упал'); // 5) упал

// Цепочка читается так: «если …, то …, иначе если …, то …, иначе …».
// Каждое условие — на своей строке, двоеточие — в начале строки.
const statusText =
  statusCode < 300 ? 'успех'
  : statusCode < 500 ? 'ошибка клиента'
  : 'ошибка сервера';
console.log('6)', statusText); // 6) ошибка клиента

// То же через if: результат тот же, строк вдвое больше, переменная — let.
// Условий больше двух или в ветке нужно что-то кроме значения — пишите if.
let statusTextIf: string;
if (statusCode < 300) {
  statusTextIf = 'успех';
} else if (statusCode < 500) {
  statusTextIf = 'ошибка клиента';
} else {
  statusTextIf = 'ошибка сервера';
}
console.log('7)', statusTextIf); // 7) ошибка клиента

// ── switch ─────────────────────────────────────────────────────────────────
// Одно значение сравнивается с точными вариантами, через ===.
//   case 'Week(s)':  метка: если совпало, выполнять ОТСЮДА
//   break            выйти из switch
//   default:         ни один case не совпал; необязателен
const delayUnit: string = 'Week(s)';
let delayDays = 0;
switch (delayUnit) {
  case 'Day(s)':
    delayDays = 1;
    break;
  case 'Week(s)':
    delayDays = 7;
    break;
  default:
    console.log('неизвестная единица:', delayUnit);
}
console.log('8)', delayUnit, '→', delayDays); // 8) Week(s) → 7

// ── switch без break ───────────────────────────────────────────────────────
// case — не отдельный блок, а точка входа. Где остановиться, говорит
// только break. Нет break — выполнение «проваливается» в следующий case
// (по-английски fall-through) и идёт до ближайшего break или до конца.
// TypeScript этого не ловит. Ловит линтер, например ESLint с правилом
// no-fallthrough.
const unitNoBreak: string = 'Day(s)';
let daysNoBreak = 0;
switch (unitNoBreak) {
  case 'Day(s)':
    daysNoBreak = 1;
  case 'Week(s)':
    daysNoBreak = 7;
    break;
  default:
    console.log('неизвестная единица:', unitNoBreak);
}
console.log('9)', unitNoBreak, '→', daysNoBreak); // 9) Day(s) → 7

// Проваливание считается по шагам. Вход — в 'Week(s)', break только
// в 'Month(s)': 0 + 7 + 30. До default не дошли.
const unit: string = 'Week(s)';
let days = 0;
switch (unit) {
  case 'Day(s)':
    days = days + 1;
  case 'Week(s)':
    days = days + 7;
  case 'Month(s)':
    days = days + 30;
    break;
  default:
    days = -1;
}
console.log('10)', days); // 10) 37

export {};
