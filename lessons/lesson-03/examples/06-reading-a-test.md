# Урок 3 · Блок 4 — разбор `C154005.spec.ts` построчно

Файл лежит в `wl-e2e` на ветке `draft`:

```
projects/widgets/tests/regression-run/lead-capture-widget/C154005.spec.ts
```

Это тот самый файл, ради которого делался весь урок. Ниже — каждая конструкция
и ссылка на пример, где она разобрана отдельно.

> Запустить его через `node` не получится: он импортирует Playwright и требует
> браузера. Читаем глазами; запускается — `npx playwright test C154005`.

---

## Строки 1–20: импорты

```ts
import { test } from '@playwright/test';
import { loginAsStaffToWlUi } from '../../../helpers/widgets-wl-ui-helper';
import {
  cancelLeadCaptureWidgetSettings,
  changeLeadCaptureStylingColor,
  // …ещё одиннадцать имён
} from 'wl-e2e-automation-helpers/monolith/webstie-widgets/lead-capture-page';
import {
  createNewLeadCaptureSkinAndWaitForLoad,
  openSetupNewLeadCaptureWidgetSafely,
} from './C154005.helpers';
```

Четыре импорта — и все четыре разной формы. Это удобно: одного файла хватает,
чтобы увидеть все виды сразу.

| Строка после `from` | Что значит |
|---|---|
| `'@playwright/test'` | Голый путь → ищем в `node_modules`. `@playwright` — неймспейс в npm |
| `'../../../helpers/widgets-wl-ui-helper'` | Относительный путь → подняться на три папки вверх и зайти в `helpers/` |
| `'wl-e2e-automation-helpers/...'` | Тоже голый путь → тоже `node_modules`. Это наш собственный пакет монорепы |
| `'./C154005.helpers'` | Относительный путь → файл рядом, в этой же папке |

Граница проходит **не по собачке**, а по форме пути: начинается с точки — файл
рядом; не начинается — ищем в `node_modules`. Локальный пакет монорепы лежит
там же: Yarn положил в `node_modules` симлинк `wl-e2e-automation-helpers → ../helpers`,
это видно командой `ls -la node_modules | grep wl-e2e`.

Все импорты именованные — имена в фигурных скобках. Импорт по умолчанию
в тестах не встречается; он есть в 15 файлах на `draft`, и все они одного
сорта: `playwright.config.ts`, `globalSetup.ts`, `testrail-reporter.ts`.

Разобрано в [`modules/04-modules.ts`](modules/04-modules.ts).

---

## Строки 22–25: константы

```ts
const BUTTON_TEXT = 'test';
const FIELDS_TO_DISABLE = ['Cell phone', 'Gender'];
const BUTTON_COLOR = '#EB0EB6';
const BUTTON_COLOR_RGB = 'rgb(235, 14, 182)'; // hex #EB0EB6
```

Ничего нового: строка, массив строк, ещё две строки. Хекс-код — **обычная
строка**, никакого особого типа цвета в JavaScript нет; цветной квадратик рядом
рисует редактор, потому что узнаёт формат.

Две константы под один цвет нужны потому, что в настройки цвет вводится хексом,
а браузер потом отдаёт его же как `rgb(...)` — сравнивать приходится в том виде,
в каком его вернул DOM.

---

## Строка 27: `test.describe`

```ts
test.describe('[C154005][Lead Capture] [SBO] Verify Form Settings…', () => {
```

`test` — объект, импортированный из Playwright. У него берётся метод `describe`,
и ему передаются **два аргумента**: строка с названием и функция.

Вторая — колбэк. Мы её пишем, но не вызываем: вызовет Playwright, когда дойдёт
до этого набора тестов. Размер тела значения не имеет — важно лишь, что мы
передаём функцию, а не результат её вызова.

Разобрано в [`03-functions-as-values.ts`](03-functions-as-values.ts).

---

## Строка 28: `let`, а не `const`

```ts
let skinName: string;
```

Единственный `let` в файле, и он не случайный. Значение появляется в
`beforeEach` (строка 31), а нужно ещё и в `afterEach` (строка 39), и в самом
тесте (строка 71). Поэтому переменная объявлена **снаружи** всех трёх колбэков —
чтобы все три видели одно и то же имя.

`const` здесь не подошёл бы: в него нельзя записать значение позже.

> Три разные функции читают и пишут одну внешнюю переменную. Это уже почти
> замыкание — тема урока 4.

Обратите внимание, что тип написан вручную: `let skinName: string;`. Без
присвоения выводить компилятору не из чего.

---

## Строки 30–35: `beforeEach` и деструктуризация

```ts
test.beforeEach(async ({ page }, testInfo) => {
  skinName = `C154005_${testInfo.workerIndex}_${testInfo.retry}`;
  await loginAsStaffToWlUi(page);
  await openSetupNewLeadCaptureWidgetSafely(page);
  await createNewLeadCaptureSkinAndWaitForLoad(page, skinName);
});
```

**Самое плотное место файла.** Здесь сходится всё, что было на уроке.

### Сколько аргументов принимает этот колбэк?

**Два.** Фигурные скобки относятся только к первому.

```
async ({ page }, testInfo) => { … }
       ^^^^^^^^  ^^^^^^^^
       1-й параметр,      2-й параметр,
       разобранный        обычный
       деструктуризацией
```

Playwright передаёт первым аргументом объект со всеми фикстурами — `page`,
`browser`, `context` и другими. В фигурных скобках просят только нужные этому
тесту. Можно было бы принять объект целиком и писать `fixtures.page`, но так
никто не делает.

Разобрано в [`05-destructuring-spread.ts`](05-destructuring-spread.ts).

### `async` и `await`

`await` перед вызовом — «дождись, пока это закончится, и дай результат».
`async` перед функцией — «внутри есть `await`, значит и саму функцию надо ждать».
Почти всё в Playwright требует ожидания, отсюда `await` почти в каждой строке.

Подробно — на уроке 4.

### Шаблонный литерал и `testInfo`

```ts
skinName = `C154005_${testInfo.workerIndex}_${testInfo.retry}`;
```

`testInfo` — объект самого Playwright, мы его не создаём, только читаем.
Имя скина должно быть уникальным: если один и тот же тест идёт в нескольких
воркерах или перезапускается после падения, одинаковое имя приведёт к
конфликту. Отсюда два хвоста:

- `workerIndex` — номер параллельного процесса, считается **с нуля**;
- `retry` — номер попытки, 0 для первого запуска.

Про воркеры: по умолчанию Playwright берёт **половину логических ядер**
процессора, а не один поток. В `wl-e2e` число задано явно — в обоих
`playwright.config.ts` стоит `workers: 8` и `retries: 1`. Своими руками тесты
по воркерам не раскладывают: Playwright сам делит очередь примерно поровну.

Уникальность можно было бы получить и через `Math.random()` — тогда `testInfo`
не понадобился бы вовсе. Через `workerIndex` понятнее при разборе упавшего
прогона: по имени видно, где тест бежал.

---

## Строки 37–40: `afterEach`

```ts
test.afterEach(async ({ page }) => {
  await openSetupNewLeadCaptureWidgetSafely(page);
  await deleteLeadCaptureSkinsByName(page, skinName);
});
```

Здесь у колбэка **один** параметр: `testInfo` не нужен. Убирается за собой тот
самый скин, имя которого записали в `beforeEach`, — ради этого `skinName` и
живёт снаружи.

---

## Строки 42–72: сам тест

```ts
test('Form Settings and Styling changes are reflected…', async ({ page }) => {
  await clickLeadCaptureEditSettingsPencilButton(page);
  await expandLeadCaptureFormSettings(page);
  await fillLeadCaptureButtonText(page, BUTTON_TEXT);
  await setLeadCaptureFormFieldState(page, FIELDS_TO_DISABLE, 'OFF');
  …
});
```

Дальше новых конструкций нет: строка с названием, колбэк, внутри — вызовы
хелперов с `await`. Всё, что нужно, чтобы это читать, уже разобрано.

Единственное, на что стоит посмотреть, — `'OFF'` в строке 49. Это не просто
строка. Вот сигнатура хелпера, `helpers/monolith/webstie-widgets/lead-capture-page.ts:114`:

```ts
export async function setLeadCaptureFormFieldState(
  page: Page, fieldNames: string[], state: 'ON' | 'OFF',
): Promise<void> {
  const oppositeState = state === 'ON' ? 'OFF' : 'ON';
```

У третьего параметра литеральный тип — union из урока 2, встреченный в бою:
`'off'` в нижнем регистре компилятор не пропустит. Строкой ниже — тернарный
оператор оттуда же.

---

## Чего в файле нет

Спред не встречается ни разу. Стоит помнить, что он умеет не только копировать
объекты, но и раскладывать массив в аргументы:

```ts
console.log(...FIELDS_TO_DISABLE);   // то же, что console.log('Cell phone', 'Gender')
```

Разбор хелперов, на которые ссылается этот файл, — на следующем занятии:
внутри них конструкции заковыристее, чем в самом тесте.
