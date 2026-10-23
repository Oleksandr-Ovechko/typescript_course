/**
 * Домашка урока 5 · Задание 3 — написать два хелпера.
 *
 * Готово, когда: файл печатает четыре строки «✅», в конце не бросает Error,
 * и `yarn typecheck:hw5` чист.
 *
 *   node lessons/lesson-05/homework/03-write-two-helpers.ts
 *   yarn typecheck:hw5
 *
 * Оба хелпера — модели настоящего кода из wl-e2e. Playwright сюда не тянем:
 * вместо локатора маленькая заглушка с одним методом waitFor, которая либо
 * молча проходит, либо бросает — ровно как настоящая.
 */

const pause = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
const rejectAfter = (ms: number, message: string): Promise<never> =>
  new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms));

type FakeLocator = { waitFor: () => Promise<void> };

const appearsIn = (ms: number): FakeLocator => ({ waitFor: () => pause(ms) });
const neverAppears = (): FakeLocator => ({
  waitFor: () => rejectAfter(30, 'Timeout 15000ms exceeded'),
});

// ── А. elementExists ───────────────────────────────────────────────────────
//
// Написать функцию, которая превращает «бросил или не бросил» в true/false.
// Это идиом из полутора тысяч файлов проекта (на 22.10.2026):
//
//   const hasAgreementToSign = await page
//     .locator('button.js-button-sign')
//     .waitFor({ state: 'visible', timeout: 15_000 })
//     .then(() => true)
//     .catch(() => false);
//
// Условия:
//   · элемент появился  → true
//   · элемент не появился (waitFor бросил) → false, наружу ничего не летит
//   · написать через .then/.catch, а не через try/catch — так это выглядит
//     в проекте, и по этой записи вы будете его узнавать
//
// Замените throw своей реализацией.
async function elementExists(locator: FakeLocator): Promise<boolean> {
  throw new Error('задание А ещё не сделано');
}

// ── Б. whichScreen ─────────────────────────────────────────────────────────
//
// Написать функцию, которая ставит два ожидания в гонку и возвращает имя того
// экрана, который появился первым. Модель настоящего кода:
//
//   // projects/widgets/setup-run/001-default-business/default-business.helpers.ts:41
//   const destination = await Promise.race([
//     page.locator('button.js-button-sign').waitFor({ state: 'visible' }).then(() => 'agreement' as const),
//     page.getByText('Add Payment Method', { exact: true }).waitFor({ state: 'visible' }).then(() => 'store-settings' as const),
//   ]);
//
// Условия:
//   · вернуть 'agreement' или 'store-settings' — что появилось первым
//   · тип результата — именно union из двух строк, а НЕ Promise<string>.
//     Тип возврата у функции намеренно не написан: он выводится из тела.
//     Забыли as const — вывелся string, и проверка типов внизу файла
//     не скомпилируется (TS2322) — так и задумано
//   · as const — с урока 2
//
// Замените return своей реализацией.
async function whichScreen(agreement: FakeLocator, storeSettings: FakeLocator) {
  return Promise.reject(new Error('задание Б ещё не сделано'));
}

// ───────────────────────────────────────────────────────────────────────────
// Ниже ничего не меняем: это проверки.
// ───────────────────────────────────────────────────────────────────────────

const failures: string[] = [];

function check(name: string, passed: boolean, got: unknown): void {
  if (passed) {
    console.log(`✅ ${name}`);
    return;
  }
  console.log(`❌ ${name} — получили:`, got);
  failures.push(name);
}

const found = await elementExists(appearsIn(10)).catch((error: Error) => `бросило: ${error.message}`);
check('А. элемент появился → true', found === true, found);

const missing = await elementExists(neverAppears()).catch((error: Error) => `бросило: ${error.message}`);
check('А. элемент не появился → false, наружу ничего не улетело', missing === false, missing);

const first = await whichScreen(appearsIn(60), appearsIn(10)).catch((error: Error) => `бросило: ${error.message}`);
check('Б. первым появился store-settings', first === 'store-settings', first);

const second = await whichScreen(appearsIn(10), appearsIn(60)).catch((error: Error) => `бросило: ${error.message}`);
check('Б. первым появился agreement', second === 'agreement', second);

// Проверка типа, а не значения. Если whichScreen возвращает string (забыли
// as const или написали Promise<string>), строка ниже не скомпилируется:
// TS2322: Type 'string' is not assignable to type '"agreement" | "store-settings"'.
const screen: 'agreement' | 'store-settings' = await whichScreen(appearsIn(10), appearsIn(60));
void screen;

if (failures.length > 0) {
  throw new Error(`ещё не сделано: ${failures.join(' · ')}`);
}

console.log('\nОба хелпера написаны.');

export {};
