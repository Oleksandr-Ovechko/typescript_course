/**
 * Урок 6 · `call`, `apply`, `bind`.
 *
 * Что здесь: задать контекст вручную · чем `call` отличается от `apply` ·
 * `bind` не вызывает, а делает новую функцию · перебиндить не выйдет ·
 * свой `bind` в две строки · где это встречается в `wl-e2e`.
 *
 *   node lessons/lesson-06/examples/05-call-apply-bind.ts   запустить
 *   yarn typecheck                                          проверить типы
 *
 * Никакого нового механизма здесь нет: в конце окажется, что `bind` —
 * это обычное замыкание из файла 02.
 */

// ── Функция, которая пользуется this, но никому не принадлежит ────────────
// Если `this` берётся из того, что слева от точки, — напрашивается вопрос:
// а можно задать его самим, без точки? Можно, и ровно для этого есть три метода.
type Suite = { name: string };

function describeSuite(this: Suite, prefix: string, suffix: string): string {
  return `${prefix}${this.name}${suffix}`;
}

const widgets: Suite = { name: 'widgets' };
const monolith: Suite = { name: 'monolith' };

// Просто так её не вызвать — компилятор не даст, потому что не знает, чем будет
// this. Слева от точки ничего нет, подставился бы undefined:

// ❌ TS2684: The 'this' context of type 'void' is not assignable to method's 'this' of type 'Suite'.
// console.log(describeSuite('[', ']'));

// ── call и apply — вызвать с чужим контекстом ─────────────────────────────
console.log('1)', describeSuite.call(widgets, '[', ']'));
console.log('2)', describeSuite.apply(monolith, ['<', '>']));

// Оба вызвали функцию НЕМЕДЛЕННО и оба первым аргументом взяли контекст.
// Разница между ними ровно одна — форма остальных аргументов:
//
//   f.call(объект, a, b)     через запятую     c-all  →  c-omma
//   f.apply(объект, [a, b])  одним массивом    a-pply →  a-rray
//
// Всё остальное — обычный вызов функции.

// ── bind — не вызвать, а сделать новую функцию ────────────────────────────
const describeWidgets = describeSuite.bind(widgets);

console.log('3)', describeWidgets('{', '}'));
console.log('4)', describeWidgets('«', '»'), '← та же функция, другие аргументы');

// bind ничего не вызвал. Он вернул НОВУЮ функцию, у которой контекст прибит
// навсегда, а аргументы остались свободными — их передадим когда захотим,
// хоть в другом файле, хоть через минуту.
//
// Видно это одной строкой:
console.log('5)', typeof describeSuite.call(widgets, '[', ']'), '·', typeof describeSuite.bind(widgets));

// call вернул строку — то есть результат работы функции.
// bind вернул function — то есть саму функцию, ещё не запущенную.

// ── Перебиндить не выйдет ─────────────────────────────────────────────────
const rebound = describeWidgets.bind(monolith);
console.log('6)', rebound('(', ')'), '← перебиндить не вышло, контекст остался прежним');

// Второй bind поверх первого не действует: контекст задаётся один раз
// и навсегда. Это не ограничение, а следствие — сейчас станет видно, какое.

// ── bind — это замыкание, и никакой магии в нём нет ───────────────────────
// Напишем свой bind. Понадобятся ровно те правила, что уже разобраны:
// функция возвращает функцию (2.1), та помнит место, где написана (2.4),
// и держит окружение вызова живым (3.1).
const bindTo = (context: Suite) => (prefix: string, suffix: string): string =>
  describeSuite.call(context, prefix, suffix);

const describeMonolith = bindTo(monolith);
console.log('7)', describeMonolith('{', '}'));

// Две строки, и они делают то же самое. context лежит в окружении вызова
// bindTo и захвачен возвращённой функцией — ровно как prefix и calls
// в makeLogger из файла 02.
//
// И сразу понятно, почему перебиндить нельзя: второй bind оборачивает уже
// обёрнутую функцию, а внутренняя обёртка по-прежнему подставляет свой
// context. Он замкнут, снаружи до него не дотянуться.

// ── Где это встречается в wl-e2e ──────────────────────────────────────────
// Писать call и bind самим вам почти не придётся, а вот узнавать — постоянно:
// в исходниках библиотек, в примерах со Stack Overflow, в том, что предлагает
// Клод. И в своём коде тоже: на момент урока — три места, к 22.10.2026 —
// десятки, почти все вида setter.call(el, val). Вот два первых.
//
// projects/monolith/tests/regression-run/setup-store-configuration/suppliers/
// C21564.helpers.ts:162 — метод оторвали от объекта, this вернули через bind:
//
//   const original = mpNote.show.bind(mpNote);
//   mpNote.show = (...args: unknown[]) => {
//     sessionStorage.setItem(key, String(args[0] ?? ''));
//     return original(...args);
//   };
//
// Это шпион над продуктовым тостом: подменяем MpNote.show своей функцией,
// а настоящую сохраняем, чтобы вызвать её потом. Без bind не обойтись — метод
// оторван от mpNote, и его this потерялся бы ровно так же, как orphan
// в файле 04.
//
// projects/widgets/end-to-end-tests/schedule-widget/C85303.helpers.ts:134 —
// функцию одолжили у прототипа:
//
//   const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
//   setter.call(el, val);
//
// page.fill() на этой форме не запускает React-овский onChange, поэтому
// значение проставляют родным сеттером. Сеттер лежит на прототипе и «своего»
// поля не имеет — ему всё равно, к какому элементу его привязать. Это и есть
// call в чистом виде: функция без хозяина плюс объект, к которому её применили.

export {};
