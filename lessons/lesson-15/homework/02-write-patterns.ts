/**
 * Задание 2 · Написать шаблоны.
 *
 * Пять заготовок ниже. Каждую замените так, чтобы проверки внизу печатали ✅.
 * Сейчас часть печатает ❌ — это нормально, так задумано.
 *
 *   node lessons/lesson-15/homework/02-write-patterns.ts
 *
 * Менять можно только блок «Ваши шаблоны». Подписи и тексты в проверках —
 * такие, какие встречаются у нас на страницах.
 */

// ── Ваши шаблоны ──────────────────────────────────────────────────────────

// 1. Год — ровно четыре цифры, ничего больше.
const yearRe = /\d/;

// 2. Заголовок «Staff» так, как его отдаёт textContent: вокруг могут быть
//    пробелы и переносы строк из разметки. Но «Staff list» и «All Staff» —
//    не он. Регистр важен.
const staffTitleRe = /Staff/;

// 3. Время вида 5:30pm или 12:05am. Часы и минуты — именованными группами
//    hours и minutes.
const timeRe = /(?<hours>)(?<minutes>)/;

// 4. Кнопка оплаты: «Book & pay» или «Book and pay» в любом регистре, после
//    может идти что угодно («Book & pay now»). Но не «Book & pay later»
//    и не «Rebook & pay».
const payRe = /book/i;

// 5. Регулярка «ровно эта подпись» из переменной. В подписи могут быть
//    скобки, $, + и точки — они должны значить сами себя.
const exactLabel = (label: string): RegExp => new RegExp(`^${label}$`);

// ── Проверки (не менять) ──────────────────────────────────────────────────
const check = (label: string, actual: unknown, expected: unknown) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(ok ? '✅' : '❌', label, ok ? '' : `— сейчас: ${JSON.stringify(actual)}, ждали: ${JSON.stringify(expected)}`);
};

check('1. год', ['2026', '26', '20261', 'year 2026'].map((s) => yearRe.test(s)), [true, false, false, false]);

check('2. заголовок Staff', ['\n    Staff\n  ', 'Staff', 'Staff list', 'All Staff', 'staff'].map((s) => staffTitleRe.test(s)),
  [true, true, false, false, false]);

const t1 = '5:30pm'.match(timeRe)?.groups;
const t2 = '12:05am'.match(timeRe)?.groups;
check('3. время 5:30pm', [t1?.hours, t1?.minutes], ['5', '30']);
check('3. время 12:05am', [t2?.hours, t2?.minutes], ['12', '05']);
check('3. без am/pm и с тремя цифрами минут — нет', ['5:30', '5:300pm'].map((s) => timeRe.test(s)), [false, false]);

check('4. кнопка оплаты',
  ['Book & pay', 'Book and Pay now', 'BOOK & PAY', 'Book & pay later', 'Rebook & pay', 'Book'].map((s) => payRe.test(s)),
  [true, true, true, false, false, false]);

check('5. подпись со скобками', exactLabel('Pass (10 visits)').test('Pass (10 visits)'), true);
check('5. подпись с $ и +', exactLabel('$25 + tax').test('$25 + tax'), true);
check('5. точка — только точка', exactLabel('v1.5').test('v105'), false);
check('5. ровно, без хвоста', exactLabel('Save').test('Save draft'), false);

// ── Вопрос ────────────────────────────────────────────────────────────────
// В конспекте, раздел «Регулярка в локаторе», есть строка проекта
// getByRole('button', { name: /^Book & pay/ }). Найдёт ли она «Book & pay
// later»? А ваш шаблон из задания 4? Что поменять в строке проекта, чтобы
// она вела себя как ваш шаблон?
//
// ответ:

export {};
