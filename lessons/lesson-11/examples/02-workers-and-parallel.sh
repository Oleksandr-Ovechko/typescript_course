#!/usr/bin/env bash
# Урок 11 · Воркеры и параллельность
#
# Что здесь: workers — потолок, а fullyParallel — единица параллельности ·
# воркеров не бывает больше, чем тестов · mode: 'serial' — упал первый,
# остальные пропущены.
#
#   bash lessons/lesson-11/examples/02-workers-and-parallel.sh
#   cd /tmp/wl-pw-examples/workers-and-parallel     # песочница остаётся

source "$(dirname "$0")/_sandbox.sh" workers-and-parallel

cat > playwright.seq.config.ts <<'EOF'
import { defineConfig } from '@playwright/test';
import base from './playwright.config';

export default defineConfig({ ...base, fullyParallel: false });
EOF

# Три теста, которые делят одно состояние: первый «создаёт клиента»,
# второй и третий с ним работают. Первый намеренно падает.
cat > tests/serial.spec.ts <<'EOF'
import { test, expect } from '@playwright/test';

test.describe('shared client', () => {
  test.describe.configure({ mode: 'serial' });

  let clientId: string | undefined;

  test('create client', async () => {
    clientId = undefined;          // создание «не удалось»
    expect(clientId, 'client was created').toBeDefined();
  });

  test('edit client', async () => {
    expect(clientId).toBeDefined();
  });

  test('delete client', async () => {
    expect(clientId).toBeDefined();
  });
});
EOF

# ── fullyParallel: что считать единицей ─────────────────────────────────────
say "fullyParallel: true, workers: 2 — один файл из трёх тестов"
run $PW test tests/booking.spec.ts --retries=0 2>&1 | grep -E '^Running|passed|failed|код возврата'

say "Тот же файл, fullyParallel: false"
run $PW test tests/booking.spec.ts --retries=0 -c playwright.seq.config.ts 2>&1 | grep -E '^Running|passed|failed|код возврата'
cat <<'TEXT'
  workers: 2 в обоих случаях, а воркеров поднялось два и один.

  workers — ПОТОЛОК: сколько процессов разрешено поднять.
  fullyParallel — ЕДИНИЦА параллельности: тест или файл целиком.
  С fullyParallel: false файл отдаётся одному воркеру, и его тесты идут
  по очереди. Дай ему два файла — снова было бы два воркера.

  В проекте fullyParallel: true и workers: 8. Без fullyParallel те же
  восемь воркеров означали бы «восемь файлов сразу», а не «восемь тестов».
TEXT

# ── Воркеров не больше, чем тестов ───────────────────────────────────────────
say "--workers=4 при трёх тестах"
run $PW test tests/booking.spec.ts --retries=0 --workers=4 2>&1 | grep -E '^Running|код возврата'
cat <<'TEXT'
  Потолок 4, а поднялось 3: лишний воркер было бы нечем занять. И наоборот,
  если тестов больше, чем воркеров, освободившийся воркер берёт следующий
  тест из очереди — никто не пропускается.

  Порядок строк в выводе — порядок ЗАВЕРШЕНИЯ, а не порядок в файле.
  Номера 1, 2, 3 раздаются по мере окончания и от прогона к прогону
  меняются местами.
TEXT

# ── mode: 'serial' ───────────────────────────────────────────────────────────
say "mode: 'serial' — первый упал"
run $PW test tests/serial.spec.ts --retries=0 2>&1 | grep -E '^Running|✘|✓|-  |did not run|failed$|passed|код возврата'
cat <<'TEXT'
  Три теста в одном воркере, по очереди. Первый упал — второй и третий
  даже не начинались: помечены «-» и в итоге «2 did not run». Так пишут, когда
  тесты делят состояние: первый создаёт клиента, остальные с ним работают.
  Без serial они разъехались бы по воркерам, а воркеры не делят ничего —
  переменная clientId у каждого своя.

  Цена: тесты больше не идут параллельно, и одно падение прячет остальные.
  Поэтому общего состояния лучше избегать: свои данные на каждый тест,
  фикстура с подготовкой и уборкой, общее — только на чтение.
TEXT

say "mode: 'serial' с ретраем"
run $PW test tests/serial.spec.ts --retries=1 2>&1 | grep -E '^Running|✘|✓|-  |did not run|failed$|passed|код возврата'
cat <<'TEXT'
  В последовательном режиме ретрай повторяет не упавший тест, а всю группу
  с начала: иначе «edit client» снова остался бы без клиента.
TEXT
