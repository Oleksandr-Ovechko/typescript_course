#!/usr/bin/env bash
# Урок 12 · Какой локатор выбрать
#
# Что здесь: во что превращается getByRole (не в CSS) · как совпадает name:
# подстрока без регистра, exact · div «Cancel» — не кнопка · getByLabel
# и getByPlaceholder · .first() на перевёрнутом списке против сужения
# строкой · алгоритм «локатор не сработал».
#
#   bash lessons/lesson-12/examples/05-choosing-a-locator.sh
#   cd /tmp/wl-pw-examples/choosing-a-locator  # песочница остаётся

source "$(dirname "$0")/_sandbox.sh" choosing-a-locator

cat > tests/selector.spec.ts <<'EOF'
import { test } from '@playwright/test';

test('what getBy methods turn into', async ({ page }) => {
  // _selector — внутреннее поле, в коде тестов его не трогают. Здесь только
  // чтобы увидеть, что Playwright на самом деле ищет.
  const show = (label: string, locator: object) =>
    console.log(`${label.padEnd(44)} → ${(locator as { _selector: string })._selector}`);
  show("getByRole('button', { name: 'Book Yoga' })", page.getByRole('button', { name: 'Book Yoga' }));
  show("getByText('Cancel')", page.getByText('Cancel'));
  show("getByLabel('Email')", page.getByLabel('Email'));
  show("locator('li button')", page.locator('li button'));
});
EOF

say "Во что превращаются getBy…"
run $PW test tests/selector.spec.ts 2>&1 | grep -E ' → |код возврата'

cat <<'TEXT'
  getByRole превращается не в CSS, а во внутренний селектор Playwright:
  internal:role=… Тот же элемент можно найти и CSS-селектором
  (page.locator('li button')), но CSS не умеет искать ни по тексту, ни
  по доступному имени — он видит только вёрстку: теги, классы, атрибуты.

  Отсюда порядок выбора (правило S3 в wl-e2e/CONVENTIONS.md):

    1. getByRole('button', { name })   всё, у чего есть роль: кнопки,
                                       ссылки, поля, чекбоксы
    2. getByLabel, getByPlaceholder    поля ввода
    3. getByText                       текст без роли
    4. getByTestId                     если в вёрстке есть data-testid —
                                       у нас пока 1 вызов на весь проект
    5. page.locator('css')             когда ничего выше не подходит

  CSS привязан к вёрстке: добавили обёртку или заменили div на button —
  упал. Роль и подпись привязаны к тому, что видит пользователь. В wl-e2e
  при этом .locator( — больше 100 000 вызовов, getByRole( — около 17 000.
TEXT

cat > tests/names.spec.ts <<'EOF'
import { test, expect } from '@playwright/test';

test('how getBy methods match', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Book / })).toHaveCount(3);
  const rows: [string, number][] = [
    ["getByRole('button', { name: 'book yoga' })", await page.getByRole('button', { name: 'book yoga' }).count()],
    ["getByRole('button', { name: 'Yoga' })", await page.getByRole('button', { name: 'Yoga' }).count()],
    ["getByRole('button', { name: 'book yoga', exact: true })", await page.getByRole('button', { name: 'book yoga', exact: true }).count()],
    ["getByRole('button', { name: 'Book Yoga', exact: true })", await page.getByRole('button', { name: 'Book Yoga', exact: true }).count()],
    ["getByRole('button', { name: 'Cancel' })", await page.getByRole('button', { name: 'Cancel' }).count()],
    ["getByText('Cancel')", await page.getByText('Cancel').count()],
    ["getByLabel('Email')", await page.getByLabel('Email').count()],
    ["getByPlaceholder('Search')", await page.getByPlaceholder('Search').count()],
    ["getByRole('textbox')", await page.getByRole('textbox').count()],
  ];
  for (const [locator, found] of rows) console.log(`${locator.padEnd(56)} → ${found}`);
});
EOF

say "Как совпадает имя"
run $PW test tests/names.spec.ts 2>&1 | grep -E ' → |код возврата'

cat <<'TEXT'
  - name по умолчанию — ПОДСТРОКА БЕЗ УЧЁТА РЕГИСТРА: 'book yoga'
    и даже 'Yoga' находят «Book Yoga».
  - exact: true — всё имя целиком и с регистром. exact СУЖАЕТ поиск:
    помогает, когда нашлось лишнее, и не поможет, когда нашлось 0.
  - «Cancel» на странице есть, а кнопки «Cancel» нет: это div
    с обработчиком клика. Для пользователя — кнопка, для getByRole — нет:
    у div нет роли button. getByText его находит.
  - getByLabel('Email') нашёл поле по подписи <label for="email">,
    getByPlaceholder — по подсказке внутри поля, тоже подстрокой.
  - Роль и имя элемента можно посмотреть руками: DevTools → вкладка
    Accessibility, или Pick locator в UI-режиме и в трейсе.

  Доступное имя (accessible name) — то, как элемент называет себя для
  экранного диктора: текст кнопки, подпись поля, aria-label. Его и ищет
  name. Оно не всегда совпадает с видимым текстом: если у кнопки есть
  aria-label, имя — из него.
TEXT

cat > tests/first.spec.ts <<'EOF'
import { test, expect } from '@playwright/test';

for (const [label, url] of [['обычный порядок', '/'], ['бэкенд перевернул список', '/?order=reversed']]) {
  test(`.first() — ${label}`, async ({ page }) => {
    await page.goto(url);
    await page.getByRole('button', { name: /^Book / }).first().click();
    await expect(page.getByRole('dialog')).toContainText('Book Yoga?');
  });
}

test('строка по тексту — бэкенд перевернул список', async ({ page }) => {
  await page.goto('/?order=reversed');
  await page.getByRole('listitem').filter({ hasText: 'Yoga' }).getByRole('button').click();
  await expect(page.getByRole('dialog')).toContainText('Book Yoga?');
});
EOF

say ".first() против сужения строкой"
run $PW test tests/first.spec.ts --workers=1 2>&1 | grep -E '✓|✘|Expected substring|Received string|код возврата'

cat <<'TEXT'
  .first() выключает строгий режим — и вместе с ним защиту. Бэкенд
  поменял порядок, и тест молча кликнул не тот класс: записал клиента
  на Boxing. Упал он только на проверке диалога, а без неё прошёл бы.

  Третий тест не зависит от порядка: сначала нашёл строку списка,
  в которой есть «Yoga», и уже в ней — кнопку. Это и есть «сузить
  областью, а не выбрать номер»: .filter({ hasText }), цепочка от
  контейнера, exact: true.

  Правило A8 в wl-e2e: «List-item helpers take an identifier param (don't
  act on .first() blindly)». В монолите это особенно опасно: многие
  элементы свёрстаны дважды — для десктопа и скрытой мобильной версии
  (так описано в page-facts, например у вкладок и у ссылок боковой панели
  отчётов). .first() на таком дубле может взять скрытую копию.

  XPath и :nth-child — тот же выбор по номеру, только внутри селектора.
  Оба запрещены S3. Пример из проекта:
    itemRow.locator('xpath=following-sibling::tr[contains(@class,"js-content-row")][1]')
  «следующая соседняя строка таблицы с таким классом, первая» —
  сломается, как только между строками появится ещё одна.
TEXT

cat <<'TEXT'

── Алгоритм «локатор не сработал»

  НАШЁЛ 0 ЭЛЕМЕНТОВ
    1. Элемент в iframe? → искать через page.frameLocator(...)  (06-iframe.sh)
    2. У элемента есть роль? Нет (div, span с обработчиком)
       → getByText или getByLabel
    3. Имя совпало? Посмотреть настоящее имя в Pick locator или
       Accessibility; убрать exact: true, если стоит. Сужать тут нечего:
       из нуля сужением ничего не получится.

  НАШЁЛ НЕСКОЛЬКО (strict mode violation)
    → сузить областью: .filter({ hasText }), строка → кнопка в ней,
      exact: true. Готовые варианты — в строках «aka …» ошибки.
      Не .first() (A8).

  «НЕ УСПЕЛ»
    → что стоит перед локатором? isVisible() или count() — они не ждут
      (03-is-visible.sh): заменить на expect(...).toBeVisible().
    → если ждёт само действие, а элемента всё нет — открыть трейс, Log
      этого шага: чего ждал и сколько. Дальше — почему элемент не
      появился: не выполнено условие показа, медленный ответ сервера,
      ошибка в консоли.
TEXT
