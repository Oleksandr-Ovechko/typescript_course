/**
 * Урок 15 · Экранирование и проверки вперёд и назад.
 *
 * Что здесь: какие символы значат не себя · одна \ в литерале и две в строке ·
 * зачем нужна запись new RegExp · переменная в шаблоне и escapeRegExp ·
 * разбор регулярки script/style из проекта · (?= ) (?! ) (?<= ) (?<! ) ·
 * кнопка оплаты из виджета.
 *
 *   node lessons/lesson-15/examples/04-escaping-lookaround.ts   запустить
 *   yarn typecheck                                              проверить типы
 */

// ── Символы, которые значат не себя ────────────────────────────────────────
//   .  *  +  ?  ^  $  {  }  (  )  |  [  ]  \      и  /  — в литерале
// Чтобы символ значил сам себя, перед ним ставят \ — экранируют.
// В литерале /…/ — ОДНА обратная черта:
console.log('1)', /1.5/.test('105'), /1\.5/.test('105'), /1\.5/.test('1.5'));
console.log('2)', /\/rs\/profile\.html/.test('/rs/profile.html?uid=7'), /^\$\d+$/.test('$25'));

// ── В строке для new RegExp — две ──────────────────────────────────────────
// В строке '\d' — просто 'd': обратную черту съела строка раньше,
// чем её увидел RegExp.
const wrong = new RegExp('^\d+$');
console.log('3)', wrong.source, wrong.test('2026'), wrong.test('d'));
const right = new RegExp('^\\d+$');
console.log('4)', right.source, right.test('2026'));

// ── Зачем вообще new RegExp ────────────────────────────────────────────────
// Когда кусок шаблона берётся из переменной. Так собрана проверка
// в helpers/monolith/assertions.ts:133:
//   toHaveText(new RegExp(`^\\s*${text}\\s*$`, 'i'))
const staffLabel = 'Staff';
console.log('5)', new RegExp(`^\\s*${staffLabel}\\s*$`, 'i'));

// \s* по краям — потому что текст элемента приходит со страницы вместе
// с отступами разметки. Почему именно так — урок 16.

// ── Переменная со спецсимволами ────────────────────────────────────────────
const passName = 'Pass (10 visits)';
console.log('6)', new RegExp(`^${passName}$`).test('Pass (10 visits)'));

// Строка не совпала сама с собой: скобки в шаблоне — группа,
// и шаблон ищет «Pass 10 visits». Переменную перед вставкой экранируют:
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
console.log('7)', escapeRegExp(passName));
console.log('8)', new RegExp(`^${escapeRegExp(passName)}$`).test('Pass (10 visits)'));

// Набор всех спецсимволов, флаг g — все, $& в замене — «то, что совпало»,
// перед ним — \. Ровно эта функция —
// helpers/monolith/client-profile/upcoming-schedule-page.ts:154.
// Свою копию на test-generation (22.10) объявляют 377 файлов C{id}.helpers.ts
// из 3 669 — и это разрешено: правило A9 в RULES.md, «Tier-2 may duplicate
// freely». Повод вынести в общее место — только копии в общих хелперах (их три).

// ── Всё вместе в одной строке проекта ──────────────────────────────────────
// .../email-history/C49763.helpers.ts:530 — вырезать из HTML
// <script>…</script> и <style>…</style>:
const html = '<p>a</p><script>x()</script><style>p{}</style><p>b</p>';
console.log('9)', html.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ''));

// По кускам: < · группа script или style · \b — конец слова ·
// [\s\S]*? — любые символы, лениво · <\/ — экранированная косая ·
// \1 — тот же тег, что открылся · флаги g и i.

// ── Проверки вперёд и назад ────────────────────────────────────────────────
// Смотрят от текущего места, но НИЧЕГО не забирают в совпадение:
//   X(?=Y)    X, за которым идёт Y
//   X(?!Y)    X, за которым НЕ идёт Y
//   (?<=Y)X   X, перед которым стоит Y
//   (?<!Y)X   X, перед которым НЕ стоит Y

// ── Кнопка оплаты ──────────────────────────────────────────────────────────
// projects/widgets/helpers/widgets/appointment-widget-page.ts:1855
// (та же строка — в schedule-widget-page.ts:1760)
const payBtn = /(book\s*(&|and)\s*pay(?!\s*later)\b.*|complete\s*booking\b.*)/i;
console.log('10)', ['Book & pay', 'Book and Pay now', 'Book & pay later', 'Complete booking'].map((l) => payBtn.test(l)));

// По кускам: book\s*(&|and)\s*pay — «book & pay» или «book and pay» с любыми
// пробелами · (?!\s*later) — но НЕ «… pay later» · \b.* — дальше конец слова
// и что угодно · |complete\s*booking\b.* — или «complete booking» · флаг i.

// ── Ретроспективная: перед X стоит Y ───────────────────────────────────────
console.log('11)', 'Paid $1,234.50 Due today $20.00'.match(/(?<=\$)[\d,]+\.\d{2}/g));
console.log('12)', 'v1.5 and 21.5'.match(/(?<![\d.])1\.5(?!\d)/g), 'v1.5 and 21.5'.match(/1\.5/g));

// 11) — сумма без знака доллара: $ проверен, но в совпадение не вошёл.
//       В проекте ретроспективная проверка одна —
//       .../schedule-widget/C191581.helpers.ts:689 (ветка test-generation):
//       она берёт фразу «Due today …», перед которой стоит сумма.
// 12) — «1.5 как отдельное число, а не хвост 21.5»: перед ним не цифра и
//       не точка, после — не цифра. Так ищут часы в отчёте —
//       .../time-clock-details/C112383.helpers.ts:929 (ветка test-generation).

export {};
