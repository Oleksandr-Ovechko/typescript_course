/**
 * Урок 3 · Массив и циклы.
 *
 * Что здесь: длина и край массива, `push` · `for` со счётчиком и три части
 * его заголовка · `break` и потолок попыток · `while` · `for...of`,
 * `continue` · `for...in` и почему по массиву через него не ходят.
 *
 *   node lessons/lesson-03/examples/05-arrays-and-loops.ts   запустить
 *   yarn typecheck                                           проверить типы
 */

// ── Массив: длина, край, push ──────────────────────────────────────────────
// Индексы считаются с нуля, поэтому последний элемент — length - 1.
// За краем массива не ошибка, а undefined. Для TypeScript caseIds[99] —
// строка, а на деле там undefined: TypeScript здесь не поможет.
const caseIds = ['C157112', 'C22041', 'C19877'];
console.log('1)', caseIds.length, caseIds[0], caseIds[caseIds.length - 1], caseIds[99]); // 1) 3 C157112 C19877 undefined
console.log('2)', caseIds[caseIds.length]); // 2) undefined

// push дописывает элемент в конец. Массив объявлен через const и всё равно
// меняется: const запрещает положить под имя ДРУГОЙ массив, но не менять этот.
caseIds.push('C21532');
console.log('3)', caseIds.length); // 3) 4

// ── for со счётчиком ───────────────────────────────────────────────────────
// В скобках — заголовок из трёх частей, и выполняются они в разное время:
//   let index = 0             один раз, до первого прохода
//   index < caseIds.length    ПЕРЕД каждым проходом; false — цикл закончен
//   index++                   ПОСЛЕ каждого прохода; то же, что index = index + 1
for (let index = 0; index < caseIds.length; index++) {
  console.log('4)', index, caseIds[index]);
}
// 4) 0 C157112
// 4) 1 C22041
// 4) 2 C19877
// 4) 3 C21532

// С <= вместо < проходов на один больше: при index === 4 условие 4 <= 4 —
// true, и цикл читает индекс за краем. Ошибки нет, есть тихий undefined.
for (let index = 3; index <= caseIds.length; index++) {
  console.log('5)', index, caseIds[index]);
}
// 5) 3 C21532
// 5) 4 undefined

// Если условие ложно с первой же проверки, тело не выполнится ни разу:
// 0 > 4 — false, цикл сразу закончился. Бесконечным он не станет.
let passes = 0;
for (let index = 0; index > caseIds.length; index++) {
  passes++;
}
console.log('6)', passes); // 6) 0

// ── break и потолок ────────────────────────────────────────────────────────
// Самый частый цикл в тестах — повтор: попробовать, и если получилось —
// перестать. Вместо настоящего поиска — заранее записанные ответы:
// на первой попытке клиента не нашли, со второй нашли.
// break — выйти из цикла сейчас, не дожидаясь условия в заголовке.
// attempt <= 3 — потолок: больше трёх попыток не будет, даже если не нашли.
const searchHits: boolean[] = [false, true, true];
let clientFound = false;
for (let attempt = 1; attempt <= 3; attempt++) {
  clientFound = searchHits[attempt - 1];
  console.log('7) попытка', attempt, '→', clientFound);
  if (clientFound) {
    break;
  }
}
console.log('8) найден:', clientFound);
// 7) попытка 1 → false
// 7) попытка 2 → true
// 8) найден: true

// ── while — когда счётчика нет ─────────────────────────────────────────────
// Проверяет условие; если true — выполняет тело и проверяет снова.
// Останавливается по условию, как for — по средней части заголовка.
// pollNo < 10 — потолок. Без него, если 'ready' не придёт никогда, цикл
// не кончится, и терминал повиснет: остановить — Ctrl+C.
const statusFeed: string[] = ['loading', 'loading', 'ready'];
let pollNo = 0;
while (statusFeed[pollNo] !== 'ready' && pollNo < 10) {
  pollNo++;
}
console.log('9) ready на опросе №', pollNo + 1); // 9) ready на опросе № 3

// ── for...of и continue ────────────────────────────────────────────────────
// На каждом проходе в queuedCase лежит очередной ЭЛЕМЕНТ. Индекса нет,
// поэтому выйти за край нельзя.
// continue заканчивает ЭТОТ проход и переходит к следующему,
// break обрывает весь цикл.
const queue = ['C1', 'skip', 'C2', 'stop', 'C3'];
const taken: string[] = [];
for (const item of queue) {
  if (item === 'skip') {
    continue;
  }
  if (item === 'stop') {
    break;
  }
  taken.push(item);
}
console.log('10)', taken.join(',')); // 10) C1,C2

// continue и break — не особенность for...of: они работают в любом цикле.
const evenPolls: number[] = [];
let poll = 0;
while (poll < 5) {
  poll++;
  if (poll % 2 === 1) {
    continue;
  }
  evenPolls.push(poll);
}
console.log('11)', evenPolls.join(',')); // 11) 2,4

// for...of ходит не только по массивам, но и по всему, что можно перебрать.
// Например, по строке — символ за символом. Как это устроено — урок про итераторы.
const letters: string[] = [];
for (const letter of 'C19') {
  letters.push(letter);
}
console.log('12)', letters.join(' ')); // 12) C 1 9

// ── for...in — ключи, а не элементы ────────────────────────────────────────
// for...in даёт КЛЮЧИ: у объекта — имена полей, у массива — индексы.
// И ключи всегда СТРОКИ: '0', '1'. Поэтому key + 1 склеивает, а не складывает.
// По массиву ходят через for...of; for...in — для объектов (урок про объекты).
const names = ['x', 'y'];
for (const key in names) {
  console.log('13)', typeof key, key, key + 1);
}
// 13) string 0 01
// 13) string 1 11

export {};
