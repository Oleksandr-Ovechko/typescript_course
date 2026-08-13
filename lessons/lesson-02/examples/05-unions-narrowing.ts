/**
 * Урок 2 · Блок 3 — union, литеральные типы, почему не enum, сужение, never.
 *
 * Что здесь: `'Email' | 'SMS' | 'Push'` вместо enum · `as const` и
 * `keyof typeof` · `Record<Union, T>` как таблица, которую нельзя
 * недозаполнить · сужение через typeof / литерал / instanceof ·
 * проверка полноты через never.
 *
 * ВАЖНО про enum: он не «сломает тест». Playwright транспилирует через babel
 * и enum под ним работает. Мы его не пишем по конвенции проекта — union
 * даёт ту же защиту, но не оставляет следа в рантайме. Подробности —
 * в broken/02-enum.ts.
 */

// ── Union — «или то, или это» ──────────────────────────────────────────────
type Id = string | number;
const numericId: Id = 42;
const textId: Id = 'C154002';
console.log('union:', numericId, textId);

// ── Литеральные типы ───────────────────────────────────────────────────────
type ExactlyEmail = 'Email';
const onlyEmail: ExactlyEmail = 'Email';
console.log('литеральный тип:', onlyEmail);

type QuickContactSource = 'Email' | 'SMS' | 'Push';

async function openQuickContact(source: QuickContactSource): Promise<void> {
  console.log('открываем Quick Contact через', source);
}

void openQuickContact('SMS');

// ❌ TS2345: 'Telegram' не входит в 'Email' | 'SMS' | 'Push'
// void openQuickContact('Telegram');

// ❌ TS2345: регистр тоже имеет значение
// void openQuickContact('sms');

// ── Почему не enum ─────────────────────────────────────────────────────────
const SIZE = { S: 1, M: 2, L: 3 } as const;

type SizeName = keyof typeof SIZE;
type SizeValue = (typeof SIZE)[SizeName];

function createOrder(name: string, size: SizeValue): string {
  return `${name} / размер ${size}`;
}
console.log('вместо enum:', createOrder('Футболка WL', SIZE.M));

// ❌ TS2345: 99 не входит в 1 | 2 | 3
// createOrder('Футболка WL', 99);

const SETTINGS_SECTIONS = ['Lead form behavior', 'Form Settings', 'Thank you message customization'] as const;
type SettingsSection = (typeof SETTINGS_SECTIONS)[number];

const section: SettingsSection = 'Form Settings';
console.log('union из массива:', section, '· всего секций:', SETTINGS_SECTIONS.length);

// ── Record<Union, T> ───────────────────────────────────────────────────────
const GROUP_QUICK_CONTACT_SOURCE_CLASS: Record<QuickContactSource, string> = {
  Email: 'css-group-quick-contact-mail',
  SMS: 'css-group-quick-contact-sms',
  Push: 'css-group-quick-contact-push',
};
console.log('селектор по источнику:', GROUP_QUICK_CONTACT_SOURCE_CLASS.Push);

// ── Сужение (narrowing) ────────────────────────────────────────────────────
function describeId(id: string | number): string {
  // ❌ TS2339: 'toUpperCase' не существует у типа 'string | number'
  // id.toUpperCase();

  if (typeof id === 'string') {
    return `текстовый: ${id.toUpperCase()}`;
  }
  return `числовой: ${id.toFixed(0)}`;
}
console.log('сужение по typeof:', describeId('c154002'), '|', describeId(42));

function identityFor(kind: 'admin' | 'user', login: string | undefined): string {
  if (kind === 'admin') {
    return 'admin';
  }
  if (!login) {
    throw new Error(`identityFor('user', ...) требует login`);
  }
  return login;
}
console.log('сужение по литералу:', identityFor('admin', undefined), identityFor('user', 'qa@wl.com'));

try {
  JSON.parse('{');
} catch (error) {
  console.log('сужение по instanceof:', error instanceof Error ? error.message : 'не Error');
}

// ── never и проверка полноты ───────────────────────────────────────────────
function selectorFor(source: QuickContactSource): string {
  switch (source) {
    case 'Email':
      return 'css-group-quick-contact-mail';
    case 'SMS':
      return 'css-group-quick-contact-sms';
    case 'Push':
      return 'css-group-quick-contact-push';
    default: {
      const exhaustive: never = source;
      throw new Error(`Неизвестный источник: ${String(exhaustive)}`);
    }
  }
}
console.log('exhaustiveness check:', selectorFor('Email'));

// Файл заканчивается пустым `export {};` — без него он считался бы глобальным
// скриптом, и его объявления столкнулись бы с соседними примерами и с вашим
// playground/scratch.ts (ошибка TS2451 «Cannot redeclare»). Одна строка
// делает файл модулем, и все имена становятся локальными.
export {};
