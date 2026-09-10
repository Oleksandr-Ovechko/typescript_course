#!/usr/bin/env bash
# Урок 8 · Археология: кто и когда сломал тест
#
# Что здесь: git log -S и -G — чем отличаются и почему кавычки важны ·
# git blame · git show ветка:путь · git bisect run и как читать его вывод.
#
#   bash lessons/lesson-08/examples/05-archeology.sh
#
# Самый прикладной файл обоих git-уроков: всё это применяется, когда тест
# вчера был зелёным, а сегодня красный.

set -e
export GIT_PAGER=cat
SANDBOX=/tmp/wl-git-examples/l8-archeology
rm -rf "$SANDBOX" && mkdir -p "$SANDBOX" && cd "$SANDBOX"

say() { printf '\n\033[1m── %s\033[0m\n' "$1"; }

git init -q -b main
git config user.name "Тестировщик" && git config user.email "qa@example.com"
mkdir -p tests
printf 'await page.getByRole("button", { name: "Book" }).click();\n' > tests/C20992.spec.ts
git add . && git commit -q -m "тест: кнопка Book"
printf 'await page.getByRole("button", { name: "Book Now" }).click();\n' > tests/C20992.spec.ts
git commit -q -am "продукт переименовал кнопку"
echo 'const timeout = 15000;' >> tests/C20992.spec.ts
git commit -q -am "поднял таймаут"

say "git log -S — где изменилось ЧИСЛО вхождений строки"
echo '-- ищем "Book" вместе с кавычками:'
git log --oneline -S '"Book"' -- tests/
echo '-- ищем Book без кавычек:'
git log --oneline -S 'Book' -- tests/
cat <<'TEXT'
  Разница не косметическая. -S считает, сколько раз подстрока встречается
  в файле до и после коммита, и показывает только те коммиты, где это число
  изменилось.
    "Book"  →  "Book Now"   подстроки `"Book"` было одно вхождение, стало ноль
                            (кавычка закрывающая уехала) → коммит найден
    Book    →  Book Now     подстроки `Book` как было одно, так и осталось
                            → менять нечего, коммит В ВЫВОД НЕ ПОПАДЁТ

  Отсюда правило: ищите строку вместе с её границами, иначе самое интересное
  переименование пройдёт мимо.
TEXT

say "git log -G — поиск регуляркой по тексту дифа"
git log --oneline -G 'Book' -- tests/
cat <<'TEXT'
  Здесь два коммита из трёх. Третьего («поднял таймаут») нет, хотя строка
  "Book Now" в файле на нём есть: -G смотрит в ТЕКСТ ДИФА, а не в содержимое
  файла. Если диф не трогает строку — коммит не найдётся.

  Коротко: оба ищут в дифе. -S считает вхождения, -G матчит регуляркой.
TEXT

say "-- ПУТЬ: почему после команд стоит два дефиса"
cat <<'TEXT'
  Всё после `--` git считает путями, а не ветками. Это снимает
  двусмысленность, когда файл и ветка называются одинаково, и заодно
  ограничивает поиск нужной папкой:  git log -S 'Book' -- projects/monolith/
TEXT

say "git blame — кто написал вот эту строку"
git blame -- tests/C20992.spec.ts
cat <<'TEXT'
  Построчно: коммит, автор, дата ПОСЛЕДНЕЙ правки строки и номер строки.

  В VS Code то же самое без команды, две встроенные настройки (Ctrl+, → git blame):
    git.blame.editorDecoration.enabled   автор и дата серым в конце строки
    git.blame.statusBarItem.enabled      то же в строке состояния
  И панель Timeline в Explorer — вся история конкретного файла списком.
  (Команды `Toggle Line Blame` / `File History` — это расширение GitLens,
   у вас его может не быть.)
TEXT

say "git show ветка:путь — прочитать файл из другого коммита, не переключаясь"
git show HEAD~2:tests/C20992.spec.ts
echo '   Рабочее дерево не тронуто вообще. На уроке 9 на этой команде'
echo '   держится весь процесс открытия PR-ов.'

say "git bisect run — git сам находит сломавший коммит"
cat > run-test.sh <<'SCRIPT'
#!/usr/bin/env bash
grep -q 'Book Now' tests/C20992.spec.ts
SCRIPT
chmod +x run-test.sh && git add . && git commit -q -m "скрипт прогона"
GOOD=$(git rev-parse HEAD)                    # здесь тест ещё проходит
echo 'правка 1' > tests/base.ts && git add . && git commit -q -m "правка 1"
echo 'правка 2' >> tests/base.ts && git commit -q -am "правка 2"
printf 'await page.getByRole("button", { name: "Reserve" }).click();\n' > tests/C20992.spec.ts
git commit -q -am "кто-то поменял селектор — здесь тест сломался"
echo 'правка 4' >> tests/base.ts && git commit -q -am "правка 4"
echo 'правка 5' >> tests/base.ts && git commit -q -am "правка 5"
echo '-- шесть коммитов, глазами не видно, который сломал:'
git log --oneline | head -6
echo
echo '-- запускаем двоичный поиск (сначала плохой коммит, потом заведомо хороший):'
git bisect start HEAD "$GOOD"
git bisect run ./run-test.sh
git bisect reset
cat <<'TEXT'

  КАК ЧИТАТЬ ЭТОТ ВЫВОД — здесь ошибаются чаще всего.

  Строки `Bisecting: N revisions left to test after this` и следующая за ней
  `[sha] сообщение` — это НЕ ответ. Так git докладывает, на какой коммит
  он встал посередине диапазона, чтобы проверить его.

  Ответ ровно один и выглядит так:
      <sha> is the first bad commit
  Это ПЕРВЫЙ СЛОМАННЫЙ коммит, а не последний рабочий. Именно его автор
  и правка вам нужны.

  Как это работает: вы называете заведомо плохой коммит (обычно HEAD) и
  заведомо хороший, git встаёт посередине и спрашивает «здесь как?». Каждый
  ответ уполовинивает диапазон: тысяча коммитов — десять проверок.
  `bisect run <команда>` снимает и вопросы: git запускает команду сам и читает
  её код возврата — 0 «хороший», не ноль «плохой».

  ⚠️ `git bisect reset` в конце обязателен: посреди bisect вы всегда
  в detached HEAD.

  В wl-e2e это выглядит так:
      git bisect start HEAD HEAD~50
      git bisect run bash -c 'cd projects/monolith && yarn case C20992'
TEXT
