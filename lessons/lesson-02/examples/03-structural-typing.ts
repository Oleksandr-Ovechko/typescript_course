/**
 * Урок 2 · Блок 1.8 — структурная типизация.
 *
 * TS сверяет ФОРМУ, а не имя типа. Здесь же — excess property check, из-за
 * которого один и тот же объект через переменную проходит, а литералом нет.
 * Результат здесь легко угадать неверно — запустите оба варианта
 * и посмотрите своими глазами. Обе проверки делает TypeScript при компиляции.
 */

// ── Структурная типизация и excess property check ──────────────────────────
type Point = { x: number; y: number };
type Coordinate = { x: number; y: number };

const point: Point = { x: 1, y: 2 };
const coordinate: Coordinate = point;
console.log('Point подошёл под Coordinate:', coordinate);

const withExtra = { x: 1, y: 2, z: 3 };
const asPoint: Point = withExtra;
console.log('лишнее поле проехало:', asPoint);

// ❌ TS2353: Object literal may only specify known properties
// const asPointLiteral: Point = { x: 1, y: 2, z: 3 };

type WidgetConfig = { showPrice: boolean; showSpots: boolean };

// ❌ TS2561: 'showSpot' не существует. Имелось в виду 'showSpots'?
// const typo: WidgetConfig = { showPrice: true, showSpot: false };

const config: WidgetConfig = { showPrice: true, showSpots: false };
console.log('корректный конфиг:', config);

type OpenWidgetOpts = { locale: string; embedMode: 'iframe' | 'inline' };

function openWidget(opts: OpenWidgetOpts): string {
  return `${opts.embedMode}/${opts.locale}`;
}

console.log('корректный вызов:', openWidget({ locale: 'en', embedMode: 'iframe' }));

// ❌ TS2353: лишнее поле 'debug' в литерале аргумента
// openWidget({ locale: 'en', embedMode: 'iframe', debug: true });

// Файл заканчивается пустым `export {};` — без него он считался бы глобальным
// скриптом, и его объявления столкнулись бы с соседними примерами и с вашим
// playground/scratch.ts (ошибка TS2451 «Cannot redeclare»). Одна строка
// делает файл модулем, и все имена становятся локальными.
export {};
