/**
 * Задание 3 · Починить три спека.
 *
 * Три упрощённые модели настоящих тестов. В каждой ровно один баг,
 * и все три — с этого урока.
 *
 *   node lessons/lesson-06/homework/03-fix-three-specs.ts   запустить
 *   yarn typecheck:hw6                                      проверить типы
 *
 * Готово, когда файл печатает четыре ✅ и ни одного ❌.
 *
 * ⚠️ `yarn typecheck:hw6` проходит и ДО того, как вы что-нибудь почините
 * (кроме задания 2). Это не сбой проверки — это тема урока: все три бага
 * компилятор считает совершенно законным кодом. Единственный сигнал —
 * проверки внизу файла.
 *
 * Код проверок трогать нельзя: чинить нужно сами спеки.
 */

const log: string[] = [];

// ── Баг 1. Флаг не сбрасывается между тестами ─────────────────────────────
// Два теста в одном describe. Второй должен видеть чистое состояние,
// а видит следы первого.
//
// Подсказка: конспект, «Общая переменная между хуками». Вопрос ровно один —
// кто и когда сбрасывает переменную.

function specWithFlag(): void {
  let bookingMade = false;

  const afterEach = (): void => {
    log.push(`afterEach: bookingMade=${bookingMade}`);
  };

  const testOne = (): void => {
    log.push(`тест 1 стартовал с bookingMade=${bookingMade}`);
    bookingMade = true;
  };

  const testTwo = (): void => {
    log.push(`тест 2 стартовал с bookingMade=${bookingMade}`);
  };

  testOne();
  afterEach();
  testTwo();
  afterEach();
}

// ── Баг 2. Значение из beforeAll в имени теста ────────────────────────────
// В имени теста стоит undefined. Порядок вызовов менять нельзя: в настоящем
// Playwright beforeAll выполняется уже после сборки, и подвинуть его вверх
// не получится. Значит, чинить надо саму запись.
//
// Готово, когда в имени теста нет undefined, а скин по-прежнему проверяется.
//
// Подсказка: конспект, «Тело describe выполняется раньше тестов». Строку
// читают сразу, функцию — потом. Значит, значению место в теле, а не в имени.

function specWithName(): void {
  const collected: Array<{ name: string; body: () => void }> = [];
  let skinName: string | undefined;

  const beforeAll = (): void => {
    skinName = 'christmas';
  };

  const test = (name: string, body: () => void): void => {
    collected.push({ name, body });
  };

  // ↓ тело describe: выполняется прямо сейчас, до всех тестов
  test(`проверяем скин ${skinName}`, () => {
    log.push(`тело теста видит skinName=${String(skinName)}`);
  });

  // ↓ а это уже выполнение
  beforeAll();
  for (const spec of collected) {
    log.push(`имя теста: ${spec.name}`);
    spec.body();
  }
}

// ── Баг 3. Потерянный this, и починить нужно ДВУМЯ способами ──────────────
// Метод передают колбэком, и он теряет свой объект. Способа два — bind
// и стрелочная обёртка, — и оба должны заработать. В ответе к домашке
// напишите, чем они отличаются.
//
// Подсказка: конспект, «Вызвали без объекта» и «bind».

type Reporter = { suite: string; report(): string };

const reporter: Reporter = {
  suite: 'widgets',
  report(): string {
    return `отчёт по ${this.suite}`;
  },
};

// Модель чужого хелпера: он просто вызовет то, что ему дали.
function runCallback(callback: () => string): string {
  try {
    return callback();
  } catch (error) {
    return `упало: ${(error as Error).message}`;
  }
}

const viaBind = runCallback(reporter.report);       // ← починить через bind
const viaArrow = runCallback(reporter.report);      // ← починить стрелочной обёрткой

// ── Проверки. Трогать нельзя ──────────────────────────────────────────────

const check = (label: string, condition: boolean, hint: string): void =>
  console.log(condition ? '✅' : '❌', label, condition ? '' : `— ${hint}`);

specWithFlag();
specWithName();

check(
  'баг 1: второй тест стартует с чистым флагом',
  log.includes('тест 2 стартовал с bookingMade=false'),
  `сейчас: ${log.filter((l) => l.startsWith('тест 2')).join('') || 'тест 2 не запускался'}`,
);

check(
  'баг 2: в имени теста нет undefined, а тело видит скин',
  !log.some((l) => l.startsWith('имя теста') && l.includes('undefined')) &&
    log.includes('тело теста видит skinName=christmas'),
  `сейчас: ${log.filter((l) => l.startsWith('имя теста')).join('') || 'имени нет'}`,
);

check('баг 3a: через bind', viaBind === 'отчёт по widgets', `сейчас: ${viaBind}`);
check('баг 3b: через стрелку', viaArrow === 'отчёт по widgets', `сейчас: ${viaArrow}`);

export {};
