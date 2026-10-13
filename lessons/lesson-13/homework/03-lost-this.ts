/**
 * Задание 3 · Найти потерю this.
 *
 * Три фрагмента. В ДВУХ из них метод оторван от объекта и падает, в одном
 * всё в порядке. Запустите, найдите два сломанных, объясните — и почините.
 *
 *   node lessons/lesson-13/homework/03-lost-this.ts
 *
 * Готово, когда все три фрагмента печатают ✅ и под каждым записано, чему
 * был равен this в момент вызова.
 *
 * Чинить можно только строку с пометкой «чинить здесь». Класс не менять.
 */

class StepLog {
  private readonly steps: string[] = [];
  add(step: string) {
    this.steps.push(step);
  }
  count() {
    return this.steps.length;
  }
}

const attempt = (label: string, expected: unknown, fn: () => unknown) => {
  let actual: unknown;
  try {
    actual = fn();
  } catch (error) {
    actual = `упал: ${(error as Error).message}`;
  }
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(ok ? '✅' : '❌', label, ok ? '' : `— сейчас: ${JSON.stringify(actual)}, ждали: ${JSON.stringify(expected)}`);
};

// ── Фрагмент A ────────────────────────────────────────────────────────────
attempt('A: три шага записаны через forEach', 3, () => {
  const log = new StepLog();
  const steps = ['open widget', 'pick class', 'book'];
  steps.forEach(log.add); // чинить здесь
  return log.count();
});
// this в момент вызова был:
// почему:

// ── Фрагмент B ────────────────────────────────────────────────────────────
attempt('B: шаги записаны через map со стрелкой', 2, () => {
  const log = new StepLog();
  const steps = ['open profile', 'add note'];
  steps.map((step) => log.add(step)); // чинить здесь
  return log.count();
});
// this в момент вызова был:
// почему:

// ── Фрагмент C ────────────────────────────────────────────────────────────
attempt('C: метод вынесен в переменную', 1, () => {
  const log = new StepLog();
  log.add('open store');
  const { count } = log; // чинить здесь
  return count();
});
// this в момент вызова был:
// почему:

// ── Вопрос ────────────────────────────────────────────────────────────────
// В wl-e2e пишут `await page.getByRole('button', { name: 'Save' }).click()`.
// Что будет, если написать так — и на какой из трёх фрагментов это похоже?
//
//   const { getByRole } = page;
//   await getByRole('button', { name: 'Save' }).click();
//
// ответ:

export {};
