/**
 * Урок 6 · Ошибки.
 *
 * Что здесь: try, catch, finally · в catch — unknown, поэтому String(error) ·
 * throw new Error · бросить можно что угодно, но бросают Error · ошибку
 * создают в момент броска · ошибка летит наверх: try снаружи цикла и внутри ·
 * бросить пойманную дальше · пустой catch.
 *
 *   node lessons/lesson-06/examples/04-errors.ts   запустить
 *   yarn typecheck                                 проверить типы
 */

// ── try, catch, finally ────────────────────────────────────────────────────
//   try { … }            «попробуй». Ошибка в любой строке обрывает блок на ней
//   catch (error) { … }  только если в try бросили ошибку; в error — брошенное
//   finally { … }        ВСЕГДА — после try или после catch
// Дальше программа идёт как обычно.
const user = {
  name: 'Ann',
  greet(): string {
    return `Привет, я ${this.name}`;
  },
};
const greetLater = user.greet;

try {
  console.log('1) до');
  console.log(greetLater()); // метод без точки — TypeError (01-this-call-apply-bind.ts)
  console.log('не напечатается: после ошибки');
} catch (error) {
  console.log('2) поймали:', String(error));
} finally {
  console.log('3) finally — всегда');
}
console.log('4) файл живёт дальше');
// 1) до
// 2) поймали: TypeError: Cannot read properties of undefined (reading 'name')
// 3) finally — всегда
// 4) файл живёт дальше
//
// TypeError — вид ошибки, после двоеточия — её сообщение. Это ошибка
// JavaScript при выполнении; с проверкой типов TypeScript её роднит только
// название. Ещё один вид — ReferenceError: так движок отвечает на имя,
// которое нигде не объявлено или ещё в мёртвой зоне (урок 4). Необъявленное
// имя у нас раньше ловит TypeScript — TS2304.

// ── В catch — unknown ──────────────────────────────────────────────────────
// Бросить можно что угодно, хоть строку. Поэтому TypeScript не знает, что
// прилетит в catch, и даёт error тип unknown: читать .message он не разрешит.
// String(...) из урока 2 работает с чем угодно. Как проверить, что прилетел
// объект ошибки, — урок 10.
try {
  console.log(greetLater());
} catch (error) {
  // startsWith — метод строки: «начинается ли она с этого текста?»
  // ❌ TS18046: 'error' is of type 'unknown'.
  // console.log(error.message);
  console.log('5)', String(error).startsWith('TypeError')); // 5) true
}

// ── throw new Error — бросить свою ─────────────────────────────────────────
// 12 / 0 в JavaScript — не ошибка, а Infinity. Ошибкой его делаем мы:
// решили, что такой результат дальше пускать нельзя, и бросили throw.
console.log('6)', 12 / 0); // 6) Infinity

function divide(total: number, parts: number): number {
  if (parts === 0) {
    throw new Error('делить на ноль нельзя');
  }
  return total / parts;
}

// Сам по себе new Error(...) ничего не обрывает — это просто объект с message.
// Обрывает только throw.
const plainError = new Error('просто объект');
console.log('7)', typeof plainError, plainError.message); // 7) object просто объект

try {
  console.log('8)', divide(12, 4));
  console.log('не напечатается:', divide(12, 0));
} catch (divideError) {
  console.log('9) поймали своё:', String(divideError));
}
// 8) 3
// 9) поймали своё: Error: делить на ноль нельзя
//
// Зачем бросать, если можно напечатать? console.log ничего не останавливает:
// код пойдёт дальше с плохим значением и сломается позже, в другом месте.
// throw останавливает ЗДЕСЬ, с вашим текстом про причину. В тесте так и
// выглядит падение: строка бросила ошибку — тест красный, с этим сообщением.

// ── Бросают Error, а не строку ─────────────────────────────────────────────
// throw 'текст' бросает саму строку: ни во что она не заворачивается.
// У неё нет ни message, ни записи о месте, где её бросили.
try {
  throw 'нет связи';
} catch (thrown) {
  console.log('10)', typeof thrown, thrown); // 10) string нет связи
}

// ── Ошибку создают в момент броска ─────────────────────────────────────────
// Объект Error запоминает место (стек вызовов), где его СОЗДАЛИ, а не где
// бросили. Поэтому new Error пишут прямо в throw, как в divide.
// Стек лежит строкой в свойстве .stack — это то, что node печатает под
// упавшей ошибкой: «at имяФункции (файл:строка)». includes у строки, как
// у массива (урок 2), — «есть ли в ней этот текст?».
function makeError(): Error {
  return new Error('создана внутри makeError');
}
const madeEarly = new Error('создана на верхнем уровне');
console.log('11)', makeError().stack?.includes('makeError'), madeEarly.stack?.includes('makeError'));
// 11) true false
//
// Заранее созданная ошибка — к тому же один объект на всех бросков. Поменяли
// его в одном месте — изменилось у всех следующих:
const sharedError = new Error('делить на ноль нельзя');
function divideShared(total: number, parts: number): number {
  if (parts === 0) {
    throw sharedError;
  }
  return total / parts;
}
try {
  divideShared(1, 0);
} catch {
  sharedError.message = 'кто-то поменял сообщение';
}
try {
  divideShared(2, 0);
} catch (secondError) {
  console.log('12)', String(secondError)); // 12) Error: кто-то поменял сообщение
}

// ── Ошибка летит наверх: снаружи цикла или внутри ──────────────────────────
// throw внутри divide → из функции туда, откуда её вызвали → ближайший try
// снаружи ловит; нет его — следующий, и так до самого верха. Никто не поймал —
// файл упал (как greetLater() без try).
const portions = [4, 0, 2];

// try СНАРУЖИ цикла — ошибка обрывает весь цикл: до 2 не дошли.
try {
  for (const portion of portions) {
    console.log('13)', divide(12, portion));
  }
} catch (loopError) {
  console.log('14) цикл прерван:', String(loopError));
}
// 13) 3
// 14) цикл прерван: Error: делить на ноль нельзя

// try ВНУТРИ цикла — ошибка обрывает только этот проход, цикл идёт дальше.
// catch без (переменной) — можно, когда неважно, что именно упало.
for (const portion of portions) {
  try {
    console.log('15)', divide(12, portion));
  } catch {
    console.log('15) пропустили', portion);
  }
}
// 15) 3
// 15) пропустили 0
// 15) 6

// ── Бросить пойманную дальше ───────────────────────────────────────────────
// В catch пойманное можно бросить ещё раз — throw error. Тогда его ловит
// следующий try снаружи, по той же схеме.
function divideAndLog(total: number, parts: number): number {
  try {
    return divide(total, parts);
  } catch (error) {
    console.log('16) записали в лог:', String(error));
    throw error;
  }
}
try {
  divideAndLog(5, 0);
} catch (outerError) {
  console.log('17) поймали снаружи:', String(outerError));
}
// 16) записали в лог: Error: делить на ноль нельзя
// 17) поймали снаружи: Error: делить на ноль нельзя

// ── Пустой catch ───────────────────────────────────────────────────────────
// catch {} глотает любую ошибку молча: код идёт дальше, как будто её не было,
// и найти потом причину почти невозможно. Внутри должно быть хоть что-то:
// сообщение или хотя бы комментарий, почему ошибка здесь не важна.

export {};
