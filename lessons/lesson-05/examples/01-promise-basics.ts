/**
 * Урок 5 · Промис — что это на самом деле.
 *
 * Что здесь: анатомия `new Promise` · исполнитель идёт сразу · три состояния
 * и один переход · результат считается один раз · `await` над не-промисом ·
 * `Promise.resolve` и `Promise.reject`.
 *
 *   node lessons/lesson-05/examples/01-promise-basics.ts     запустить
 *   yarn typecheck                                           проверить типы
 */

// ── Анатомия: одна функция, две ветки ──────────────────────────────────────
//
//   const p = new Promise((resolve, reject) => {
//                 │         │        │
//                 │         │        └─ вызвать, когда не получилось
//                 │         └─ вызвать, когда получилось
//                 └─ функция-исполнитель: движок вызывает её сам и сразу
//     // здесь запускается работа
//   });
//
// resolve и reject — не ключевые слова, а обычные параметры. Имена могут быть
// любые, так их называют по традиции.
function loadPrice(shouldFail: boolean): Promise<number> {
  return new Promise((resolve, reject) => {
    setTimeout(() => (shouldFail ? reject(new Error('сервер не ответил')) : resolve(19.99)), 10);
  });
}

console.log('1)', await loadPrice(false));
console.log('2)', await loadPrice(true).catch((error: Error) => `отказ: ${error.message}`));

// Promise<number> в сигнатуре — это тип того, что окажется внутри ПРИ УСПЕХЕ.
// Тип отказа TypeScript не отслеживает вообще: в .catch(f) параметр объявлен
// как any, а в обычном catch (error) при strict он unknown. Отсюда
// (error as Error).message по всему проекту — компилятор про ошибку не знает.

// ── Промис — уже запущенная работа, а не рецепт ────────────────────────────
// Главное отличие от функции. Функцию можно объявить и не вызвать — ничего
// не произойдёт. Промис начинает работу в момент создания.
const started = new Promise<string>((resolve) => {
  console.log('3) исполнитель пошёл прямо сейчас');
  setTimeout(() => resolve('готово'), 100);
});
console.log('4) а await ещё не написан');
console.log('5)', await started);

// await не запускает работу, он её дожидается.

// ── Три состояния, и меняются они один раз ─────────────────────────────────
// pending — в работе, fulfilled — успех, rejected — отказ. Переход происходит
// один раз и назад не отматывается.
const onlyOnce = new Promise<string>((resolve) => {
  resolve('первое');
  resolve('второе'); // не ошибка и не эффект — просто ничего не делает
});
console.log('6)', await onlyOnce);

// Промис до и после завершения — снаружи это разные вещи.
const inFlight = new Promise<string>((resolve) => setTimeout(() => resolve('поздно'), 20));
console.log('7) пока не дождались:', inFlight);
console.log('8) после await     :', await inFlight);

// ── Результат считается один раз и запоминается ────────────────────────────
// Интуиция подсказывает, что второй await запустит работу заново — как второй
// вызов функции. Нет: промис уже отработал, второй await берёт готовое.
let executorCalls = 0;
const cached = new Promise<string>((resolve) => {
  executorCalls += 1;
  setTimeout(() => resolve('посчитано'), 50);
});
console.log('9)', await cached, '·', await cached, '· исполнитель вызван раз:', executorCalls);

// А если промис ещё в работе, когда его ждут второй раз? Оба await дождутся
// одного и того же завершения. Работа не удваивается никогда — она вообще
// не привязана к await.

// ── await можно применить к чему угодно ────────────────────────────────────
// Не-промис заворачивается в уже выполненный промис.
console.log('10)', await 5);

// Полезно знать, потому что в чужом коде встречается await над функцией,
// которая может вернуть и промис, и значение — работает в обоих случаях.

// ── Promise.resolve и Promise.reject — готовый промис в одну строку ────────
// Нужны там, где функция обязана вернуть промис, а ждать нечего: не приходится
// расширять тип до «либо промис, либо значение».
function cachedPrice(known: number | undefined): Promise<number> {
  if (known !== undefined) {
    return Promise.resolve(known); // уже успешный, ждать нечего
  }
  return loadPrice(false);
}
console.log('11)', await cachedPrice(5), '·', await cachedPrice(undefined));

// В wl-e2e ни Promise.resolve, ни Promise.reject не встречаются ни разу.
// И сам new Promise — десять раз на весь проект. Уметь надо ЧИТАТЬ чужие
// промисы, а не создавать свои.

export {};
