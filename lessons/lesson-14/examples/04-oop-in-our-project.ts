/**
 * Урок 14 · ООП и наш проект: функции вместо классов-страниц.
 *
 * Что здесь: одна «страница» в двух записях — функциями, как у нас, и классом ·
 * что из принципов ООП даёт обычный файл-модуль · когда класс действительно
 * нужен · статические методы и чему равен this внутри них.
 *
 *   node lessons/lesson-14/examples/04-oop-in-our-project.ts   запустить
 *   yarn typecheck                                             проверить типы
 */

// В примерах Playwright нет, поэтому Page — заглушка: объект, который просто
// запоминает клики.
type Page = { clicks: string[] };
const NOTE_WIDGET = '.css-profile-note-view';

// ── Наш способ: функции с page первым параметром ──────────────────────────
// Так устроен helpers/monolith/client-profile/client-note-page.ts.
const openNoteForm = (page: Page) => { page.clicks.push(`${NOTE_WIDGET} Add`); };
const saveNote = (page: Page, text: string) => { page.clicks.push(`Save "${text}"`); };
const pageA: Page = { clicks: [] };
openNoteForm(pageA);
saveNote(pageA, 'no bookings');
console.log('1)', pageA.clicks);

// ── То же классом — «page object» из учебников ────────────────────────────
class ClientNotePage {
  private readonly page: Page;
  constructor(page: Page) { this.page = page; }
  openForm() { this.page.clicks.push(`${NOTE_WIDGET} Add`); }
  save(text: string) { this.page.clicks.push(`Save "${text}"`); }
}
const pageB: Page = { clicks: [] };
const note = new ClientNotePage(pageB);
note.openForm();
note.save('no bookings');
console.log('2)', pageB.clicks, JSON.stringify(pageA.clicks) === JSON.stringify(pageB.clicks));

// Результат один и тот же. Разница — где живёт page: у функций первым
// параметром, у класса — в this.page. Больше экземпляру хранить нечего:
// своих данных у страницы нет, всё состояние — в браузере.
//
// Что из ООП даёт обычный файл-модуль, без класса:
//   инкапсуляция   — const и функции без export видны только внутри файла
//                    (в client-note-page.ts так спрятаны NOTE_WIDGET и setCheckbox);
//   публичное      — функции с export;
//   абстракция     — тест зовёт saveFlaggedClientNote(page, …) и не знает
//                    ни одного селектора;
//   наследование   — не нужно: общее выносят в функцию и зовут её;
//   полиморфизм    — не нужен: у страницы одна реализация.
//
// Класс нужен там, где у объекта есть СВОЁ СОСТОЯНИЕ МЕЖДУ ВЫЗОВАМИ, которое
// не приходит параметром. TestRailReporter помнит enabled, runId и results
// от onBegin до onEnd — ему класс нужен. Хелперу страницы помнить нечего.
//
// Почему в проекте выбрали именно функции — в документации проекта не
// записано. Записано другое: что хелперы-страницы — это файлы *-page.ts
// с функциями, и новый хелпер пишется так же, как соседние.

// ── Статические методы ────────────────────────────────────────────────────
// Object.keys, Object.hasOwn, Array.from, Date.now — методы, которые зовут
// у самого класса, без экземпляра. Они лежат в самой функции-классе,
// а не в её prototype.
console.log('3)', Object.hasOwn(Array, 'from'), Object.hasOwn(Array.prototype, 'from'), Object.hasOwn(Date, 'now'));

// Свой статический метод пишется со словом static. this внутри него —
// САМ КЛАСС, а не экземпляр: экземпляра при таком вызове нет.
class RunId {
  value: number;
  constructor(value: number) { this.value = value; }
  static parse(text: string) { return new this(Number(text.replace('R', ''))); }
}
console.log('4)', RunId.parse('R924').value, Object.hasOwn(RunId, 'parse'), 'parse' in RunId.parse('R1'));

// Поэтому статический метод не может работать с полями экземпляра: у самого
// класса поля page нет, оно есть только у экземпляров.
// ❌ TS2339: Property 'page' does not exist on type 'typeof StaticNotePage'.
// class StaticNotePage { page: Page = { clicks: [] }; static openForm() { this.page.clicks.push('Add'); } }

// Своих static в проекте нет.

export {};
