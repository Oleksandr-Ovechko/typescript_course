#!/usr/bin/env bash
# Урок 9 · git worktree — вторая папка на том же репозитории
#
# Что здесь: две папки и один .git · почему одну ветку нельзя открыть дважды ·
# что в новую папку НЕ приедет и почему · как убрать за собой.
#
#   bash lessons/lesson-09/examples/04-worktree.sh

set -e
export GIT_PAGER=cat
SANDBOX=/tmp/wl-git-examples/l9-worktree
rm -rf "$SANDBOX" && mkdir -p "$SANDBOX/sandbox" && cd "$SANDBOX/sandbox"

say() { printf '\n\033[1m── %s\033[0m\n' "$1"; }

git init -q -b main
git config user.name "Тестировщик" && git config user.email "qa@example.com"
printf 'widgets\nmonolith\n' > suites.txt
printf 'node_modules/\n*.secure\n' > .gitignore
git add . && git commit -q -m "два сьюта"
git switch -q -c AUT-1566-C20992-store-search
echo "explorer" >> suites.txt && git commit -q -am "добавил explorer"
git switch -q main

say "Заводим вторую рабочую папку"
git worktree add -q ../review AUT-1566-C20992-store-search
git worktree list
echo '-- в основной папке (ветка main):'; cat suites.txt
echo '-- во второй папке (другая ветка):'; cat ../review/suites.txt
cat <<'TEXT'
  Две папки, ОДИН репозиторий, разные ветки одновременно. Ничего не надо
  стэшить, открытые вкладки в VS Code не меняются, ветка в основной папке
  не трогается.

  Это ответ на «как поработать на другой ветке, не бросая свою работу»:
  не переключаться, а завести вторую папку.
TEXT

say "Внутри второй папки .git — не папка, а файл-ссылка"
ls -a ../review | head -5
echo '-- содержимое ../review/.git:'
cat ../review/.git
echo '   Поэтому worktree — не отдельный репозиторий и не копия истории.'
echo '   История общая: коммит, сделанный здесь, виден и там.'

say "Одну ветку нельзя открыть в двух деревьях сразу"
git worktree add ../review2 main 2>&1 | tail -1 || true
echo '   Логично: иначе два места правили бы одну ветку и переписывали'
echo '   друг друга. Заводите новую ветку — `git worktree add -b ИМЯ ПАПКА ОТКУДА`.'

say "Что в новую папку НЕ приедет"
echo "секрет" > .env.staging.secure
mkdir -p node_modules && echo "пакет" > node_modules/lib.js
echo '-- в основной папке эти файлы есть:'
ls -a | grep -E 'secure|node_modules'
echo '-- а во второй их нет:'
ls -a ../review | grep -E 'secure|node_modules' || echo '   (ничего)'
cat <<'TEXT'
  Правило простое: worktree выкладывает то, что ЛЕЖИТ В РЕПОЗИТОРИИ. Всё,
  что в .gitignore, туда не попадает по определению — его нет в истории.

  В wl-e2e это означает конкретное:
    • нет node_modules      → нужен `yarn install` в новой папке,
                              и yarn.lock на draft может быть другой
    • нет .env.*.secure     → их копируют руками: `cp` из основной папки
    • нет собранных образов → первый прогон дольше обычного

  Поэтому прогнать тест в worktree перед PR стоит: там всплывёт и забытый
  общий хелпер, на который ссылается ваш тест.
TEXT

say "Убрать за собой"
git worktree remove ../review
git worktree list
cat <<'TEXT'
  Ветка при этом остаётся, удаляется только папка. Убирать нужно: рабочие
  деревья копятся, и через месяц их пять штук по гигабайту.

  Открыть worktree в отдельном окне редактора:  code -n ПАПКА
  В VS Code такая папка выглядит как обычный репозиторий со своей панелью
  Source Control — коммитить и пушить из неё можно мышью.
TEXT
