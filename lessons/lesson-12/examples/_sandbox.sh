#!/usr/bin/env bash
# Урок 12 · Общая песочница для всех примеров. Сама по себе не запускается:
# каждый пример подключает её строкой
#
#   source "$(dirname "$0")/_sandbox.sh" <имя-папки>
#
# Что делает: сносит и заново собирает /tmp/wl-pw-examples/<имя-папки> —
# страницу «записи на класс» (список грузится с API, поле с подписью, поле
# с подсказкой, div «Cancel» с обработчиком клика, баннер через секунду,
# скрытый диалог, виджет в iframe), сервер и конфиг как в wl-e2e. Спеки
# пишет каждый пример сам. Playwright берётся из ~/work/wl-e2e/node_modules
# симлинком — та же версия, что в проекте.
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

# Каждый прогон поднимает свой сервер на 4174 и гасит его после. Если порт
# занят — значит, где-то висит старый прогон или открыт UI-режим.
if (exec 3<>/dev/tcp/127.0.0.1/4174) 2>/dev/null; then
  echo "Порт 4174 занят — видимо, не закрылся прошлый прогон или UI-режим." >&2
  echo "Освободить: fuser -k 4174/tcp" >&2
  exit 1
fi

rm -rf "$SANDBOX" && mkdir -p "$SANDBOX/site" "$SANDBOX/tests" && cd "$SANDBOX"
ln -s "$E2E/node_modules" node_modules

PW=node_modules/.bin/playwright

say() { printf '\n\033[1m── %s\033[0m\n' "$1"; }
# Прогон с упавшими тестами возвращает 1, а примеры работают под set -e.
# run печатает код возврата вместо того, чтобы обрывать сценарий.
run() { local code=0; "$@" || code=$?; echo "(код возврата: $code)"; }

# ── Сервер ────────────────────────────────────────────────────────────────────
# /api/classes отвечает за 300 мс — поэтому сразу после goto кнопок ещё нет.
# ?order=reversed — тот же список в обратном порядке: «бэкенд поменял
# сортировку», и .first() берёт не тот класс.
cat > site/server.mjs <<'EOF'
import http from 'node:http';
import { readFileSync } from 'node:fs';
const file = (name) => readFileSync(new URL(`./${name}`, import.meta.url));
http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/classes') {
    const list = ['Yoga', 'Pilates', 'Boxing'];
    if (url.searchParams.get('order') === 'reversed') list.reverse();
    setTimeout(() => {
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify(list));
    }, 300);
    return;
  }
  res.setHeader('content-type', 'text/html; charset=utf-8');
  res.end(file(url.pathname === '/widget.html' ? 'widget.html' : 'index.html'));
}).listen(4174);
EOF

# ── Страница ──────────────────────────────────────────────────────────────────
cat > site/index.html <<'EOF'
<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Book a class</title></head>
<body>
<h1>Schedule</h1>
<label for="email">Email</label> <input id="email" type="email">
<input placeholder="Search classes">
<ul id="classes"></ul>
<div class="fake-button" onclick="this.textContent = 'Cancelled'">Cancel</div>
<p id="offer" hidden>Special offer: 20% off</p>
<div role="dialog" aria-label="Booking" hidden><p id="msg"></p><button>Confirm booking</button></div>
<iframe name="wl-schedule-widget:1" src="/widget.html" title="Schedule widget"></iframe>
<script>
  const dialog = document.querySelector('[role=dialog]');
  fetch('/api/classes' + location.search).then((r) => r.json()).then((classes) => {
    for (const name of classes) {
      const li = document.createElement('li');
      li.innerHTML = `<span>${name}</span> <button>Book ${name}</button>`;
      li.querySelector('button').onclick = () => {
        document.getElementById('msg').textContent = `Book ${name}?`;
        dialog.hidden = false;
      };
      document.getElementById('classes').append(li);
    }
  });
  setTimeout(() => { document.getElementById('offer').hidden = false; }, 1000);
</script></body></html>
EOF

cat > site/widget.html <<'EOF'
<!doctype html><html lang="en"><head><meta charset="utf-8"></head>
<body><button onclick="this.textContent = 'Booked in widget'">Book in widget</button></body></html>
EOF

# ── Конфиг: ключи из wl-e2e, тайм-ауты короче ────────────────────────────────
# В wl-e2e: actionTimeout 15 с, expect — умолчание 5 с. Здесь 3 с и 2 с,
# чтобы падения шли за секунды, а не за четверть минуты. Ретраев нет: в этих
# примерах важно, что происходит с первой попытки.
cat > playwright.config.ts <<'EOF'
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 15_000,
  expect: { timeout: 2_000 },
  fullyParallel: true,
  retries: 0,
  workers: 2,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4174',
    actionTimeout: 3_000,
    navigationTimeout: 15_000,
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: {
    command: 'node site/server.mjs',
    url: 'http://localhost:4174',
    reuseExistingServer: false,
  },
});
EOF
