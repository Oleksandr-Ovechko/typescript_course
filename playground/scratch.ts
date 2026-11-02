/**
 * Урок 1. ИИ-инструменты в работе · введение в проект `wl-e2e`
 *
 * Код закомментирован: раскомментируйте нужный кусок и запустите.
 *
 *   node playground/scratch.ts      запустить
 *   yarn typecheck                  проверить типы
 */

// ── Блок 6. Путь одного теста ───────────────────────────────────────────────────

// ── 6.3 Что вызвал тест ─────────────────────────────────────────────────────────

/*
   yarn case C19633 --env=staging-gen2      run-case.mjs: спек, конфиг, окружение
      │
      ▼
   playwright.config.ts ── dotenv ──► config/.env.staging-gen2 + .secure
      │
      ▼
   C19633.spec.ts ─────────────► constants/staffs.ts      кто входит
      │
      ├─► helpers/ проекта                       вход
      │      └─► wl-e2e-automation-helpers/…     общий вход, кэш .auth/
      └─► wl-e2e-automation-helpers/monolith/components/navigation.ts   открыть страницу
*/

// ── Блок 7. Резерв: первый файл на TypeScript ───────────────────────────────────

// ── 7.1 Один файл, две команды ──────────────────────────────────────────────────

// const caseId: string = 'C19633';
// const attempts: number = 3;
// console.log('кейс', caseId, 'попыток', attempts);

// ── 7.2 Кто тогда проверяет типы ────────────────────────────────────────────────

// const retryLimit: number = 3;
// console.log('предел', retryLimit);

export {};
