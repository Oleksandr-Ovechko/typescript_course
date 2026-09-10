#!/usr/bin/env bash
# Урок 8 · Ветки, грязное дерево и detached HEAD
#
# Что здесь: переключение ветки переписывает файлы на диске · когда git
# переносит незакоммиченную правку, а когда отказывается · что такое
# detached HEAD и почему сделанный там коммит НЕ пропадает.
#
#   bash lessons/lesson-08/examples/03-branches-and-detached-head.sh

set -e
export GIT_PAGER=cat
SANDBOX=/tmp/wl-git-examples/l8-branches
rm -rf "$SANDBOX" && mkdir -p "$SANDBOX" && cd "$SANDBOX"

say() { printf '\n\033[1m── %s\033[0m\n' "$1"; }

git init -q -b main
git config user.name "Тестировщик" && git config user.email "qa@example.com"
printf 'widgets\nmonolith\n' > suites.txt
git add . && git commit -q -m "два сьюта"

say "switch вместо checkout"
cat <<'TEXT'
  Старый `checkout` делал три несвязанных дела: переключал ветки, доставал
  файлы из коммитов и отбрасывал правки. В git 2.23 его разделили:

    переключиться на ветку     git switch main        (было: git checkout main)
    создать и переключиться    git switch -c ИМЯ      (было: git checkout -b ИМЯ)
    отбросить правку в файле   git restore файл       (было: git checkout -- файл)

  Старую форму вы всё равно встретите в чужих инструкциях — она работает.
TEXT
git switch -q -c AUT-1566-C20992-store-search
echo "explorer" >> suites.txt
git commit -q -am "добавил explorer"
echo '-- ветка это по-прежнему один файл с сорока символами:'
cat .git/refs/heads/AUT-1566-C20992-store-search

say "Переключение переписывает файлы в папке"
git switch -q main
echo '-- на main:'; cat suites.txt
git switch -q AUT-1566-C20992-store-search
echo '-- на рабочей ветке:'; cat suites.txt
echo '   Это не две копии проекта на диске. Файл один, git приводит его'
echo '   к состоянию той ветки, куда вы перешли.'

say "Грязное дерево: не лотерея, а правило. Случай 1 — правку ПЕРЕНЕСЁТ"
git switch -q main
echo "черновик" > notes.txt && git add notes.txt
echo '-- переключаемся с незакоммиченным НОВЫМ файлом:'
git switch AUT-1566-C20992-store-search
git status --short
echo '   Файла notes.txt на этой ветке нет вообще — затирать нечего,'
echo '   поэтому git взял правку с собой. Строка A notes.txt печатается'
echo '   дважды: один раз самим switch, второй — git status.'

say "Случай 2 — ОТКАЖЕТСЯ"
git switch -q main
echo "ЛОКАЛЬНОЕ" > suites.txt
echo '-- теперь правка в файле, который на ветках разный:'
git switch AUT-1566-C20992-store-search || true
cat <<'TEXT'
  Правило целиком: git переносит незакоммиченную правку на другую ветку,
  если переключение её не затрёт, и отказывается, если затрёт. Потерять
  правку при переключении нельзя — либо перенесёт, либо остановится.
  Отсюда практическое: «в прошлый раз прокатило» ничего не доказывает.
TEXT
git restore suites.txt && rm -f notes.txt && git reset -q

say "detached HEAD — состояние, в которое попадают все"
git switch -q AUT-1566-C20992-store-search      # тут два коммита, есть куда отступить
git switch -q --detach HEAD~1
git status -sb | head -1
echo '   HEAD теперь содержит SHA вместо `ref: refs/heads/...` — отсюда название.'
echo '   Ничего не сломано: файлы на месте, история цела.'

say "Коммит, сделанный в detached HEAD, — валидный. Он просто недостижим"
echo "работа из detached" > detached.txt
git add . && git commit -q -m "коммит в detached HEAD"
LOST=$(git rev-parse --short HEAD)
git switch -q -
echo "-- вернулись на ветку; git log про коммит $LOST не знает:"
git log --oneline | head -2
echo "-- но reflog помнит:"
git reflog | head -2
echo "-- и коммит возвращается одной командой:"
git branch rescue "$LOST"
git log --oneline rescue | head -1
cat <<'TEXT'
  «Коммит в detached HEAD улетает в никуда» — неправда. Коммит нормальный,
  на него просто не ссылается ни одна ветка. Он лежит в репозитории и
  достаётся из reflog: недостижимые объекты живут по умолчанию 30 дней.
  Опасность не в том, что он пропадёт, а в том, что вы про него забудете.

  Выход из состояния: git switch -   (минус = предыдущая ветка, как в cd -)
TEXT
