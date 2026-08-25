/**
 * ДЗ 1 — Типы для реального хелпера.
 *
 * Ниже — упрощённый хелпер в том виде, в каком его писать НЕЛЬЗЯ: с `any`,
 * без именованных типов, с необязательными полями «на глазок».
 *
 * Задача:
 *   1. Объявить тип `BookingOpts` для второго параметра `bookClass`.
 *      Поля: className (обязательное, строка), spots (необязательное, число),
 *      notes (необязательное, строка), waitlist (необязательное, boolean).
 *   2. Объявить тип `BookingResult`: readonly id (строка), className (строка),
 *      spots (число) — всегда заполненный, без `?`.
 *   3. Ни одного `any` в файле остаться не должно — ни явного, ни неявного.
 *      Сейчас `yarn typecheck:hw2` падает с TS7006: параметры без типа.
 *   4. Проставить типы возвращаемых значений у обеих функций.
 *   5. Заменить `||` на `??` там, где `||` ломается на нуле. Где не ломается —
 *      оставить и написать комментарием, почему.
 *
 * Проверка:  yarn typecheck:hw2     (должно быть чисто)
 * Запуск:    node lessons/lesson-02/homework/01-types-for-helper.ts
 *
 * Готово, когда: yarn typecheck:hw2 проходит, при этом вывод обеих строк внизу
 * остался осмысленным (спойлер: сейчас одна из них врёт).
 */

let counter = 0;

// @ts-nocheck-подсказка: сейчас `yarn typecheck:hw2` падает с TS7006 (implicit any).
// Это и есть стартовая точка задания — уберите ошибки, дописав типы.

function bookClass(page, opts) {
  const spots = opts.spots || 1;
  const notes = opts.notes || '';

  counter = counter + 1;

  console.log(`[${page}] бронируем «${opts.className}», мест: ${spots}, заметка: "${notes}"`);

  return {
    id: `B-${counter}`,
    className: opts.className,
    spots: spots,
  };
}

function describeBooking(booking) {
  return `${booking.id}: ${booking.className} × ${booking.spots}`;
}

console.log(describeBooking(bookClass('/schedule', { className: 'Yoga', spots: 3 })));

// ↓ вот тут сейчас баг. Найдите его и объясните в комментарии одной строкой.
console.log(describeBooking(bookClass('/schedule', { className: 'Отменённая группа', spots: 0 })));
