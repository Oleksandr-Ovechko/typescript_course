#!/usr/bin/env bash
# Урок 9 · Свой «сервер» за одну команду
#
# Что здесь: bare-репозиторий — то, чем на самом деле является GitHub ·
# что такое origin и зачем -u при первом push · и главное: где физически
# лежит origin/main.
#
#   bash lessons/lesson-09/examples/01-own-server.sh

set -e
export GIT_PAGER=cat
SANDBOX=/tmp/wl-git-examples/l9-server
rm -rf "$SANDBOX" && mkdir -p "$SANDBOX/sandbox" && cd "$SANDBOX/sandbox"

say() { printf '\n\033[1m── %s\033[0m\n' "$1"; }

git init -q -b main
git config user.name "Тестировщик" && git config user.email "qa@example.com"
git config pull.rebase false
echo "widgets"  > suites.txt && git add . && git commit -q -m "первый коммит"
echo "monolith" >> suites.txt && git commit -q -am "добавил monolith"
git switch -q -c AUT-1566-C20992-store-search
echo "explorer" >> suites.txt && git commit -q -am "добавил explorer"
git switch -q main

say "Сервер — это репозиторий без рабочей папки"
git init -q --bare -b main ../server.git
echo '-- что лежит внутри «сервера»:'
ls ../server.git
cat <<'TEXT'
  Ни одного файла проекта — только служебные папки, то есть содержимое
  обычного .git. Так устроен любой сервер, включая GitHub: там нет папки
  с файлами, которую кто-то редактирует.
TEXT

say "origin — это просто имя для адреса"
git remote add origin ../server.git
git remote -v
cat <<'TEXT'
  Не команда и не ключевое слово: так по традиции называют основной удалённый
  репозиторий, можно было назвать server. Адрес печатается дважды, потому что
  fetch и push можно развести на разные адреса.
TEXT

say "Первый push и зачем -u"
git push -q -u origin main
git push -q -u origin AUT-1566-C20992-store-search
git branch -vv
cat <<'TEXT'
  В квадратных скобках — привязка к удалённой ветке, её и добавляет -u
  (полное имя --set-upstream). Два v нужны именно ради неё: с одним git
  привязку не покажет.

  Точная формулировка, которую стоит запомнить:
    git push origin ВЕТКА       пройдёт и БЕЗ -u — ветка на сервере создастся
    git push                    без привязки упадёт:
                                fatal: The current branch X has no upstream branch

  То есть -u нужен не для того, чтобы push случился, а для того, чтобы
  дальше хватало голого `git push`.
TEXT

say "Где физически лежит origin/main"
echo '-- .git/refs/heads/main            — куда смотрит НАША ветка:'
cat .git/refs/heads/main
echo '-- .git/refs/remotes/origin/main   — наша ЗАПИСЬ о сервере:'
cat .git/refs/remotes/origin/main
cat <<'TEXT'
  Оба — файлы у вас на диске, и сейчас они совпадают, потому что мы только
  что запушили.

  origin/main НЕ находится на сервере и НЕ спрашивает сервер. Это ваша запись
  о том, где ветка сервера была в момент последнего fetch. Она устаревает
  молча: коллега может запушить пять раз, а ваш origin/main будет показывать
  прошлое, пока вы не сделаете fetch.

  Это самое частое непонимание во всём git, и снимается оно вот этими двумя
  строчками cat.
TEXT
