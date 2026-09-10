#!/usr/bin/env bash
# Урок 8 · Как читать дифф
#
# Что здесь: из чего состоит вывод `git diff` · что значат числа в --stat ·
# почему правка одной строки показывается как удаление плюс добавление ·
# откуда берётся строчка `\ No newline at end of file`.
#
#   bash lessons/lesson-08/examples/02-reading-a-diff.sh
#
# Этой темы не было на занятии, а вопросов по ней было больше всего.

set -e
export GIT_PAGER=cat
SANDBOX=/tmp/wl-git-examples/l8-diff
rm -rf "$SANDBOX" && mkdir -p "$SANDBOX" && cd "$SANDBOX"

say() { printf '\n\033[1m── %s\033[0m\n' "$1"; }

git init -q -b main
git config user.name "Тестировщик" && git config user.email "qa@example.com"
printf 'widgets\nmonolith\nexplorer\n' > suites.txt
git add . && git commit -q -m "три сьюта"

say "1. Добавили строку в конец"
echo "schedule" >> suites.txt
git diff
cat <<'TEXT'
  Разбор по строкам вывода:
    diff --git a/suites.txt b/suites.txt   a/ — «было», b/ — «стало»
    index <было>..<стало> 100644          SHA содержимого до и после, права файла
    --- a/suites.txt / +++ b/suites.txt   какой файл слева, какой справа
    @@ -1,3 +1,4 @@                       кусок (hunk): в старом файле строки
                                          с 1-й, всего 3; в новом с 1-й, всего 4
    строки без знака                      контекст — не менялись, показаны,
                                          чтобы было видно, куда попала правка
    +schedule                             добавлено (в VS Code — зелёным)
TEXT

say "2. Те же изменения в виде сводки"
git diff --stat
cat <<'TEXT'
  suites.txt | 1 +      слева файл, потом сколько строк затронуто, потом
                        столбик из + и -: их поровну столько, сколько
                        добавлено и удалено (при больших правках — пропорция)
  1 file changed, 1 insertion(+)
TEXT

say "3. Поправили существующую строку — и получили ДВА изменения"
git checkout -q suites.txt
sed -i '2s/.*/monolith-v2/' suites.txt
git diff --stat
git diff
cat <<'TEXT'
  1 insertion(+), 1 deletion(-) — хотя правка одна.
  У git нет понятия «изменённая строка»: любая правка внутри строки — это
  удаление старой строки и добавление новой. Отсюда и `-monolith` рядом
  с `+monolith-v2`, и «два изменения» в счётчике.
TEXT

say "4. Строчка \\ No newline at end of file"
git checkout -q suites.txt
printf 'widgets' > suites.txt          # без перевода строки в конце
git add . && git commit -q -m "файл без финального перевода строки"
echo "monolith" >> suites.txt
git diff
cat <<'TEXT'
  Файл кончался без перевода строки, поэтому дописанное приклеилось к первой
  строке: было `widgets`, стало `widgetsmonolith`. Git честно предупреждает
  маркером `\ No newline at end of file` — он относится к строке НАД ним.
  Если в дифе вместо ожидаемого добавления видно склейку — смотрите на этот
  маркер, а не на редактор.
TEXT

say "5. Полезное, когда правка внутри длинной строки"
git checkout -q suites.txt
printf 'await page.getByRole("button", { name: "Book" }).click();\n' > spec.ts
git add . && git commit -q -m "спек"
printf 'await page.getByRole("button", { name: "Book Now" }).click();\n' > spec.ts
echo '-- обычный дифф: две почти одинаковые строки, глазами не сравнить:'
git diff -- spec.ts
echo '-- git diff --word-diff: видно ровно то, что поменялось:'
git diff --word-diff -- spec.ts

say "Что запомнить"
cat <<'TEXT'
  • `-` это «было», `+` это «стало». Строки без знака — контекст.
  • Правка внутри строки всегда считается как -1/+1.
  • `--stat` — когда правок много и нужен масштаб; без него — когда нужно
    содержание; `--word-diff` — когда правка внутри длинной строки.
  • В VS Code то же самое рисуется цветом: полоска слева от номеров строк,
    клик по ней показывает, что было.
TEXT
