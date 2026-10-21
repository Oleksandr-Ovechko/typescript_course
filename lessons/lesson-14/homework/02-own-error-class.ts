/**
 * Задание 2 · Свой класс ошибки.
 *
 * Хелпер ищет фикстуру — клиента, класс, бизнес — по имени из .env. Когда
 * фикстуры нет, он должен бросать не общую Error, а свою FixtureGap, чтобы
 * тест мог отличить «нет данных на стенде» от «сломался продукт».
 *
 * Допишите класс FixtureGap — заготовка ниже. Требования:
 *   • наследник Error;
 *   • конструктор принимает имя фикстуры (fixture) и передаёт в Error
 *     сообщение вида: `fixture REGULAR_CLIENT is not provisioned`;
 *   • у экземпляра своё имя — 'FixtureGap', а не 'Error';
 *   • имя фикстуры доступно отдельным полем: gap.fixture.
 *
 *   node lessons/lesson-14/homework/02-own-error-class.ts
 *
 * Готово, когда все проверки внизу печатают ✅.
 */

// ── Ваш класс ─────────────────────────────────────────────────────────────
class FixtureGap extends Error {
  fixture = '';
}

// ── Хелпер, который его бросает (не менять) ───────────────────────────────
const fixtures: Record<string, string | undefined> = { SHARED_CLIENT: 'shared.client@example.test' };
const requireFixture = (key: string) => {
  const value = fixtures[key];
  if (!value) throw new FixtureGap(key);
  return value;
};

// ── Проверки (не менять) ──────────────────────────────────────────────────
const check = (label: string, actual: unknown, expected: unknown) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(ok ? '✅' : '❌', label, ok ? '' : `— сейчас: ${JSON.stringify(actual)}, ждали: ${JSON.stringify(expected)}`);
};
const caught = (() => {
  try {
    requireFixture('REGULAR_CLIENT');
    return null;
  } catch (e) {
    return e;
  }
})();

check('найденная фикстура возвращается', requireFixture('SHARED_CLIENT'), 'shared.client@example.test');
check('ловится как FixtureGap', caught instanceof FixtureGap, true);
check('и как обычная Error', caught instanceof Error, true);
check('своё имя, а не Error', caught instanceof Error ? caught.name : null, 'FixtureGap');
check('сообщение собрал конструктор', caught instanceof Error ? caught.message : null, 'fixture REGULAR_CLIENT is not provisioned');
check('имя фикстуры отдельным полем', caught instanceof FixtureGap ? caught.fixture : null, 'REGULAR_CLIENT');
check('name — собственное свойство экземпляра', caught instanceof Error ? Object.hasOwn(caught, 'name') : null, true);

// ── Вопрос ────────────────────────────────────────────────────────────────
// В проекте ошибку OverlapRefusal ловят по имени: e.name === 'OverlapRefusal',
// а AchProvisioningGap — по классу: e instanceof AchProvisioningGap.
// Как бы вы ловили FixtureGap и почему? Что нужно, чтобы ловить по классу
// в ДРУГОМ файле?
//
// ответ:

export {};
