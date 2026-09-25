#!/usr/bin/env bash
# Урок 11 · Три уровня настроек: конфиг → флаг → сам тест
#
# Что здесь: флаг командной строки перебивает конфиг · настройка внутри теста
# перебивает флаг — на ретраях и на тайм-ауте.
#
#   bash lessons/lesson-11/examples/03-config-levels.sh
#   cd /tmp/wl-pw-examples/config-levels            # песочница остаётся

source "$(dirname "$0")/_sandbox.sh" config-levels

cat > tests/levels.spec.ts <<'EOF'
import { test, expect } from '@playwright/test';

test.describe('override', () => {
  test.describe.configure({ retries: 2 });
  test('always fails', async () => {
    expect(1).toBe(2);
  });
});

test('own timeout', async () => {
  test.setTimeout(1_000);
  await new Promise((resolve) => setTimeout(resolve, 1_500));
});
EOF

# ── Уровень 1 → уровень 2: флаг сильнее конфига ─────────────────────────────
say "Конфиг: retries 1, workers 2. Флаги: --retries=0 --workers=1"
run $PW test tests/booking.spec.ts --retries=0 --workers=1 2>&1 | grep -E '^Running|retry|passed|failed$|код возврата'
cat <<'TEXT'
  Один воркер и ни одного «retry #1» — хотя в конфиге retries: 1 и workers: 2.
  Флаг командной строки действует на этот запуск и перебивает конфиг.
TEXT

# ── Уровень 2 → уровень 3: тест сильнее флага ───────────────────────────────
say "Флаг --retries=0, а в describe — retries: 2"
run $PW test tests/levels.spec.ts -g "always fails" --retries=0 2>&1 | grep -E '✘|✓|код возврата'
cat <<'TEXT'
  Три попытки: исходная и два ретрая. test.describe.configure({ retries: 2 })
  внутри файла перебил и конфиг, и флаг командной строки.
TEXT

say "Флаг --timeout=10000, а в тесте test.setTimeout(1000)"
run $PW test tests/levels.spec.ts -g "own timeout" --timeout=10000 --retries=0 2>&1 | grep -E '✘|✓|Test timeout|код возврата'
cat <<'TEXT'
  Тест упал через секунду, а не через десять: «Test timeout of 1000ms
  exceeded». test.setTimeout внутри теста сильнее --timeout.

  Практическое следствие для wl-e2e: test.setTimeout( в проекте больше
  пяти тысяч раз, самый длинный — 80 минут. Прежде чем спорить
  с тайм-аутом из конфига, посмотрите в начало спека: скорее всего,
  реальное значение задано там.
TEXT
