/**
 * ДЗ 2 — Переписать enum на union по стилю проекта.
 *
 * Ниже — код в стиле, который я ошибочно показал на первом уроке.
 * Задача — привести его к тому, как это пишется в wl-e2e.
 *
 * СНАЧАЛА запустите файл как есть:
 *
 *   node lessons/lesson-02/homework/02-enum-to-union.ts
 *
 * Вы получите:
 *   SyntaxError: TypeScript enum is not supported in strip-only mode
 *
 * Это и есть доказательство тезиса из блока 3.3: Node умеет просто ВЫРЕЗАТЬ
 * типы, а enum вырезать нельзя — он превращается в настоящий рантайм-объект.
 * Union вырезается бесследно, поэтому после переписывания файл запустится.
 *
 * Задача:
 *   1. Убрать оба enum. Вместо `NotificationChannel` — union литералов.
 *      Вместо `ChannelSelector` — объект `as const` + Record.
 *   2. Таблицу селекторов объявить как `Record<NotificationChannel, string>`
 *      и убедиться: если удалить одну строку — TS ругается. Записать код ошибки.
 *   3. В `selectorFor` добавить ветку `default` с проверкой полноты через `never`.
 *   4. Добавить в union четвёртый канал `'whatsapp'` и, НЕ запуская код,
 *      выписать все места, куда вас привёл `yarn typecheck:hw2`. Потом починить.
 *
 * Проверка:  yarn typecheck:hw2
 * Запуск:    node lessons/lesson-02/homework/02-enum-to-union.ts
 *
 * Готово, когда: enum в файле нет, yarn typecheck:hw2 чист, в комментарии внизу
 * записан список мест из пункта 4.
 */

enum NotificationChannel {
  Mail = 'mail',
  Sms = 'sms',
  Push = 'push',
}

enum ChannelSelector {
  Mail = 'input.js-channel-mail',
  Sms = 'input.js-channel-sms',
  Push = 'input.js-channel-push',
}

function selectorFor(channel: NotificationChannel): string {
  switch (channel) {
    case NotificationChannel.Mail:
      return ChannelSelector.Mail;
    case NotificationChannel.Sms:
      return ChannelSelector.Sms;
    case NotificationChannel.Push:
      return ChannelSelector.Push;
  }
}

function toggleChannel(channel: NotificationChannel, state: boolean): void {
  console.log(`${state ? 'включаем' : 'выключаем'} ${channel} → ${selectorFor(channel)}`);
}

toggleChannel(NotificationChannel.Sms, true);
toggleChannel(NotificationChannel.Push, false);

// Пункт 4 — список мест, куда привёл компилятор:
// 1.
// 2.
// 3.
