#!/usr/bin/env bash
# Урок 9 · Отклонённый push и fetch против pull
#
# Что здесь: почему git отказывается принимать push — и почему это НЕ конфликт ·
# что делает fetch и чего он НЕ делает · как за одну строку понять, кто
# на сколько отстал · чем опасен --force.
#
#   bash lessons/lesson-09/examples/02-rejected-push-and-fetch.sh

set -e
export GIT_PAGER=cat
SANDBOX=/tmp/wl-git-examples/l9-fetch
rm -rf "$SANDBOX" && mkdir -p "$SANDBOX/sandbox" && cd "$SANDBOX/sandbox"

say() { printf '\n\033[1m── %s\033[0m\n' "$1"; }

# заготовка: репозиторий, сервер, один push
git init -q -b main
git config user.name "Тестировщик" && git config user.email "qa@example.com"
git config pull.rebase false
printf 'widgets\nmonolith\n' > suites.txt && git add . && git commit -q -m "два сьюта"
git init -q --bare -b main ../server.git
git remote add origin ../server.git
git push -q -u origin main

say "Коллега клонирует тот же сервер и пушит свою правку"
cd .. && git clone -q server.git colleague && cd colleague
git config user.name "Коллега" && git config user.email "peer@example.com"
echo "schedule" >> suites.txt
git commit -q -am "коллега добавил schedule"
git push -q origin main
echo '   git clone сам записал origin и привязал ветку — -u тут не нужен.'
cd ../sandbox

say "Наш push отклонён"
echo "appointments" >> suites.txt
git commit -q -am "мы добавили appointments"
git push origin main 2>&1 | grep -E 'rejected|failed to push|hint: Updates' | head -3 || true
cat <<'TEXT'
  Git отказался. НЕ потому, что конфликт: до содержимого файла он даже
  не дошёл. Причина другая — на сервере есть коммит, которого нет у нас,
  и принять наш push означало бы затереть чужую работу.

      Отклонённый push ≠ конфликт.
      Отклонённый push = «ты отстал».
      Конфликт может быть следующим шагом, а может и не быть.

  `(fetch first)` — это инструкция: сначала забери.
TEXT

say "Команда, которой затирают чужую работу"
cat <<'TEXT'
    git push --force              «мне всё равно, что там на сервере» —
                                  чужие коммиты просто исчезают
    git push --force-with-lease   мягче: откажется, если на сервере появилось
                                  то, чего вы ещё не видели

  В wl-e2e --force запрещён ПРАВИЛОМ (bugfix-batch.md, п. 8), а не техникой:
  защиты ветки и хука pre-push в репозитории нет. Git вас не остановит —
  остановиться нужно самому.
TEXT

say "fetch забирает чужое, но не трогает ваши файлы"
echo "-- последняя строка файла ДО fetch:  $(tail -1 suites.txt)"
git fetch -q origin
echo "-- последняя строка файла ПОСЛЕ fetch: $(tail -1 suites.txt)"
echo '-- а вот запись о сервере обновилась:'
echo "   .git/refs/heads/main:          $(cat .git/refs/heads/main)"
echo "   .git/refs/remotes/origin/main: $(cat .git/refs/remotes/origin/main)"
echo '-- и это видно одной строкой:'
git status -sb | head -1
cat <<'TEXT'
  ahead 1, behind 1: у нас есть один коммит, которого нет на сервере,
  и на сервере есть один, которого нет у нас. Именно это git и называл
  «fetch first».

      fetch  безопасен всегда — он только скачивает
      pull   = fetch + merge, и упасть может именно вторая половина

  Практический совет: привыкать к `git fetch` → посмотреть `git status -sb` →
  `git merge`, вместо `git pull` вслепую.
TEXT

say "То же самое картинкой"
git log --oneline --graph --all --decorate | head -6
cat <<'TEXT'
  --graph рисует линии, --all показывает все ветки (включая origin/*),
  --decorate подписывает, какие имена на каких коммитах.
  Видно, что от общего коммита «два сьюта» история разошлась на две стороны.
TEXT
