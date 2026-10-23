# Примеры шестнадцатого урока

Всё, что было на экране, — в готовом виде и с объяснениями. Урок шёл
в консоли браузера; здесь тот же код выполняется сам. Каждый файл `.sh`
собирает свою песочницу в `/tmp/wl-dom-examples/`, открывает страницу
в Chromium, выполняет код «как из консоли», запускает спеки Playwright
и по ходу рассказывает, что произошло.

```bash
bash lessons/lesson-16/examples/06-events.sh     # запустить любой
cd /tmp/wl-dom-examples/events                   # песочница остаётся — ковыряйте
```

Ничего за пределами `/tmp` скрипты не трогают. Объяснение каждой темы —
в [конспекте урока](../README.md).

## Как повторить руками в своём браузере

Код «из консоли» каждый пример кладёт в папку `console/` своей
песочницы. Открыть страницу и вставить его самому:

```bash
cd /tmp/wl-dom-examples/events
node site/server.mjs             # страница — http://localhost:4177
```

В браузере — F12 → Console, вставить содержимое `console/<файл>.js`,
Enter. Вывод будет тот же, кроме строк, которые зависят от вашего
компьютера (язык, экран).

## Что нужно, чтобы запустить

Только установленный `wl-e2e`: Playwright берётся из его `node_modules`
симлинком — та же версия, что в проекте. Стенд и интернет не нужны.

Если `wl-e2e` лежит не в `~/work/wl-e2e`, укажите путь:

```bash
WL_E2E=/путь/к/wl-e2e bash lessons/lesson-16/examples/01-environment.sh
```

Каждый прогон поднимает свой сервер на порту **4177** и гасит его после.
Если скрипт говорит, что порт занят, — где-то завис прошлый прогон:
`fuser -k 4177/tcp`.

## Файлы

| Файл | Тема | О чём |
|------|------|-------|
| [`_sandbox.sh`](_sandbox.sh) | — | **Не пример.** Общая сборка песочницы: страница «расписание и запись», страница загрузки, журнал событий, сервер, конфиг Playwright и запуск кода «как из консоли» |
| [`01-environment.sh`](01-environment.sh) | [Браузерное окружение](../README.md#браузерное-окружение) | `window`, `document`, `location` · что из объявленного попадает в `window` · что браузер рассказывает о себе · `page.evaluate` — дверь из теста в страницу · `devices['Pixel 5']` |
| [`02-tree-and-search.sh`](02-tree-and-search.sh) | [DOM-дерево](../README.md#dom-дерево) · [Навигация и поиск](../README.md#навигация-и-поиск) | Текстовые узлы из пробелов, комментарии · `childNodes` и `children` · соседи · `querySelector`, `closest`, `matches` |
| [`03-nodes-and-text.sh`](03-nodes-and-text.sh) | [Узлы и текст](../README.md#узлы-и-текст) | Цепочка прототипов кнопки · `textContent`, `innerText`, `innerHTML` · почему `toHaveText(/^Staff$/)` падает |
| [`04-attributes-and-changes.sh`](04-attributes-and-changes.sh) | [Атрибуты и свойства](../README.md#атрибуты-и-свойства) · [Изменение документа](../README.md#изменение-документа) | `value` и `checked`: атрибут против свойства · `dataset` — не `Map` · `toHaveValue` против `toHaveAttribute` · живые списки · скрытый элемент в DOM и Playwright |
| [`05-geometry-and-cover.sh`](05-geometry-and-cover.sh) | [Размеры и координаты](../README.md#размеры-прокрутка-координаты) | `getBoundingClientRect` · `scrollIntoView` · `elementFromPoint` · «intercepts pointer events», `force: true`, `dispatchEvent` |
| [`06-events.sh`](06-events.sh) | [События](../README.md#события) · [Всплытие и погружение](../README.md#всплытие-и-погружение) · [Делегирование](../README.md#делегирование) | Подписка и отписка · `preventDefault`, `submit` приходит на форму · путь события · `stopPropagation` в обеих фазах · один обработчик на список · `disabled` в браузере и в Playwright |
| [`07-custom-events.sh`](07-custom-events.sh) | [Свои события](../README.md#свои-события-и-dispatchevent) | `Event` и `CustomEvent`, `detail`, `bubbles` · `isTrusted` · классы только с `new` · `new Event('click')` не ставит галочку · `dispatchEvent('click')` у Playwright |
| [`08-event-interfaces.sh`](08-event-interfaces.sh) | [Интерфейсы событий](../README.md#интерфейсы-событий) | Классы событий · отправленный `keydown` не печатает · когда буква появляется в поле · зажатая клавиша · что порождают `click`, `fill`, `pressSequentially`, `check`, `selectOption` |
| [`09-forms.sh`](09-forms.sh) | [Формы](../README.md#формы) | `document.forms`, `elements` · `input` и `change` · родной сеттер `value` · спрятанный `select` и Chosen |
| [`10-loading.sh`](10-loading.sh) | [Загрузка документа](../README.md#загрузка-документа-и-ресурсов) | `readyState` · порядок скриптов, `DOMContentLoaded`, `load` · четыре `waitUntil` · `load` и `error` у картинки · хелпер ожидания `wl-e2e` |
| [`11-mutation-observer.sh`](11-mutation-observer.sh) | [`MutationObserver`](../README.md#mutationobserver) | Колбэк — после текущего кода, пачкой · `childList`, `attributes` · баннер миграции в `wl-e2e` · правило A2 |

## Порядок чтения

**01 → 05** — первая половина урока: что такое страница и как её
читать. **03** и **04** — самые нужные для тестов: что читает
`toHaveText` и чем `toHaveValue` отличается от `toHaveAttribute`.

**06 → 09** — как страница реагирует: события, их классы, формы.
**08** отвечает на вопрос с урока — `fill` или `pressSequentially`.

**10** — загрузка: почему после `domcontentloaded` клик проходит без
ошибки и ничего не делает. **11** — наблюдатель и правило A2.

## Чего ждать от вывода

- **01** печатает язык и экран вашего компьютера — у всех свои.
- **Строки с номерами** (`5)`, `9a)`) — то, что напечатала страница;
  остальные — спеки Playwright.
- **Время в `10`** округлено до 100 мс и может сдвинуться на шаг,
  порядок — нет.

Весь набор подряд идёт около двух минут:

```bash
for f in lessons/lesson-16/examples/[0-9]*.sh; do bash "$f"; done
```
