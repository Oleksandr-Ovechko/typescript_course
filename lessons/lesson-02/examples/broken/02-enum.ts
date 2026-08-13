/**
 * enum и рантайм. Файл исключён из `yarn typecheck` — здесь он валиден,
 * но Node его не запустит.
 *
 *   node lessons/lesson-02/examples/broken/02-enum.ts
 *   → SyntaxError: TypeScript enum is not supported in strip-only mode
 *
 * Почему: Node умеет ровно одно — СТИРАТЬ типы. enum стереть нельзя, потому
 * что он не тип, а код: после компиляции остаётся настоящий объект.
 *
 * ЧТО ЭТО НЕ ЗНАЧИТ: enum не «сломает тест». Playwright транспилирует через
 * babel, полноценно, и enum под ним работает (проверено на @playwright/test 1.60).
 * Мы не пишем enum по КОНВЕНЦИИ проекта, а не из-за технического запрета:
 * во всём wl-e2e он ровно один, в замороженном explorer.
 *
 * Убедиться, во что превращается enum:
 *   npx tsc lessons/lesson-02/examples/broken/02-enum.ts \
 *       --outDir /tmp/demo --target ES2022 --module ESNext
 *   и открыть /tmp/demo/02-enum.js — там будет объект, а не тип.
 */

enum Size {
  S = 1,
  M = 2,
  L = 3,
}

console.log('размер M =', Size.M, '| typeof Size =', typeof Size);
