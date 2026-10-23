#!/usr/bin/env bash
# Урок 16 · Общая песочница для всех примеров. Сама по себе не запускается:
# каждый пример подключает её строкой
#
#   source "$(dirname "$0")/_sandbox.sh" <имя-папки>
#
# Что делает: сносит и заново собирает /tmp/wl-dom-examples/<имя-папки> —
# страницу «расписание и запись» (список занятий, форма, поле Card
# с «фреймворком», кнопка Pay под накрывающим слоем), страницу загрузки
# (медленные скрипт и картинка, обработчик Book вешается на load) и журнал
# событий; сервер на порту 4177 и конфиг Playwright.
#
# Код «из консоли» пример кладёт в файл console/<имя>.js и запускает так:
#
#   console_run console/<имя>.js [путь]   # открыть страницу, выполнить файл, напечатать консоль
#
# Файл выполняется как обычный скрипт страницы — то же самое, что вставить
# его в консоль DevTools. Хотите руками: `node site/server.mjs` в песочнице,
# http://localhost:4177, F12 → Console, вставить содержимое файла.
#
# Playwright берётся из ~/work/wl-e2e/node_modules симлинком — та же версия,
# что в проекте. Если wl-e2e лежит в другом месте: WL_E2E=/путь/к/wl-e2e bash <пример>.
#
# Ничего за пределами /tmp не трогает.

set -e
NAME="${1:?_sandbox.sh: передайте имя папки}"
SANDBOX="/tmp/wl-dom-examples/$NAME"
E2E="${WL_E2E:-$HOME/work/wl-e2e}"

if [ ! -x "$E2E/node_modules/.bin/playwright" ]; then
  echo "Не нашёл Playwright в $E2E/node_modules." >&2
  echo "Укажите путь к wl-e2e: WL_E2E=/путь/к/wl-e2e bash $0" >&2
  echo "(и проверьте, что там выполнен yarn install)" >&2
  exit 1
fi

# Каждый прогон поднимает свой сервер на 4177 и гасит его после. Если порт
# занят — значит, где-то висит старый прогон.
if (exec 3<>/dev/tcp/127.0.0.1/4177) 2>/dev/null; then
  echo "Порт 4177 занят — видимо, не закрылся прошлый прогон." >&2
  echo "Освободить: fuser -k 4177/tcp" >&2
  exit 1
fi

rm -rf "$SANDBOX" && mkdir -p "$SANDBOX/site" "$SANDBOX/tests" "$SANDBOX/console" && cd "$SANDBOX"
ln -s "$E2E/node_modules" node_modules

PW=node_modules/.bin/playwright

say() { printf '\n\033[1m── %s\033[0m\n' "$1"; }
# Прогон с упавшими тестами возвращает 1, а примеры работают под set -e.
# run печатает код возврата вместо того, чтобы обрывать сценарий.
run() { local code=0; "$@" || code=$?; echo "(код возврата: $code)"; }

# ── Сервер ────────────────────────────────────────────────────────────────────
# /slow.png?ms=N и /slow.js?ms=N отвечают с задержкой — для загрузки.
cat > site/server.mjs <<'EOF'
import http from 'node:http';
import { readFileSync } from 'node:fs';
const file = (name) => readFileSync(new URL(`./${name}`, import.meta.url));
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const later = (fn) => setTimeout(fn, Number(url.searchParams.get('ms') ?? 0));
  if (url.pathname === '/slow.png') return later(() => { res.setHeader('content-type', 'image/png'); res.end(PNG); });
  if (url.pathname === '/slow.js') {
    return later(() => {
      res.setHeader('content-type', 'text/javascript');
      res.end(`mark('скрипт ${url.searchParams.get('as')} выполнен');`);
    });
  }
  if (url.pathname === '/api/ping') return void res.end('ok');
  const name = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
  try {
    res.setHeader('content-type', 'text/html; charset=utf-8');
    res.end(file(name));
  } catch {
    res.statusCode = 404;
    res.end('not found');
  }
}).listen(4177);
EOF

# ── Главная страница: расписание и запись ─────────────────────────────────────
# Отступы и переносы в разметке — намеренно: из них получаются текстовые узлы.
cat > site/index.html <<'EOF'
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Schedule</title>
  <style>
    body { font-family: sans-serif; margin: 16px; }
    .session { padding: 6px; border-bottom: 1px solid #ddd; }
    .full { color: #999; }
    #pay-zone { position: relative; width: 220px; height: 60px; margin: 12px 0; }
    #pay { width: 120px; height: 40px; }
    #cover { position: absolute; left: 0; top: 0; width: 220px; height: 60px; background: rgba(0,0,0,.2); }
    #long { height: 1500px; border-left: 4px solid #eee; }
  </style>
</head>
<body>
  <header id="top">
    <a href="/">Home</a>
    <span class="user" data-uid="501" data-role="staff">Alex</span>
  </header>
  <!-- список занятий -->
  <h1>Schedule</h1>
  <div class="filter-title">
    Staff
  </div>
  <ul id="sessions">
    <li class="session" data-key="1001">
      <span class="name">Yoga</span> <span class="time">9:00am</span>
      <button class="book">Book</button>
    </li>
    <li class="session full" data-key="1002">
      <span class="name">Pilates</span> <span class="time">10:30am</span>
      <button class="book" disabled>Full</button>
    </li>
    <li class="session" data-key="1003">
      <span class="name">Boxing</span> <span class="time">6:00pm</span>
      <button class="book">Book</button>
    </li>
  </ul>
  <p id="note">Book <span hidden>secret</span>now</p>
  <form id="booking" name="booking">
    <label>Name <input name="client" value="Guest"></label>
    <label>Email <input name="email" type="email"></label>
    <label><input type="checkbox" name="waiver"> I accept the waiver</label>
    <select name="pass">
      <option value="drop-in">Drop-in $20</option>
      <option value="pack10" selected>10 visits $150</option>
    </select>
    <button type="submit">Book &amp; pay</button>
  </form>
  <p>Card: <input id="card" aria-label="Card" value=""> state: <span id="card-state">(empty)</span></p>
  <div id="pay-zone"><button id="pay">Pay</button><div id="cover"></div></div>
  <div id="long"></div>
  <button id="bottom">Bottom</button>
  <script>
    // Модель «фреймворка» вроде React: своё значение поля он держит в своём
    // состоянии и обновляет его по событию input — только если значение
    // поменялось с того, что он сам записал последним.
    const card = document.getElementById('card');
    const cardState = document.getElementById('card-state');
    const nativeValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    let tracked = '';
    Object.defineProperty(card, 'value', {
      get() { return nativeValue.get.call(card); },
      set(next) { tracked = String(next); nativeValue.set.call(card, next); },
    });
    document.getElementById('pay').addEventListener('click', (e) => { e.target.textContent = 'Paid'; });
    card.addEventListener('input', () => {
      const now = nativeValue.get.call(card);
      if (now === tracked) return;
      tracked = now;
      cardState.textContent = now;
    });
  </script>
</body>
</html>
EOF

# ── Загрузка документа ────────────────────────────────────────────────────────
# Скрипт defer — 600 мс, async — 300 мс, картинка — 1500 мс. Каждое событие
# пишет строку в консоль и в window.timeline. Обработчик кнопки Book вешается
# только на load — так устроены страницы WL (UI-PATTERNS.md §9.1 в wl-e2e).
cat > site/load.html <<'EOF'
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Load</title>
  <script>
    const t0 = performance.now();
    window.timeline = [];
    window.mark = (what) => {
      const ms = String(Math.round((performance.now() - t0) / 100) * 100).padStart(4);
      const line = `~${ms} мс  ${what}  [${document.readyState}]`;
      timeline.push(line);
      console.log(line);
    };
    mark('скрипт в head');
    document.addEventListener('readystatechange', () => mark('readystatechange'));
    document.addEventListener('DOMContentLoaded', () => mark('DOMContentLoaded'));
    window.addEventListener('load', () => mark('load'));
  </script>
  <script src="/slow.js?ms=600&as=defer" defer></script>
  <script src="/slow.js?ms=300&as=async" async></script>
</head>
<body>
  <h1>Schedule</h1>
  <img src="/slow.png?ms=1500" alt="banner" width="200" height="50">
  <button id="book">Book</button>
  <p id="status">не записан</p>
  <script>
    mark('скрипт в конце body');
    window.addEventListener('load', () => {
      document.getElementById('book').addEventListener('click', () => {
        document.getElementById('status').textContent = 'записан';
      });
      mark('обработчик Book повешен');
    });
  </script>
</body>
</html>
EOF

# ── Журнал событий ────────────────────────────────────────────────────────────
# Один обработчик на document в фазе погружения записывает каждое событие.
cat > site/events.html <<'EOF'
<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Events</title></head>
<body>
  <button id="btn">Book</button>
  <input id="name" aria-label="Name">
  <label><input type="checkbox" id="waiver"> Waiver</label>
  <select id="pass" aria-label="Pass">
    <option value="drop-in">Drop-in</option>
    <option value="pack10">10 visits</option>
  </select>
  <script>
    window.log = [];
    const types = ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click', 'keydown', 'keypress',
      'keyup', 'beforeinput', 'input', 'change', 'focus', 'blur'];
    for (const type of types) {
      document.addEventListener(type, (e) => {
        const key = e.key ? `[${e.key}]` : '';
        const where = type === 'focus' || type === 'blur' ? `@${e.target.id}` : '';
        const trusted = e.isTrusted ? '' : ' (isTrusted: false)';
        log.push(`${type}${key}${where}${trusted}`);
      }, true);
    }
  </script>
</body>
</html>
EOF

# ── Конфиг Playwright ─────────────────────────────────────────────────────────
cat > playwright.config.ts <<'EOF'
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 20_000,
  expect: { timeout: 1_000 },
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4177', actionTimeout: 2_000, navigationTimeout: 8_000 },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: { command: 'node site/server.mjs', url: 'http://localhost:4177/api/ping', reuseExistingServer: false },
});
EOF

# ── «Консоль»: открыть страницу и выполнить файл как скрипт ───────────────────
# Печатает всё, что страница вывела в консоль, и ошибки. Ждёт 300 мс после
# выполнения — чтобы успели обещания, наблюдатели и загрузка картинок.
cat > console.mjs <<'EOF'
import { readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const [file, path = '/'] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('console', (msg) => console.log(`  ${msg.text()}`));
page.on('pageerror', (err) => console.log(`  ✖ ${err.message}`));
await page.goto(`http://localhost:4177${path}`);
await page.addScriptTag({ content: readFileSync(file, 'utf8') });
await page.waitForTimeout(300);
await browser.close();
EOF

console_run() {
  node site/server.mjs & local server=$!
  sleep 0.3
  local code=0
  node console.mjs "$@" || code=$?
  kill "$server" 2>/dev/null; wait "$server" 2>/dev/null || true
  return $code
}
