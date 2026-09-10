#!/usr/bin/env bash
# Урок 8 · Три дерева и что лежит внутри .git
#
# Что здесь: рабочее дерево → индекс → коммит · почему `git diff` бывает пустым,
# когда изменения есть · ветка, HEAD и коммит как три обычных файла.
#
#   bash lessons/lesson-08/examples/01-three-trees.sh
#
# Скрипт делает свою песочницу в /tmp и ничего не трогает снаружи.
# Читать вместе с конспектом: ../README.md

set -e
export GIT_PAGER=cat
SANDBOX=/tmp/wl-git-examples/l8-three-trees
rm -rf "$SANDBOX" && mkdir -p "$SANDBOX" && cd "$SANDBOX"

say() { printf '\n\033[1m── %s\033[0m\n' "$1"; }

say "Заводим репозиторий"
git init -q -b main
git config user.name "Тестировщик" && git config user.email "qa@example.com"
echo "widgets" > suites.txt
git status --short
echo '   ?? — git про этот файл ещё не знает. В VS Code это буква U (untracked).'

say "git add кладёт файл в ИНДЕКС — не «помечает», а снимает копию сейчас"
git add suites.txt
git status --short
echo '   A — файл в индексе. Коммит возьмёт то, что в индексе, а не то, что в папке.'

say "git commit превращает индекс в коммит"
git commit -q -m "первый коммит: список сьютов"
git log --oneline

say "Два diff, и это не опечатка"
echo "monolith" >> suites.txt
echo '-- git diff  (рабочее дерево против индекса) — «что я ещё не добавил»:'
git diff --stat
git add suites.txt
echo '-- git diff  ПОСЛЕ add — пусто, и это главное:'
git diff --stat
echo '   (пусто — правка никуда не делась, она переехала слоем ниже)'
echo '-- git diff --cached (индекс против последнего коммита) — «что уйдёт в коммит»:'
git diff --cached --stat
git commit -q -m "добавил monolith"

say "Снимаем магию: всё это — обычные файлы"
echo '-- .git/refs/heads/main — ветка это сорок символов и больше ничего:'
cat .git/refs/heads/main
echo '-- .git/HEAD — указатель на ветку:'
cat .git/HEAD
echo '-- сам коммит как текст:'
git cat-file -p HEAD

say "Что из этого следует"
cat <<'TEXT'
  • Ветка не хранит код и не хранит «свои» коммиты — только один SHA.
    Поэтому пятьсот веток в репозитории не весят ничего.
  • HEAD — строка `ref: refs/heads/main`. Отсюда HEAD~1: «на один коммит
    назад от того, куда смотрит HEAD».
  • Коммит — текст: tree (снимок файлов), parent (предыдущий коммит), автор,
    сообщение. Первый коммит в репозитории — единственный без parent.
    Именно ссылки parent и склеивают историю в цепочку.
  • Пустой `git diff` не значит «изменений нет». Он значит «всё добавлено
    в индекс». Смотреть надо `git diff --cached`.
TEXT
echo
echo "Песочница осталась в $SANDBOX — можно зайти и поковырять руками."
