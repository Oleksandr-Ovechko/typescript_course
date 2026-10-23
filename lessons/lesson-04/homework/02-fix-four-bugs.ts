/**
 * Домашка урока 4 · Задание 2 — починить четыре функции.
 *
 * Готово, когда: файл запускается и печатает четыре строки «✅», в конце
 * не бросает Error, и `yarn typecheck:hw4` чист.
 *
 *   node lessons/lesson-04/homework/02-fix-four-bugs.ts
 *   yarn typecheck:hw4
 *
 * В каждой функции ровно ОДИН баг, и все четыре — с этого урока.
 * Менять код проверок внизу файла нельзя: чинить нужно сами функции.
 *
 * Обратите внимание: `yarn typecheck:hw4` до починки показывает ровно одну
 * ошибку. Компилятор поймал один баг из четырёх — какой и почему именно его?
 * Остальные три он считает совершенно законным кодом.
 */

// ── Баг 1. Сумма цен ───────────────────────────────────────────────────────
// Должна вернуть сумму двух цен, округлённую до центов: для 10.1 и 20.2 — '30.30'.
function sumPrices(first: number, second: number): string {
  return first.toFixed(2) + second.toFixed(2);
}

// ── Баг 2. Пустая ячейка таблицы ───────────────────────────────────────────
// Должна вернуть true только для пустой ячейки: пустая строка или одни пробелы.
// Ячейка с текстом '0' — не пустая.
function isEmptyCell(text: string): boolean {
  return text == false;
}

// ── Баг 3. Разделители разрядов ────────────────────────────────────────────
// Должна убрать из суммы все запятые: '1,234,567.89' → '1234567.89'.
function stripThousands(amount: string): string {
  return amount.replace(',', '');
}

// ── Баг 4. Значение по умолчанию ───────────────────────────────────────────
// Должна вернуть число свободных мест; если сервер прислал null — 10.
// Ноль свободных мест — настоящий ответ, а не «значения нет».
function spotsOrDefault(spots: number | null): number {
  return spots || 10;
}

// ───────────────────────────────────────────────────────────────────────────
// Ниже ничего не меняем: это проверки.
// ───────────────────────────────────────────────────────────────────────────

const failures: string[] = [];

function check(number: number, name: string, passed: boolean, got: unknown): void {
  if (passed) {
    console.log(`✅ ${number}. ${name}`);
    return;
  }
  console.log(`❌ ${number}. ${name} — получили:`, got);
  failures.push(`${number}. ${name}`);
}

const total = sumPrices(10.1, 20.2);
check(1, 'sumPrices складывает, а не склеивает', total === '30.30', total);

const cells = ['', '   ', '0', 'Yoga'].map((text) => isEmptyCell(text));
check(2, 'isEmptyCell: пустые — только первые две', cells.join(',') === 'true,true,false,false', cells);

const stripped = stripThousands('1,234,567.89');
check(3, 'stripThousands убирает все запятые', stripped === '1234567.89', stripped);

const spots = [spotsOrDefault(0), spotsOrDefault(null), spotsOrDefault(3)];
check(4, 'spotsOrDefault не съедает ноль', spots.join(',') === '0,10,3', spots);

if (failures.length > 0) {
  throw new Error(`ещё не починено: ${failures.join(' · ')}`);
}

console.log('\nВсе четыре починены.');

export {};
