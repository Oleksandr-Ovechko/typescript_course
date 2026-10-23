#!/usr/bin/env bash
# Урок 11 · Видео: фикстурный и гостевой контекст
#
# Что здесь: use.video пишет только контекст, который создала фикстура ·
# контекст из browser.newContext() на видео не попадает · recordVideo
# в самом newContext — второе видео · как называются файлы.
#
#   bash lessons/lesson-11/examples/06-video-contexts.sh
#   cd /tmp/wl-pw-examples/video-contexts           # песочница остаётся

source "$(dirname "$0")/_sandbox.sh" video-contexts
VIDEOS=/tmp/wl-pw-examples/video-contexts-videos
rm -rf "$VIDEOS"

# Конфиг записи — копия приёма из wl-e2e (projects/widgets/playwright.video.config.ts).
cat > playwright.video.config.ts <<'EOF'
import * as path from 'path';
import { defineConfig } from '@playwright/test';
import base from './playwright.config';

const videoDir = process.env.WL_VIDEO_DIR;

export default defineConfig({
  ...base,
  workers: 1,
  retries: 0,
  reporter: [['line']],
  outputDir: videoDir ? path.resolve(videoDir) : undefined,
  use: { ...base.use, video: 'on' },
});
EOF

say "Тест с двумя контекстами: tests/guest.spec.ts"
cat tests/guest.spec.ts
cat <<'TEXT'
  page — фикстура: Playwright создал её сам, вместе с её контекстом.
  guestContext — контекст, созданный руками, как в виджет-тестах wl-e2e
  (openEmbeddedWidgetAsGuest в widgets-navigation.ts): виджет живёт
  на сайте клиента, и тест открывает его «гостем», без сессии сотрудника.
TEXT

# ── Только use.video ─────────────────────────────────────────────────────────
say "video: 'on' в конфиге, WL_VIDEO_DIR не задан"
run $PW test tests/guest.spec.ts -c playwright.video.config.ts 2>&1 | grep -E 'passed|failed$|код возврата'
find test-results -name '*.webm' | sort
cat <<'TEXT'
  Одно видео — фикстурного контекста. На нём страница, с которой тест
  начался, и ничего из того, ради чего тест писался: клик и диалог были
  в гостевом контексте, а его никто не записывал.

  use.video — настройка фикстуры: она действует на контекст, который
  создала фикстура. Свой browser.newContext() её не получает.
TEXT

# ── recordVideo в самом newContext ───────────────────────────────────────────
say "Тот же тест с WL_VIDEO_DIR — гостевой контекст получает recordVideo"
WL_VIDEO_DIR="$VIDEOS" run $PW test tests/guest.spec.ts -c playwright.video.config.ts 2>&1 | grep -E 'passed|failed$|код возврата'
find "$VIDEOS" -name '*.webm' | sed "s#$VIDEOS/##" | sort
cat <<'TEXT'
  Два файла, и оба — в WL_VIDEO_DIR: конфиг направил туда outputDir,
  а тест — recordVideo.
    guest-widget-on-a-client-site-chromium/video.webm — контекст фикстуры,
       в папке с именем теста;
    page@<id>.webm — гостевой контекст. Имя ничего не говорит о «госте»:
       это просто id страницы. Какое видео чьё, различают по тому,
       лежит ли оно в папке теста.

  Видео гостевого контекста дописывается в момент guestContext.close(),
  поэтому контексты, открытые руками, тест закрывает сам. Склеить два
  видео в одно Playwright не умеет: это уже работа для ffmpeg.
TEXT

say "Как это устроено в wl-e2e"
cat <<'TEXT'
  Готового конфига записи в wl-e2e нет ни в одной ветке. Его собирают
  сами — projects/widgets/playwright.video.config.ts по образцу
  playwright.video.config.ts из этой песочницы — и прячут от git через
  .git/info/exclude. Запуск:
    cd ~/work/wl-e2e/projects/widgets
    WL_VIDEO_DIR=../../videos/C175914 WL_VIDEO_TESTDIR=./end-to-end-tests \
    APP_ENV=staging yarn playwright test --config=playwright.video.config.ts \
      --project=chromium end-to-end-tests/event-widget/C175914.spec.ts

  Гостевые контексты там создаются в projects/widgets/helpers/components/
  widgets-navigation.ts. Этот хелпер заморожен (Tier-1, правило A9), и
  править его не нужно: openEmbeddedWidgetAsGuest принимает опции контекста
  четвёртым аргументом, туда и кладут recordVideo — в своём спеке:
    openEmbeddedWidgetAsGuest(browser, html, false, { recordVideo: { dir: … } })
  Исключение — openScheduleWidgetAsGuest: её newContext() без параметров.

  Патчить Browser.prototype.newContext из конфига бесполезно: @playwright/test
  работает с собственной вложенной копией playwright-core, и патч до неё
  не доходит (проверено 2026-09-01).

  Записывать стоит зелёные прогоны: видео пишется и для упавшего теста,
  так что после падения папку чистят и переснимают.
TEXT
