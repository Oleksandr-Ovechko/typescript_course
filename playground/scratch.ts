/**
 * Урок 6. `call`, `apply`, `bind`, деструктуризация, обход объекта, ошибки
 *
 * Код закомментирован: раскомментируйте нужный кусок и запустите.
 *
 *   node playground/scratch.ts      запустить
 *   yarn typecheck                  проверить типы
 */

// ── Блок 1. Повторение урока 5 ──────────────────────────────────────────────────

// ── 1.1 Три правила урока 5 ─────────────────────────────────────────────────────

// function makeCounter(): () => number {
//   let calls = 0;
//   return () => {
//     calls = calls + 1;
//     return calls;
//   };
// }
// const tick = makeCounter();
// tick();
// console.log('1)', tick());

// const colors = ['red', 'green'];
// const sameColors = colors;
// sameColors.push('blue');
// const colorsCopy = [...colors];
// console.log('2)', colors, colors === sameColors, colors === colorsCopy, typeof colors);

// const user = {
//   name: 'Ann',
//   greet(): string {
//     return `Привет, я ${this.name}`;
//   },
// };
// console.log('3)', user.greet());

/*
   замыкание  — функция помнит окружение места, где её НАПИСАЛИ   tick видит calls
   ссылка     — переменная хранит не объект, а ссылку на него       sameColors — тот же массив
   this       — то, что слева от точки в момент ВЫЗОВА             user.greet() → this = user
*/

// ── Блок 2. call, apply, bind ───────────────────────────────────────────────────

// ── 2.1 Метод отдали колбэком ───────────────────────────────────────────────────

// function runLater(action: () => string): string {
//   return action();
// }
// console.log('4)', runLater(() => user.greet()));

// ── 2.2 call и apply — задать this вручную ──────────────────────────────────────

// function greetFrom(this: { name: string }, greeting: string, ending: string): string {
//   return `${greeting}, я ${this.name}${ending}`;
// }
// const ann = { name: 'Ann' };
// const bob = { name: 'Bob' };
// console.log('5)', greetFrom.call(ann, 'Привет', '!'));
// console.log('6)', greetFrom.apply(bob, ['Hello', '.']));
// console.log('7)', greetFrom.length);

// ── 2.3 bind — не вызвать, а сделать новую функцию ──────────────────────────────

// const annGreets = greetFrom.bind(ann);
// console.log('8)', annGreets('Хай', '!'), typeof greetFrom.call(ann, 'Хай', '!'), typeof annGreets);
// const rebound = annGreets.bind(bob);
// console.log('9)', rebound('Хай', '?'));
// const fixedGreet = user.greet.bind(user);
// console.log('10)', runLater(fixedGreet));

/*
   f.call(obj, a, b)     вызвать сейчас   → результат
   f.apply(obj, [a, b])  вызвать сейчас   → результат
   f.bind(obj)           НЕ вызывать      → новая функция, this прибит навсегда
*/

// ── Блок 3. Деструктуризация — бегло ────────────────────────────────────────────

// ── 3.1 Объект: по имени ────────────────────────────────────────────────────────

// const order: { item: string; count?: number; note?: string | null; price: number } = {
//   item: 'чай',
//   note: null,
//   price: 40,
// };
// const { item: product, count = 1, note = 'без пометки', ...restOfOrder } = order;

// console.log('11)', product, count, note, restOfOrder);

// ── 3.2 Массив — по позиции, параметр — шаблоном ────────────────────────────────

// const podium = ['Ann', 'Bob', 'Kate', 'Max'];
// const [winner, , third, ...others] = podium;
// console.log('12)', winner, third, others);

// function formatPrice({ amount, currency = 'грн' }: { amount: number; currency?: string }): string {
//   return `${amount} ${currency}`;
// }
// console.log('13)', formatPrice({ amount: 120 }), formatPrice({ currency: '$', amount: 5 }));

// ── Блок 4. Обход объекта и ??= ─────────────────────────────────────────────────

// ── 4.1 for...in — ключи объекта ────────────────────────────────────────────────

// const prices = { tea: 40, coffee: 60 };
// for (const key in prices) {
//   console.log('14)', key);
// }

// ── 4.2 Object.keys, Object.values, Object.entries ──────────────────────────────

// console.log('15)', Object.keys(prices), Object.values(prices));
// for (const [drink, price] of Object.entries(prices)) {
//   console.log('16)', `${drink}: ${price}`);
// }

/*
   Object.entries(prices)  →  [ ['tea', 40], ['coffee', 60] ]
   for (const [drink, price] of …)
              └─ шаблон массива из 3.2: каждая пара → две переменные
*/

// ── 4.3 ??= — дописать, если пусто ──────────────────────────────────────────────

// const settings: { theme?: string; volume?: number } = { volume: 0 };
// settings.theme ??= 'light';
// settings.volume ??= 50;
// const loudSettings: { volume?: number } = { volume: 0 };
// loudSettings.volume ||= 50;

// console.log('17)', settings, loudSettings);

// ── Блок 5. Запас: ошибки — try, catch, throw ───────────────────────────────────

// ── 5.1 try/catch/finally — поймать ошибку ──────────────────────────────────────

/*
   try {
     …код…          ← ошибка в любой строке обрывает try и прыгает в catch
   } catch (error) {
     …только если была ошибка; в error — то, что бросили…
   } finally {
     …ВСЕГДА: была ошибка или нет…
   }
   …дальше программа идёт как обычно
*/

// try {
//   console.log('18) до');
//   console.log(runLater(user.greet));
//   console.log('не напечатается: после ошибки');
// } catch (error) {
//   console.log('19) поймали:', String(error));
// } finally {
//   console.log('20) finally — всегда');
// }
// console.log('21) файл живёт дальше');

// ── 5.2 throw new Error — бросить свою ──────────────────────────────────────────

// function divide(total: number, parts: number): number {
//   if (parts === 0) {
//     throw new Error('делить на ноль нельзя');
//   }
//   return total / parts;
// }
// const plainError = new Error('просто объект');
// console.log('22)', typeof plainError, plainError.message);
// try {
//   console.log('23)', divide(12, 4));
//   console.log('не напечатается:', divide(12, 0));
// } catch (divideError) {
//   console.log('24) поймали своё:', String(divideError));
// }

// ── 5.3 Ошибка летит наверх: снаружи цикла или внутри ───────────────────────────

// const portions = [4, 0, 2];
// try {
//   for (const portion of portions) {
//     console.log('25)', divide(12, portion));
//   }
// } catch (loopError) {
//   console.log('26) цикл прерван:', String(loopError));
// }

// for (const portion of portions) {
//   try {
//     console.log('27)', divide(12, portion));
//   } catch {
//     console.log('27) пропустили', portion);
//   }
// }

/*
   throw  (внутри divide)
     │
     ▼
   из функции — туда, откуда её вызвали
     │
     ▼
   ближайший try снаружи? ── да ──▶ catch ловит; дальше программа идёт как обычно
     │ нет
     ▼
   следующий try снаружи … и так до самого верха
     │ никто не поймал
     ▼
   файл упал (как в 2.1)

   try СНАРУЖИ цикла — ошибка обрывает весь цикл
   try ВНУТРИ цикла  — только этот проход
*/

export {};
