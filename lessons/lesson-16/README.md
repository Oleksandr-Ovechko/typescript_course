# Урок 16. Браузерное окружение и DOM

Тест на Playwright живёт в Node. Кнопка, на которую он жмёт, — в браузере.
Этот урок — о том, что происходит **внутри страницы**: из чего она
состоит, что в ней можно прочитать, как она реагирует на клик и ввод
и когда она на самом деле готова к работе. Всё — на примерах из того,
что тесты `wl-e2e` делают каждый день: `toHaveText`, `toHaveValue`,
`click`, `fill`, `dispatchEvent`, `goto`.

Урок шёл в две части, в открытой консоли браузера: вт 20.10 — блоки 1–7,
ср 21.10 — блоки 8–15. Итог и домашку на занятии не успели — они ниже.
Это последний урок по JavaScript и Playwright: дальше — архитектура
проекта.

## Что было на занятии

| Тема | Пример |
|------|--------|
| Уточнения к прозвучавшему | [раздел ниже](#уточнения-к-занятию) |
| Браузерное окружение, `page.evaluate` | [`01-environment.sh`](examples/01-environment.sh) |
| DOM-дерево, навигация и поиск | [`02-tree-and-search.sh`](examples/02-tree-and-search.sh) |
| Узлы и текст, `toHaveText` | [`03-nodes-and-text.sh`](examples/03-nodes-and-text.sh) |
| Атрибуты и свойства, изменение документа | [`04-attributes-and-changes.sh`](examples/04-attributes-and-changes.sh) |
| Размеры, прокрутка, координаты, `force: true` | [`05-geometry-and-cover.sh`](examples/05-geometry-and-cover.sh) |
| События, всплытие, делегирование | [`06-events.sh`](examples/06-events.sh) |
| Свои события, `dispatchEvent`, `isTrusted` | [`07-custom-events.sh`](examples/07-custom-events.sh) |
| Интерфейсы событий, что порождает Playwright | [`08-event-interfaces.sh`](examples/08-event-interfaces.sh) |
| Формы, родной сеттер, Chosen | [`09-forms.sh`](examples/09-forms.sh) |
| Загрузка документа, `waitUntil` | [`10-loading.sh`](examples/10-loading.sh) |
| `MutationObserver`, правило A2 | [`11-mutation-observer.sh`](examples/11-mutation-observer.sh) |

Таблица примеров с описаниями — [`examples/README.md`](examples/README.md).
Домашка — [`homework/`](homework/README.md).

Примеры запускаются одной командой и печатают то, что было в консоли
на уроке: `bash lessons/lesson-16/examples/06-events.sh`. Нужен только
установленный `wl-e2e`.

---

## Уточнения к занятию

Места, где на занятии прозвучала неточность. Всё проверено запуском
в Chromium, Firefox и WebKit и поиском по `wl-e2e`. Первыми — те, что
касаются правил и кода проекта.

**1. Правило A2 — про спеки, не про хелперы.** A2 в `RULES.md` — «A spec
holds no DOM»: в файле `*.spec.ts` нет `page.locator` и нет своих
функций, спек только вызывает хелперы. Хелперам работать с DOM можно.
Хелпер баннера миграции (`helpers/monolith/components/migration-banner.ts`)
правило не нарушает — в его комментарии так и написано: «A2 forbids DOM
work in *specs*; this is a component helper». И баннер он сначала
пытается закрыть кнопкой; из DOM убирает, только если кнопки нет.

**2. `MutationObserver` в проекте используется.** Тот же
`migration-banner.ts`: `suppressMigrationBanner` ставит наблюдатель на
каждую страницу и удаляет баннер в момент появления. И это не
единственный файл в `wl-e2e` с `MutationObserver`. Подробно —
[ниже](#mutationobserver).

**3. `goto` по умолчанию ждёт `load`, а не `DOMContentLoaded`.** И главное
про `waitUntil: 'domcontentloaded'`: после него `click()` находит кнопку,
нажимает **без ошибки** — а на странице ничего не происходит, если
обработчик кнопки вешается позже. [Загрузка](#загрузка-документа-и-ресурсов).

**4. Порядок в конце загрузки:** сначала `readyState` становится
`complete`, потом приходит событие `load` — не наоборот. А в состоянии
`interactive` DOM построен целиком, его уже можно читать и менять.

**5. `networkidle` — 500 мс без сетевых соединений.** 5 секунд — это
тайм-аут ожидания в хелпере `waitUntilNavigationIsFinished`: он ждёт
`load`, потом `networkidle` не дольше 5 с, и если не дождался — это
не ошибка (правило W12).

**6. `display: none` не убирает элемент из DOM.** Его не рисуют, но он
в дереве. Playwright его читает — `textContent()` и `toHaveText`
работают, — не может только нажать: `click` ждёт видимости и падает
по тайм-ауту. `isVisible()` — `false`.

**7. Буква появляется в поле до `keyup`, а не на нём.** Порядок:
`keydown → keypress → beforeinput → input → keyup`, и на `input` буква
уже в поле. Зажатая клавиша повторяет `keydown` и печатает каждый раз —
без единого `keyup`. `keypress` — не «объединение `keydown` и `keyup`»,
а устаревшее событие сразу за `keydown`. `beforeinput` приходит
и при настоящем вводе, не только из скриптов.

**8. `pointerdown` и `mousedown` — нажатие**, а не начало и конец
движения: одно нажатие в двух семействах событий. Движение —
`pointermove` и `mousemove`, и `click()` Playwright шлёт их до нажатия.

**9. Своё событие можно создать любым классом.** `new Event('booking:done')`
отправляется и ловится так же, как `CustomEvent`. `CustomEvent` нужен
только ради `detail` — данных в событии.

**10. `dispatchEvent` в проекте чаще — у локатора.** `locator.dispatchEvent('click')`
встречается примерно в полтора раза чаще, чем `dispatchEvent(new …)`
внутри `evaluate`; и того и другого — тысячи.

**11. Клик по `disabled`-кнопке: браузер молчит, Playwright — нет.**
`button.click()` в консоли не отправляет `click` вовсе. Playwright ждёт,
пока кнопка станет доступной, и падает по тайм-ауту: «element is not
enabled». Так же он ведёт себя с перекрытой кнопкой: не зацикливается,
а ждёт до тайм-аута действия и падает.

**12. Делегирование держится на всплытии**, а `stopPropagation`
останавливает событие там, где вызван, в любой фазе: вызванный на
`body` при погружении, он не пустит событие до кнопки вовсе.

**13. Колбэк `MutationObserver` вызывается всегда после текущего кода,
пачкой.** Поэтому сразу после изменения список записей пуст — не потому,
что изменения «взаимно уничтожились».

**14. Атрибут `checked` у галочки есть**: `<input type=checkbox checked>`.
Пара та же, что у `value`: атрибут — начальное состояние
(`defaultChecked`), свойство `checked` — текущее.

**15. Переносы в `textContent` решает разметка, а не отрисовка.** Элемент
нарисован в одну строку, а в разметке перенесён — в `textContent`
будут переносы и отступы.

**16. В `window` попадает не всё объявленное.** Только `var` и объявления
`function`. `let`, `const`, `class` — нет. Элемент из `createElement`
до `append` живёт только в переменной — ни в DOM, ни в `window`.

**17. `x` в `getBoundingClientRect` — от левого края окна, `y` —
от верхнего.** `offsetWidth`, `offsetTop` и остальные `offset*` —
свойства самого элемента; у прямоугольника их нет.

**18. `dataset` — не `Map`.** Это обычный объект особого класса
(`DOMStringMap`): `get` у него нет, читать — `dataset.uid`.

**19. `navigator.connection.effectiveType` — класс скорости**
соединения (`'4g'`), а не тип сети: Wi-Fi это или мобильная, оно не
говорит.

**20. Вибрацию Playwright не эмулирует** (касание — да, `hasTouch`).
Из теста её можно вызвать только через страницу:
`page.evaluate(() => navigator.vibrate(200))`. `vibrate` — метод
`navigator`, не `window`.

**21. Класс без `new` бросает `TypeError` сразу:** «Class constructor Slot
cannot be invoked without 'new'». Классы событий тоже: `Event('x')`
без `new` — ошибка.

**22. Запретить клавишу через `preventDefault` можно не любую.** Часть
сочетаний перехватывают браузер или операционная система, и до страницы
они не доходят (спецификация Keyboard Lock называет Escape, Alt+Tab,
Ctrl+N).

**23. `input` приходит на каждое изменение поля**, а не «когда ввод
закончился». «Значение зафиксировано» — это `change`.

---

## Браузерное окружение

Язык один, а окружения у него разные. В Node есть файлы и процессы,
в браузере — окно, документ, адрес, история. Всё браузерное висит на
глобальном объекте `window` (он же `globalThis`): `document` — страница,
`location` — адрес, `history`, `navigator` — сам браузер, `screen` —
экран. Документ называют **DOM**, остальное — **BOM**.

Браузер рассказывает о себе много: язык, число ядер, размер экрана,
плотность пикселей, заряд батареи (`navigator.getBattery()`, только
Chromium и только на https или localhost), вибрация. И сообщает, что им
управляет программа: `navigator.webdriver` — `true` во всех трёх
движках под Playwright.

**Тест в Node, страница в браузере.** В коде теста нет `document` —
его выполняет Node. Дверь в страницу одна — `page.evaluate`:

```typescript
const title = await page.evaluate(() => document.title);
```

Функция уезжает в браузер, выполняется там, результат возвращается
в тест. Так же из теста зовут что угодно браузерное — `navigator`,
`localStorage`, свойства элементов.

**Телефон — это подмена тех же свойств.** `devices['Pixel 5']` задаёт
строку браузера с «Mobile», экран 393 точки, плотность 2.75, касания.
В `wl-e2e` так запускается проект explorer.

Пример — [`01-environment.sh`](examples/01-environment.sh).

---

## DOM-дерево

Страница — дерево объектов. Корень — `<html>`
(`document.documentElement`), от него `<head>` и `<body>`. Каждый тег —
узел-элемент, каждый кусок текста — **текстовый узел**, комментарий —
тоже узел.

Главная неожиданность: **перенос строки и отступы между тегами в
разметке — тоже текстовые узлы.** Поэтому у `<body>` песочницы 25 узлов
(`childNodes`), а элементов — 11 (`children`). У всех «соседских»
свойств есть пара: `firstChild` / `firstElementChild`, `nextSibling` /
`nextElementSibling` — первое видит пробелы, второе только элементы.

## Навигация и поиск

| Метод | Что вернёт |
|---|---|
| `querySelector(css)` | первый подходящий элемент или `null` |
| `querySelectorAll(css)` | все подходящие — снимок на момент вызова |
| `getElementById(id)` | то же, что `querySelector('#id')` |
| `el.closest(css)` | ближайший подходящий **вверх** по дереву, начиная с самого `el` |
| `el.matches(css)` | подходит ли `el` под селектор — `true` / `false` |

Селектор находит элементы — но не текстовые узлы и не содержимое
shadow DOM.

Пример — [`02-tree-and-search.sh`](examples/02-tree-and-search.sh).

---

## Узлы и текст

Кнопка на странице — объект класса `HTMLButtonElement`. Её методы
лежат в прототипах (уроки 12–13): цепочка
`HTMLButtonElement → HTMLElement → Element → Node → EventTarget → Object`.
`click` — в `HTMLElement.prototype`, `addEventListener` — в `EventTarget`.

Текст элемента читается тремя способами:

| Свойство | Что даёт | `<div class="filter-title">` на уроке |
|---|---|---|
| `textContent` | текст из разметки как есть: переносы, отступы, скрытое | `"\n    Staff\n  "` |
| `innerText` | как текст нарисован: без лишних пробелов и скрытого | `"Staff"` |
| `innerHTML` | разметка строкой | — |

**Это напрямую про `toHaveText`.** Он читает `textContent`. Со строкой
сначала сжимает пробелы и обрезает края — `toHaveText('Staff')` проходит.
С регуляркой сжатия нет — `toHaveText(/^Staff$/)` падает на
`"\n    Staff\n  "`. Два выхода: допустить пробелы в шаблоне —
`/^\s*Staff\s*$/`, или читать нарисованный текст —
`toHaveText(/^Staff$/, { useInnerText: true })`.

Пример — [`03-nodes-and-text.sh`](examples/03-nodes-and-text.sh).

---

## Атрибуты и свойства

**Атрибут** — то, что написано в разметке: `<input value="Guest">`.
**Свойство** — поле объекта-элемента: `input.value`. При загрузке
свойство заполняется из атрибута, а дальше живёт своей жизнью: человек
ввёл «Alex» — `input.value` стал `'Alex'`, `getAttribute('value')`
остался `'Guest'` (он же `defaultValue`).

У галочки та же пара: атрибут `checked` — начальное состояние
(`defaultChecked`), свойство `checked` — текущее.

**`data-*`** — свои атрибуты разметки: `data-uid="501"` читается как
`el.dataset.uid` (всегда строка). В `wl-e2e` по `data-key` находят
строку по id из базы — `schedule.ts:320-322`.

**Для тестов:** `toHaveValue` читает свойство — то, что сейчас в поле.
`toHaveAttribute('value', …)` — атрибут, то, что было в разметке.
Проверять введённое — `toHaveValue`.

## Изменение документа

`document.createElement('li')` создаёт элемент, `append` кладёт его
в дерево, `remove` убирает, `classList.add` / `remove` / `toggle` меняют
классы. `getComputedStyle(el)` — итоговые стили: так видно, что у
`<span hidden>` — `display: none`.

**Живые и неживые списки.** `getElementsByClassName` — живой: сам видит
новые элементы. `querySelectorAll` — снимок. Локатор Playwright ни то
ни другое: он ищет заново при каждом действии.

**Скрытый элемент остаётся в DOM** — см. уточнение 6. Так устроены списки
Chosen в WL: настоящий `<select>` спрятан (`display: none`), на экране —
набор `div`.

Пример — [`04-attributes-and-changes.sh`](examples/04-attributes-and-changes.sh).

---

## Размеры, прокрутка, координаты

`el.getBoundingClientRect()` — прямоугольник элемента относительно окна:
`x`/`left` — от левого края, `y`/`top` — от верхнего, плюс `width`
и `height`. Прокрутили — `y` поменялся. `el.scrollIntoView()` прокручивает
страницу к элементу. `document.elementFromPoint(x, y)` — кто лежит
**сверху** в этой точке.

**Отсюда сообщение Playwright «intercepts pointer events».** Перед
нажатием `click()` проверяет: элемент виден, не двигается, включён —
и в центре элемента лежит он сам. Если сверху другой элемент (слой,
баннер, оверлей диалога), Playwright называет его, повторяет попытку
и падает по тайм-ауту.

| Чем нажать | Что будет с кнопкой под слоем |
|---|---|
| `click()` | ждёт и падает: «… intercepts pointer events» |
| `click({ force: true })` | проверки выключены, но мышь нажимает в ту же точку — клик достаётся **слою** |
| `dispatchEvent('click')` | мышь не двигается, событие отправляется прямо кнопке — **срабатывает** |

`force: true` не меняет физику: верхний элемент получает клик всё равно.

Пример — [`05-geometry-and-cover.sh`](examples/05-geometry-and-cover.sh).

---

## События

Страница узнаёт о действиях человека через **события**: клик, ввод,
прокрутка, загрузка. **Обработчик** — функция, которую дали элементу:

```javascript
const onBook = (event) => console.log(event.type, event.target.textContent);
button.addEventListener('click', onBook);
button.removeEventListener('click', onBook);   // снять — той же функцией
```

Объект события: `type` — что случилось, `target` — с каким элементом,
`currentTarget` — чей обработчик сейчас работает.

**Действие по умолчанию** — то, что браузер делает сам: ссылка
переходит, кнопка `type=submit` отправляет форму, галочка переключается.
`event.preventDefault()` его отменяет. Событие `submit` приходит на
**форму**, не на кнопку: обработчик `submit` вешают на `<form>`.

## Всплытие и погружение

Событие идёт по дереву дважды: от корня вниз до элемента —
**погружение**, потом от элемента обратно вверх — **всплытие**.

```
BODY:погружение → UL:погружение → BUTTON:погружение → BUTTON:всплытие → UL:всплытие → BODY:всплытие
```

`addEventListener('click', fn)` слушает всплытие,
`addEventListener('click', fn, true)` — погружение.
`event.stopPropagation()` останавливает событие в том месте, где
вызван.

## Делегирование

Один обработчик на общем предке вместо обработчика на каждой кнопке:

```javascript
list.addEventListener('click', (event) => {
  const button = event.target.closest('.book');
  if (!button) return;
  console.log(button.closest('.session').dataset.key);
});
```

Клик по кнопке всплывает до списка, и там по `event.target` видно, куда
нажали. Строки, добавленные позже, работают без новых обработчиков.

Пример — [`06-events.sh`](examples/06-events.sh).

---

## Свои события и `dispatchEvent`

Событие можно создать и отправить кодом:

```javascript
row.dispatchEvent(new CustomEvent('booking:done', { detail: { key: '1005' }, bubbles: true }));
```

- Имя — любая строка; `booking:done` — просто договорённость.
- `CustomEvent` — ради `detail`; без данных хватит `new Event(...)`.
- `bubbles` по умолчанию `false`: без `bubbles: true` событие не всплывёт.
- `isTrusted` — `false` у всего, что отправлено кодом. `true` — у событий,
  которые браузер породил сам: от человека или от `click`, `fill`,
  `press` Playwright.

**Класс события решает, что сделает браузер.** `new Event('click')`
обработчики получат — но галочку браузер не переключит: действие по
умолчанию на клик он выполняет только для `MouseEvent` и его наследников.
`new MouseEvent('click')` и `el.click()` — переключат. Playwright сам
создаёт `MouseEvent` для `locator.dispatchEvent('click')`, так что
ловушка — только в своём коде внутри `evaluate`.

**Свои события проекта.** В `wl-e2e` после выставления значения
спрятанному `select` отправляют событие библиотеки Chosen —
`chosen:updated` (`appointment-setup-page.ts:457-465`): библиотека его
слушает и перерисовывает видимый список.

Пример — [`07-custom-events.sh`](examples/07-custom-events.sh).

---

## Интерфейсы событий

У каждого события свой класс: `PointerEvent → MouseEvent → UIEvent → Event`,
`KeyboardEvent`, `InputEvent`, `FocusEvent`. У клавиатуры — `key`
(символ: `'a'`) и `code` (физическая клавиша: `'KeyA'`).

**Отправленный `keydown` букву не печатает.** Событие из кода —
сообщение «клавишу нажали», а не нажатие: обработчики его получат,
поле останется пустым.

**Что порождает каждое действие Playwright** (журнал событий из примера):

| Действие | События |
|---|---|
| `click()` | движение (`pointermove`, `mousemove`) → `pointerdown` → `mousedown` → `focus` → `pointerup` → `mouseup` → `click` |
| `dispatchEvent('click')` | только `click`, `isTrusted: false` |
| `fill('Al')` | `focus` → `beforeinput` → `input` — один раз на всю строку; ни клавиш, ни `change` |
| `pressSequentially('ex')` | на каждую букву: `keydown` → `keypress` → `beforeinput` → `input` → `keyup` |
| `press('Enter')` | `keydown` → `keypress` → `beforeinput` → `change` → `keyup` |
| `check()` | как `click`, плюс `input` и `change` |
| `selectOption('pack10')` | `input` и `change`, оба `isTrusted: false` |

**`fill` или `pressSequentially`?** Если поле реагирует на каждую
клавишу — маска, форматтер, подсказки, — `fill` ему не подходит: он не
нажимает ни одной клавиши. В `wl-e2e` так вводится телефон: плагин
intl-tel-input форматирует номер по ходу ввода, и хелпер
`fillClientCellPhone` (`helpers/monolith/add-client/client-add-page.ts`)
печатает по 150 мс на клавишу — при 50 мс плагин теряет последние
цифры. А печатать начинает, только когда плагин инициализировался: до
этого введённое стирается. На простом поле `fill` быстрее и надёжнее.

Пример — [`08-event-interfaces.sh`](examples/08-event-interfaces.sh).

---

## Формы

`document.forms` — все формы страницы, по `name` или `id`;
`form.elements` — поля формы по `name`. Значение у каждого поля своё:
`value` у текстового, `checked` у галочки, `value` и `selectedIndex`
у списка.

| Событие | Когда |
|---|---|
| `input` | на каждое изменение — по событию на букву |
| `change` | изменение зафиксировано: текстовое поле — при уходе из него или по Enter; галочка и список — сразу |

**Почему `fill` иногда «не срабатывает».** `value` у поля — пара геттер
и сеттер (урок 14) в `HTMLInputElement.prototype`. Фреймворк может
положить на элемент **свой** сеттер `value` — запоминать записанное
и на `input` реагировать, только если значение отличается от
запомненного. Тогда запись, прошедшая через его сеттер, для него
«ничего не поменяла». Обход — записать **родным** сеттером из прототипа
и отправить `input`:

```javascript
const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
nativeSetter.call(input, '4242');
input.dispatchEvent(new Event('input', { bubbles: true }));
```

В `wl-e2e`: «Playwright .fill() doesn't trigger React's onChange on this
WL form; use the native prototype setter»
(`projects/widgets/end-to-end-tests/schedule-widget/C85303.helpers.ts:128`).
В примере это показано на модели поля; что настоящий React устроен
ровно так же — не проверялось.

**Chosen.** Присвоение `select.value = …` событий не порождает: значение
поменялось, слушатели не узнали. Поэтому проект после присвоения сам
отправляет `change` и `chosen:updated`
(`appointment-setup-page.ts:457-465`, `class-period-edit-page.ts:33-39`).

Пример — [`09-forms.sh`](examples/09-forms.sh).

---

## Загрузка документа и ресурсов

```
loading      ─ браузер читает HTML и строит DOM; обычный <script> — сразу, по ходу
interactive  ─ HTML разобран, DOM построен — его можно читать и менять
             ─ async-скрипт — как только скачался, в любой момент
             ─ defer-скрипты — по порядку, после разбора HTML
             ─ DOMContentLoaded   ◀─ goto(…, { waitUntil: 'domcontentloaded' })
complete     ─ картинки, стили, фреймы скачаны
             ─ load               ◀─ goto(…)  по умолчанию
```

`document.readyState` — где страница сейчас.

| `waitUntil` у `goto` | Чего ждёт |
|---|---|
| `'commit'` | сервер ответил, документ начал грузиться |
| `'domcontentloaded'` | DOM построен |
| `'load'` — **по умолчанию** | скачано всё |
| `'networkidle'` | 500 мс без сетевых соединений; в документации — DISCOURAGED |

**Ловушка `domcontentloaded`.** На многих страницах обработчики
появляются только когда скачаны все скрипты — в WL так
(`UI-PATTERNS.md` §9.1 в `wl-e2e`). После `domcontentloaded` кнопка уже
есть, видна и включена — `click()` проходит **без ошибки**, но
обработчика ещё нет, и ничего не происходит. Тест упадёт позже
и в другом месте. В примере это видно на странице, где обработчик
вешается на `load`: после `commit` и `domcontentloaded` — «не записан»,
после `load` — «записан».

**Хелперы проекта.** Переходы между страницами ждут через
`waitUntilNavigationIsFinished` (`helpers/monolith/technical-helper.ts`):
сначала `load` — обязательно, потом короткое «успокоение» не дольше 5 с,
и истечение — не ошибка. В ветке `draft` это «успокоение» —
`waitForWlInactive` (`helpers/monolith/utils/wl-activity.ts`): он
спрашивает саму страницу WL, занята ли она — запросы AJAX, переход,
переключение вида, анимации jQuery, — как это делает собственный
Selenium-набор монолита. Правило — W12 в `RULES.md`.

**Загрузка отдельного ресурса.** У картинки, скрипта, фрейма — свои
`load` и `error`.

Пример — [`10-loading.sh`](examples/10-loading.sh).

---

## `MutationObserver`

Наблюдатель за изменениями: вызывает функцию, когда в выбранной части
DOM что-то поменялось.

```javascript
const observer = new MutationObserver((records) => { /* что поменялось */ });
observer.observe(list, { childList: true });   // дети; attributes, characterData, subtree — по желанию
observer.disconnect();                         // перестать следить
```

Колбэк вызывается не сразу, а **после текущего кода, одной пачкой**:
добавили и тут же удалили строку — колбэк придёт один раз, с двумя
записями (+1 и −1).

**В `wl-e2e`** — `helpers/monolith/components/migration-banner.ts`. На
страницах BO выскакивает баннер миграции и перекрывает кнопки.
`dismissMigrationBannerIfPresent` закрывает его, когда позовут, —
и звать приходилось перед каждым кликом. `suppressMigrationBanner`
через `page.addInitScript` ставит наблюдатель на каждую страницу раньше
её собственных скриптов, и баннер удаляется в момент появления.

Это хелпер, поэтому DOM ему можно: правило A2 запрещает DOM только
в спеках (уточнение 1).

Пример — [`11-mutation-observer.sh`](examples/11-mutation-observer.sh).

---

## Итог урока

```
 тест (Node)  ── page.evaluate ──▶  window
                                     └ document — дерево узлов
                                         ├ элементы: класс → прототипы → методы
                                         ├ текст: textContent (как есть) / innerText (как видно)
                                         ├ атрибут (разметка) ≠ свойство (сейчас)
                                         └ события: погружение ↓ цель ↑ всплытие
 click()  = проверки → прокрутка → мышь в центр → кому достанется — решает, кто сверху
 fill()   = фокус + значение + input  (без клавиш, без change)
 goto()   = ждёт load;  domcontentloaded — DOM готов, обработчики — не обязательно
```

1. Тест живёт в Node, страница — в браузере; `evaluate` — дверь между ними.
2. Пробелы в разметке — узлы; `toHaveText` читает `textContent`.
3. Атрибут — как было в разметке, свойство — как сейчас; `toHaveValue`
   про свойство.
4. Клик достаётся тому, кто сверху в центре элемента; `force` не меняет
   физику, `dispatchEvent` её обходит.
5. «Страница загрузилась» — это `load`; `DOMContentLoaded` — только DOM.

---

## Домашнее задание

Три задания — в [`homework/`](homework/README.md): прочитать элемент
стенда в консоли, разобрать три `evaluate` из проекта и проверить один
`goto` с `domcontentloaded`. Домашки прошлых уроков на занятиях
не объявлялись: [урок 13](../lesson-13/homework/README.md),
[урок 14](../lesson-14/homework/README.md),
[урок 15](../lesson-15/homework/README.md).

---

## Словарь терминов

| Термин | Что значит |
|--------|------------|
| **браузерное окружение** (host environment) | всё, что браузер даёт JavaScript сверх самого языка: `window`, документ, адрес, история. У Node своё окружение |
| **DOM** (Document Object Model) | страница в виде дерева объектов: каждый тег и каждый кусок текста — объект |
| **BOM** (Browser Object Model) | объекты браузера помимо документа: `location`, `history`, `navigator`, `screen` |
| **узел** (node) | любой объект DOM-дерева: элемент, текст, комментарий |
| **текстовый узел** (text node) | текст между тегами — **включая пробелы и переносы строк** из разметки |
| **атрибут** (attribute) | то, что написано в HTML-теге: `value="Guest"`. Читается `getAttribute` |
| **DOM-свойство** (property) | поле объекта-элемента: `input.value`. Заполняется из атрибута, дальше живёт своей жизнью |
| **обработчик события** (event handler) | функция, которую страница дала элементу: «когда случится `click` — вызови её» |
| **объект события** (event object) | аргумент обработчика: что случилось (`type`), с каким элементом (`target`), подробности |
| **действие по умолчанию** (default action) | то, что браузер делает сам: переход по ссылке, отправка формы. Отменяется `preventDefault()` |
| **погружение** (capturing) | путь события от корня документа вниз до элемента |
| **всплытие** (bubbling) | путь события от элемента обратно вверх до корня |
| **делегирование** (delegation) | один обработчик на общем предке вместо обработчика на каждом элементе |
| **своё событие** (custom event) | событие, созданное кодом: `new Event(...)`, `new CustomEvent(...)`, отправляется `dispatchEvent` |
| **доверенное событие** (trusted event) | событие от настоящего действия человека: `isTrusted === true`. У отправленных кодом — `false` |
| **`DOMContentLoaded`** | событие: HTML разобран, DOM построен. Картинки и прочее — ещё грузятся |
| **`load`** | событие: скачано всё — картинки, стили, фреймы. По умолчанию `page.goto` ждёт его |
| **наблюдатель за изменениями** (`MutationObserver`) | объект, который вызывает функцию, когда в выбранной части DOM что-то поменялось |

---

## Предыдущие уроки

- [Урок 13](../lesson-13/README.md) — прототипы, конструкторы, классы ·
  [примеры](../lesson-13/examples/) · [домашка](../lesson-13/homework/)
- [Урок 14](../lesson-14/README.md) — ООП на материале проекта ·
  [примеры](../lesson-14/examples/) · [домашка](../lesson-14/homework/)
- [Урок 15](../lesson-15/README.md) — регулярные выражения ·
  [примеры](../lesson-15/examples/) · [домашка](../lesson-15/homework/)
