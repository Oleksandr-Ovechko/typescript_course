#!/usr/bin/env bash
# Урок 11 · Общая песочница для всех примеров. Сам по себе не запускается:
# каждый пример подключает его строкой
#
#   source "$(dirname "$0")/_sandbox.sh" <имя-папки>
#
# Что делает: сносит и заново собирает /tmp/wl-pw-examples/<имя-папки> —
# маленький «виджет записи на класс» (страница + сервер с API), конфиг как
# в wl-e2e, свой конфиг поверх общего и три спека. Playwright берётся из
# ~/work/wl-e2e/node_modules симлинком — та же версия, что в проекте.
# Если wl-e2e лежит в другом месте: WL_E2E=/путь/к/wl-e2e bash <пример>.
#
# Ничего за пределами /tmp не трогает.

set -e
NAME="${1:?_sandbox.sh: передайте имя папки}"
SANDBOX="/tmp/wl-pw-examples/$NAME"
E2E="${WL_E2E:-$HOME/work/wl-e2e}"

if [ ! -x "$E2E/node_modules/.bin/playwright" ]; then
  echo "Не нашёл Playwright в $E2E/node_modules." >&2
  echo "Укажите путь к wl-e2e: WL_E2E=/путь/к/wl-e2e bash $0" >&2
  echo "(и проверьте, что там выполнен yarn install)" >&2
  exit 1
fi

# Каждый прогон поднимает свой сервер на 4173 и гасит его после. Если порт
# занят — значит, где-то висит старый прогон; сервер от него мешает новому.
if (exec 3<>/dev/tcp/127.0.0.1/4173) 2>/dev/null; then
  echo "Порт 4173 занят — видимо, не закрылся прошлый прогон." >&2
  echo "Освободить: fuser -k 4173/tcp" >&2
  exit 1
fi

rm -rf "$SANDBOX" && mkdir -p "$SANDBOX/site" "$SANDBOX/tests" && cd "$SANDBOX"
ln -s "$E2E/node_modules" node_modules

PW=node_modules/.bin/playwright
# HTML-отчёт в примерах не открываем в браузере сами — только складываем
# на диск. Посмотреть его потом: node_modules/.bin/playwright show-report
export PLAYWRIGHT_HTML_OPEN=never

say() { printf '\n\033[1m── %s\033[0m\n' "$1"; }
# Прогон с упавшими тестами возвращает 1, а примеры работают под set -e.
# run печатает код возврата вместо того, чтобы обрывать сценарий.
run() { local code=0; "$@" || code=$?; echo "(код возврата: $code)"; }

# ── Сайт: страница + сервер с API ────────────────────────────────────────────
# /api/classes отвечает за 300 мс. Страница с ?location=new — «холодный кэш»:
# первый запрос к ней после старта сервера отвечает 2,5 с, следующие — 300 мс.
# Сервер стартует заново на каждый прогон, поэтому флейки-тест воспроизводится
# одинаково: первая попытка падает, ретрай проходит. POST /api/book всегда 500.
cat > site/server.mjs <<'EOF'
import http from 'node:http';
import { readFileSync } from 'node:fs';
let coldHits = 0;
http.createServer((req, res) => {
  if (req.url.startsWith('/api/classes')) {
    const cold = req.url.includes('location=new') && coldHits++ === 0;
    setTimeout(() => {
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify(['Yoga', 'Pilates', 'Boxing']));
    }, cold ? 2_500 : 300);
    return;
  }
  if (req.url === '/api/book' && req.method === 'POST') {
    res.statusCode = 500; res.end('{"error":"slot is full"}'); return;
  }
  res.setHeader('content-type', 'text/html; charset=utf-8');
  res.end(readFileSync(new URL('./index.html', import.meta.url)));
}).listen(4173);
EOF

cat > site/index.html <<'EOF'
<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Book a class</title></head>
<body>
<h1>Schedule</h1>
<p id="loading">Loading…</p>
<ul id="classes"></ul>
<div role="dialog" aria-label="Booking" hidden>
  <p id="msg"></p><button>Confirm booking</button>
</div>
<script>
  const dialog = document.querySelector('[role=dialog]');
  const msg = document.getElementById('msg');
  fetch('/api/classes' + location.search).then((r) => r.json()).then((classes) => {
    document.getElementById('loading').remove();
    for (const name of classes) {
      const li = document.createElement('li');
      li.innerHTML = `<span>${name}</span> <button>Book ${name}</button>`;
      li.querySelector('button').onclick = () => {
        console.log('open booking dialog:', name);
        msg.textContent = `Book ${name}?`;
        dialog.hidden = false;
      };
      document.getElementById('classes').append(li);
    }
  });
  dialog.querySelector('button').onclick = async () => {
    const r = await fetch('/api/book', { method: 'POST' });
    msg.textContent = r.ok ? 'Booked!' : 'Something went wrong';
    if (!r.ok) console.error('booking failed with status', r.status);
  };
</script></body></html>
EOF

# ── Конфиг: те же ключи и значения, что в wl-e2e ────────────────────────────
# Сверено с projects/widgets/playwright.config.ts: retries 1, трейс на первом
# ретрае, action/navigation 15 с, видео и скриншотов нет. Отличия: timeout
# 15 с вместо 60 и expect 2 с вместо 5 — чтобы падения шли за секунды;
# workers 2 вместо 8; один браузер вместо трёх; webServer поднимает сайт.
cat > playwright.config.ts <<'EOF'
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 15_000,
  expect: { timeout: 2_000 },
  fullyParallel: true,
  retries: 1,
  workers: 2,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    actionTimeout: 15_000,
    navigationTimeout: 15_000,
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: {
    command: 'node site/server.mjs',
    url: 'http://localhost:4173',
    reuseExistingServer: false,
  },
});
EOF

# ── Свой конфиг поверх общего: «под себя», не трогая проектный ──────────────
cat > playwright.my.config.ts <<'EOF'
import { defineConfig } from '@playwright/test';
import base from './playwright.config';

export default defineConfig({
  ...base,
  retries: 0,
  reporter: [['list'], ['html', { open: 'on-failure' }]],
  use: {
    ...base.use,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
EOF

cat > tests/booking.spec.ts <<'EOF'
import { test, expect } from '@playwright/test';

test('schedule shows three classes', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('listitem')).toHaveCount(3);
});

test('open booking dialog for Yoga', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Book Yoga' }).click();
  await expect(page.getByRole('dialog')).toContainText('Book Yoga?');
});

test('book Pilates', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Book Pilates' }).click();
  await page.getByRole('button', { name: 'Confirm booking' }).click();
  await expect(page.getByRole('dialog')).toContainText('Booked!');
});
EOF

cat > tests/flaky.spec.ts <<'EOF'
import { test, expect } from '@playwright/test';

test('schedule of a new location', async ({ page }) => {
  await page.goto('/?location=new');
  await expect(page.getByRole('listitem')).toHaveCount(3);
});
EOF

cat > tests/guest.spec.ts <<'EOF'
import { test, expect } from '@playwright/test';
import * as path from 'path';

test('widget on a client site', async ({ page, browser }) => {
  await page.goto('/');

  // Второй контекст создаётся руками — как в widgets-navigation.ts.
  // recordVideo здесь появляется только когда задан WL_VIDEO_DIR.
  const guestContext = await browser.newContext(
    process.env.WL_VIDEO_DIR ? { recordVideo: { dir: path.resolve(process.env.WL_VIDEO_DIR) } } : {},
  );
  const guestPage = await guestContext.newPage();
  await guestPage.goto('http://localhost:4173/');
  await guestPage.getByRole('button', { name: 'Book Yoga' }).click();
  await expect(guestPage.getByRole('dialog')).toContainText('Book Yoga?');
  await guestContext.close();
});
EOF
