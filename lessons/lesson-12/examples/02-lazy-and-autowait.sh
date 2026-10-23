#!/usr/bin/env bash
# Урок 12 · Локатор — описание, а не элемент · автоожидание · тайм-ауты
#
# Что здесь: одна переменная-локатор — три разных ответа · почему в --debug
# другой ответ (замедлим браузер сами) · кто ждёт, а кто отвечает «про
# сейчас» · что можно передать в waitFor · какой тайм-аут у кого.
#
#   bash lessons/lesson-12/examples/02-lazy-and-autowait.sh
#   cd /tmp/wl-pw-examples/lazy-and-autowait    # песочница остаётся

source "$(dirname "$0")/_sandbox.sh" lazy-and-autowait

cat > tests/lazy.spec.ts <<'EOF'
import { test, expect } from '@playwright/test';

test('a locator is a description, not an element', async ({ page }) => {
  // Локатор создан ДО того, как открыта страница. Это не ошибка: он
  // ничего не ищет, пока его не попросили.
  const bookButtons = page.getByRole('button', { name: /^Book / });
  console.log('до goto:', await bookButtons.count());
  await page.goto('/');
  console.log('сразу после goto:', await bookButtons.count());
  await expect(bookButtons).toHaveCount(3);
  console.log('после expect:', await bookButtons.count());
});
EOF

# Тот же конфиг, но каждая операция браузера медленнее на 500 мс — так
# выглядит прогон, когда шаги жмёт человек в --debug.
cat > playwright.slow.config.ts <<'EOF'
import { defineConfig } from '@playwright/test';
import base from './playwright.config';

export default defineConfig({ ...base, use: { ...base.use, launchOptions: { slowMo: 500 } } });
EOF

say "Одна переменная — три ответа"
run $PW test tests/lazy.spec.ts 2>&1 | grep -E 'goto|expect:|код возврата'

say "То же, но браузер замедлен на 500 мс"
run $PW test tests/lazy.spec.ts -c playwright.slow.config.ts 2>&1 | grep -E 'goto|expect:|код возврата'

cat <<'TEXT'
  Локатор — это ОПИСАНИЕ того, как найти элемент («кнопка, имя которой
  начинается с Book»), а не сам элемент. Искать он начинает только когда
  с ним что-то делают — и ищет заново каждый раз. Та же ленивость, что
  у генератора в уроке 10.

  Поэтому одна и та же переменная трижды дала разное: до goto страницы
  нет — 0; сразу после goto список ещё грузится с API (300 мс) — 0;
  после expect кнопки уже есть — 3.

  Во втором прогоне между goto и count() прошло полсекунды — список успел
  загрузиться, и «сразу после goto» стало 3. Ровно это происходит
  в --debug: пока вы жмёте «шаг», проходят секунды. --headed и UI-режим
  скорость теста не меняют, поэтому там 0, как без окна.

  Вывод, который на занятии сделали сами: «в --debug работает» ничего
  не доказывает. Отладка медленнее обычного прогона, и гонку она прячет.
TEXT

# ── Кто ждёт ─────────────────────────────────────────────────────────────────
# Каждый вызов — сразу после goto, пока кнопки «Book Yoga» ещё нет.
cat > tests/who-waits.spec.ts <<'EOF'
import { test, type Page } from '@playwright/test';

const yoga = (page: Page) => page.getByRole('button', { name: 'Book Yoga' });
const calls: Record<string, (page: Page) => Promise<unknown>> = {
  'click()': (p) => yoga(p).click().then(() => 'кликнул'),
  'hover()': (p) => yoga(p).hover().then(() => 'навёл'),
  'textContent()': (p) => yoga(p).textContent(),
  'innerText()': (p) => yoga(p).innerText(),
  "getAttribute('type')": (p) => yoga(p).getAttribute('type'),
  'isEnabled()': (p) => yoga(p).isEnabled(),
  'waitFor()': (p) => yoga(p).waitFor().then(() => 'дождался'),
  'count()': (p) => yoga(p).count(),
  'allTextContents()': (p) => yoga(p).allTextContents(),
  'allInnerTexts()': (p) => yoga(p).allInnerTexts(),
  'evaluateAll()': (p) => yoga(p).evaluateAll((buttons) => buttons.length),
  'isVisible()': (p) => yoga(p).isVisible(),
  'isHidden()': (p) => yoga(p).isHidden(),
};

for (const [name, call] of Object.entries(calls)) {
  test(name, async ({ page }) => {
    await page.goto('/');
    console.log(`${name.padEnd(22)} → ${JSON.stringify(await call(page))}`);
  });
}
EOF

say "Сразу после goto: кто дождался кнопки, а кто ответил «про сейчас»"
run $PW test tests/who-waits.spec.ts --workers=1 2>&1 | grep -E ' → |код возврата'

cat <<'TEXT'
  Первые семь дождались кнопки и вернули её данные (getAttribute('type')
  вернул null — у кнопки просто нет такого атрибута, но ждал он честно).
  Последние шесть ответили мгновенно: кнопки нет — 0, [], [], 0, false, true.

  Запоминать проще через исключения. Не ждут и отвечают «про сейчас»
  только вызовы для списка — count(), all(), allTextContents(),
  allInnerTexts(), evaluateAll() — и isVisible(), isHidden().
  Всё остальное у локатора ждёт, пока элемент появится.

  textContent() ждёт ЭЛЕМЕНТ, а не какой-то текст: текст ему никто
  не указывает, он вернёт тот, что есть. Дождаться текста — expect(...)
  .toHaveText('…').
TEXT

# ── Вопрос с занятия: что передаётся в waitFor ───────────────────────────────
cat > tests/wait-for.spec.ts <<'EOF'
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('state: hidden', async ({ page }) => {
  // Диалог скрыт с самого начала — ждать нечего.
  await page.getByRole('dialog', { includeHidden: true }).waitFor({ state: 'hidden' });
  console.log("waitFor({ state: 'hidden' })   → дождался");
});

test('state: enabled', async ({ page }) => {
  const yoga = page.getByRole('button', { name: 'Book Yoga' });
  // TypeScript такого состояния не знает — здесь его обманули, чтобы
  // увидеть, что скажет сам Playwright.
  await yoga.waitFor({ state: 'enabled' as 'visible' }).catch((e: Error) =>
    console.log("waitFor({ state: 'enabled' })  →", e.message.split('\n')[0]));
  await expect(yoga).toBeEnabled();
  console.log('expect(...).toBeEnabled()      → дождался');
});

test('default timeout', async ({ page }) => {
  const started = Date.now();
  await page.getByRole('button', { name: 'No such class' }).waitFor().catch((e: Error) =>
    console.log(`waitFor() без timeout упал через ${Math.round((Date.now() - started) / 1000)} с →`, e.message.split('\n')[0]));
});
EOF

say "waitFor: какие состояния и сколько ждёт"
run $PW test tests/wait-for.spec.ts --workers=1 2>&1 | grep -E ' → |код возврата'

cat <<'TEXT'
  В waitFor передают одно из четырёх состояний: attached (появился
  в DOM), detached (исчез из DOM), visible (виден — по умолчанию), hidden
  (скрыт или его нет). «enabled», «disabled», «загрузился» — таких нет,
  и Playwright падает сразу. Для доступности кнопки — expect(...)
  .toBeEnabled(), для загрузки страницы — page.waitForLoadState().

  Без явного timeout waitFor ждёт по actionTimeout — в песочнице 3 с,
  в wl-e2e 15 с.
TEXT

cat <<'TEXT'

── Вопрос с занятия: какой тайм-аут отвечает за ожидание

  В конфигах monolith и widgets (projects/*/playwright.config.ts):

    что ждёт                                         тайм-аут            у нас
    ───────────────────────────────────────────────  ──────────────────  ──────────────────
    весь тест целиком                                timeout             60 с
    expect(...).toBeVisible(), toHaveText() и др.    expect.timeout      5 с (умолчание
                                                                          Playwright)
    click, fill, check, hover, textContent(),        actionTimeout       15 с
      waitFor() и прочие действия с элементом
    goto, reload, goBack, goForward, waitForURL      navigationTimeout   15 с

  «3 или 5 секунд, чтобы дождаться элемента» — это expect.timeout,
  а не actionTimeout: web-first проверки ждут по нему. Так прямо написано
  в комментарии самого конфига: «web-first assertions use expect.timeout».

  Клика в строке navigationTimeout нет: click не ждёт, пока загрузится
  новая страница. Кликнули по клиенту — и дальше ждёт следующий шаг:
  waitForURL (по navigationTimeout) или expect на элемент профиля
  (по expect.timeout).

  На медленных стендах числа больше: конфиг умножает их на
  WL_TIMEOUT_SCALE из config/.env.<окружение> — у wl-aut-* он равен 2.

  Явный { timeout } в самом вызове всегда сильнее конфига.
TEXT
