#!/usr/bin/env bash
# Урок 16 · MutationObserver
#
# Что здесь: наблюдатель за изменениями DOM · колбэк вызывается не сразу,
# а после текущего кода, пачкой · childList и attributes · где он
# в wl-e2e — хелпер баннера миграции · правило A2: кому можно работать с DOM.
#
#   bash lessons/lesson-16/examples/11-mutation-observer.sh
#   cd /tmp/wl-dom-examples/mutation-observer    # песочница остаётся

source "$(dirname "$0")/_sandbox.sh" mutation-observer

say "Наблюдатель за списком"
cat > console/observer.js <<'JS'
const sessionsList = document.getElementById('sessions');
const mutations = [];
const observer = new MutationObserver((records) => {
  for (const r of records) mutations.push(`${r.type}: +${r.addedNodes.length} −${r.removedNodes.length}`);
  console.log('15)', records.length, mutations.join(' | '));
});
observer.observe(sessionsList, { childList: true });
const toast = document.createElement('li');
toast.textContent = 'Toast';
sessionsList.append(toast);
toast.remove();
console.log('15a)', 'наблюдатель ещё не вызван', mutations.length);
JS
console_run console/observer.js

cat <<'TEXT'
  observe(узел, что смотреть): childList — добавление и удаление детей,
  attributes — атрибуты, characterData — текст, subtree: true — и всё
  поддерево.

  15a) напечатан раньше 15), и в нём 0. Не потому, что строку добавили
  и удалили: колбэк наблюдателя вызывается всегда ПОСЛЕ текущего кода,
  одной пачкой. Пока код шёл, записей ещё не было. Потом пришла пачка
  из двух записей: +1 и −1.
TEXT

cat > console/async.js <<'JS'
const list = document.getElementById('sessions');
const calls = [];
new MutationObserver((records) => calls.push(records.length)).observe(list, { childList: true });
list.append(document.createElement('li'));
console.log('15b)', 'сразу после append:', calls.length);
Promise.resolve().then(() => console.log('15c)', 'чуть позже:', JSON.stringify(calls)));
JS
console_run console/async.js

cat <<'TEXT'
  Только append, без remove — сразу 0, чуть позже — один вызов с одной
  записью.
TEXT

say "Атрибуты: что было и что стало"
cat > console/attributes.js <<'JS'
const row = document.querySelector('.session');
const attrObserver = new MutationObserver((records) => {
  console.log('15d)', records.map((r) => `${r.attributeName}: ${r.oldValue} → ${row.getAttribute(r.attributeName)}`).join(' | '));
  attrObserver.disconnect();
});
attrObserver.observe(row, { attributes: true, attributeOldValue: true });
row.dataset.key = '1006';
JS
console_run console/attributes.js

cat <<'TEXT'
  attributeOldValue: true — запомнить старое значение. disconnect() —
  перестать следить; здесь наблюдатель отключает себя сам после
  первой пачки.
TEXT

say "MutationObserver в wl-e2e"
cat <<'TEXT'
  В wl-e2e он есть: helpers/monolith/components/migration-banner.ts.
  На страницах BO выскакивает баннер миграции и перекрывает кнопки.
  В файле два хелпера.

  dismissMigrationBannerIfPresent — «закрыть, если есть»: жмёт кнопку
  закрытия, а если у этой формы баннера кнопки нет — убирает его из DOM.
  Его приходилось звать перед каждым кликом, и не успевали: «reacting
  was losing» — баннер появлялся на любой странице.

  suppressMigrationBanner — наблюдатель. Через page.addInitScript он
  ставится на каждую страницу раньше её собственных скриптов: observe
  на document.documentElement с { childList: true, subtree: true }, и
  баннер удаляется в момент появления. Если documentElement ещё нет —
  ждёт DOMContentLoaded.

  И правило A2 из RULES.md — «A spec holds no DOM»: в файлах *.spec.ts
  нет page.locator и нет своих функций, спек только вызывает хелперы.
  Хелперам работать с DOM можно — комментарий в migration-banner.ts так
  и говорит: «A2 forbids DOM work in specs; this is a component helper».
TEXT
