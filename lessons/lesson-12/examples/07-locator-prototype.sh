#!/usr/bin/env bash
# Урок 12 · Где у локатора лежит click
#
# Что здесь: click вызывается, но в самом объекте-локаторе его нет · он
# лежит в прототипе — один на все локаторы · то же у page. Продолжение —
# 08-prototypes.ts, уже без Playwright.
#
#   bash lessons/lesson-12/examples/07-locator-prototype.sh
#   cd /tmp/wl-pw-examples/locator-prototype   # песочница остаётся

source "$(dirname "$0")/_sandbox.sh" locator-prototype

cat > tests/proto.spec.ts <<'EOF'
import { test } from '@playwright/test';

test('where does click come from', async ({ page }) => {
  const yoga = page.getByRole('button', { name: 'Book Yoga' });
  const pilates = page.getByRole('button', { name: 'Book Pilates' });
  console.log('typeof yoga.click:', typeof yoga.click);
  console.log("Object.hasOwn(yoga, 'click'):", Object.hasOwn(yoga, 'click'));
  const proto = Object.getPrototypeOf(yoga);
  console.log('прототип локатора:', proto.constructor.name, "| в нём есть 'click':", Object.hasOwn(proto, 'click'));
  console.log('у двух локаторов один прототип:', Object.getPrototypeOf(pilates) === proto);
  console.log('и один click:', yoga.click === pilates.click);
  console.log('прототип page:', Object.getPrototypeOf(page).constructor.name);
});
EOF

say "Где у локатора click"
run $PW test tests/proto.spec.ts 2>&1 | grep -E 'click|прототип|код возврата'

cat <<'TEXT'
  yoga.click — функция, и вызывается она прекрасно. Но в самом объекте
  yoga её нет: Object.hasOwn(yoga, 'click') — false. Она лежит в другом
  объекте — ПРОТОТИПЕ локатора.

  Прототип один на все локаторы: у yoga и pilates он общий, и click
  у них — буквально одна и та же функция. Сколько бы локаторов вы ни
  создали, click написан один раз.

  Имя _Locator с подчёркиванием — так класс назван внутри собранного
  пакета Playwright; в типах и документации он Locator.

  Как устроен поиск по прототипам и откуда они берутся — в
  08-prototypes.ts:
    node lessons/lesson-12/examples/08-prototypes.ts
TEXT
