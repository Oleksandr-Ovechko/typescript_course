/**
 * Домашка урока 3 · Задание 1 — колбэки и методы массива.
 *
 * Сейчас файл НЕ проходит проверку типов — так и задумано. Готово, когда
 * `yarn typecheck:hw3` чист, файл запускается и в конце записан ответ
 * на вопрос из пункта 6.
 *
 *   node lessons/lesson-03/homework/01-callbacks.ts
 *   yarn typecheck:hw3
 */

type Spec = {
  caseId: string;
  project: 'widgets' | 'monolith' | 'explorer';
  durationMs: number;
  retries: number;
};

const SPECS: Spec[] = [
  { caseId: 'C154005', project: 'widgets', durationMs: 42_000, retries: 0 },
  { caseId: 'C85963', project: 'monolith', durationMs: 12_500, retries: 2 },
  { caseId: 'C154002', project: 'widgets', durationMs: 0, retries: 1 },
  { caseId: 'C99001', project: 'explorer', durationMs: 8_100, retries: 0 },
];

// 1. Замените пустой массив на вызов метода, который соберёт идентификаторы:
//    ['C154005', 'C85963', 'C154002', 'C99001'].
const caseIds: string[] = [];
console.log('1 ·', caseIds);

// 2. Оставьте только те спеки, которые перезапускались хотя бы раз.
//    Сначала посчитайте глазами, сколько их должно быть, потом запустите.
const flaky: Spec[] = [];
console.log('2 ·', flaky.map((spec) => spec.caseId));

// 3. Найдите спеку проекта explorer подходящим методом массива.
const explorerSpec: Spec | undefined = undefined;
console.log('3 ·', explorerSpec);

// 4. Эта строка сейчас не компилируется. Почините её, не меняя тип
//    `explorerSpec` и не дописывая `as`. Если спеки нет — должно быть -1.
const duration: number = explorerSpec.durationMs;
console.log('4 · длительность:', duration);

// 5. Вызовите функцию так, чтобы напечаталось:
//        5 · 1. C154005
//        5 · 2. C85963
//        …
//    Нумерация с единицы, а индекс приходит с нуля.
function forEachSpec(specs: Spec[], callback: (spec: Spec, index: number) => void): void {
  for (let i = 0; i < specs.length; i += 1) {
    callback(specs[i], i);
  }
}

// forEachSpec(SPECS, ...);

// 6. ВОПРОС. `callback` объявлен как возвращающий `void`. Передайте колбэк,
//    который возвращает число, — например `(spec, index) => index`.
//    Компилятор промолчит. Почему это не ошибка?
//
//    ОТВЕТ:

export {};
