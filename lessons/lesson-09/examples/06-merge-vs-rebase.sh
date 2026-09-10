#!/usr/bin/env bash
# Урок 9 · merge против rebase
#
# Что здесь: один и тот же результат в файлах и две разные истории ·
# почему после rebase у ваших коммитов другие SHA · почему в wl-e2e merge ·
# и что на самом деле означает строчка «Merge made by the 'ort' strategy».
#
#   bash lessons/lesson-09/examples/06-merge-vs-rebase.sh

set -e
export GIT_PAGER=cat
SANDBOX=/tmp/wl-git-examples/l9-rebase
rm -rf "$SANDBOX" && mkdir -p "$SANDBOX" && cd "$SANDBOX"

say() { printf '\n\033[1m── %s\033[0m\n' "$1"; }

say "Заготовка: общий предок, наш коммит, чужой коммит"
git init -q -b main .
git config user.name t && git config user.email t@e.com
echo a > f.txt && git add . && git commit -q -m "общий предок"
git switch -q -c feature && echo feat >> f.txt && git commit -q -am "наш коммит"
git switch -q main && echo main2 > other.txt && git add . && git commit -q -m "чужой коммит"
git log --oneline --graph --all --decorate

say "Способ 1: merge"
git switch -q -c feature-merge feature
git merge --no-edit main | head -1
git log --oneline --graph | head -5
cat <<'TEXT'
  merge СОХРАНЯЕТ обе ветки и добавляет коммит слияния с двумя родителями.
  Видно по графу: линии расходятся и сходятся обратно.

  ⚠️ Строчка «Merge made by the 'ort' strategy» — про алгоритм, а не про то,
  почему всё прошло гладко. `ort` — это акроним «Ostensibly Recursive's Twin»
  (см. man git-merge), стратегия по умолчанию с git 2.34, написанная взамен
  старой recursive. Не «ортогональная».

  Гладко здесь прошло по другой причине: коммиты трогали РАЗНЫЕ файлы,
  сливать было нечего.
TEXT

say "Способ 2: rebase"
git switch -q -c feature-rebase feature
git rebase main | tail -1
git log --oneline --graph | head -4
cat <<'TEXT'
  rebase ПЕРЕНОСИТ ваши коммиты так, будто вы начали работу от свежего main.
  История линейная, ветвления не осталось вовсе.
TEXT

say "Главное отличие — в SHA"
echo "  на feature (как было):        $(git rev-parse --short feature)"
echo "  на feature-rebase (как стало): $(git rev-parse --short feature-rebase)"
cat <<'TEXT'
  Содержимое коммита то же, SHA другой — значит это ДРУГОЙ коммит. rebase
  не двигает коммиты, он создаёт новые вместо них.

  (`git rev-parse --short` принимает одну ссылку за раз: две вместе дадут
   fatal: Needed a single revision.)

  Отсюда единственное правило, которое надо запомнить: НЕ делать rebase
  веток, которые уже на сервере и которые кто-то мог забрать. У них останется
  старая версия ваших коммитов, и дальше разойдётся всё.
TEXT

say "И ещё одно важное различие — чего merge НЕ делает"
cat <<'TEXT'
  merge не переносит чужие коммиты к вам «сверху». Он берёт две истории
  и делает ОДИН коммит слияния с двумя родителями; чужие коммиты остаются
  на своих местах, со своими SHA и своими родителями.

  «Класть коммиты сверху» — это как раз rebase и cherry-pick, то есть ровно
  то, чему merge противопоставляется.

  Почему в wl-e2e merge: PR-ветка живёт часы и режется от свежего draft —
  переписывать там нечего. А рабочую ветку с тысячами коммитов, которую
  забирают все, ребейзить нельзя тем более.
TEXT
