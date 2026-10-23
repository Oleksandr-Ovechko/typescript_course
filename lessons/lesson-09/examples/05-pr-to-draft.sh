#!/usr/bin/env bash
# Урок 9 · Как открывать PR на draft
#
# Что здесь: почему cherry-pick на draft не работает (на живом примере) ·
# как вместо изменения перенести СОДЕРЖИМОЕ файла · что именно увидит ревьюер ·
# и настоящие команды процесса из bugfix-batch.md.
#
#   bash lessons/lesson-09/examples/05-pr-to-draft.sh
#
# Это главный практический файл обоих git-уроков: всё предыдущее было ради него.

set -e
export GIT_PAGER=cat
SANDBOX=/tmp/wl-git-examples/l9-pr
rm -rf "$SANDBOX" && mkdir -p "$SANDBOX" && cd "$SANDBOX"

say() { printf '\n\033[1m── %s\033[0m\n' "$1"; }

say "Расстановка сил в wl-e2e"
cat <<'TEXT'
    test-generation                  рабочая (до 17.10 — autonomous-test-gen-experiment).
                                     Здесь чинятся и копятся тесты
    draft                            только цель для PR. Работать на ней нельзя
    AUT-{тикет}-C{кейс}-{описание}   ветка под один PR, режется ОТ origin/draft

  Насколько они разошлись — смотреть так (числа живые, меняются каждый день):

      git fetch origin draft
      git rev-list --left-right --count origin/draft...HEAD
      #  33   6208          ← замер 2026-09-10

  Читать по столбцам: левый — коммиты, которые есть только в draft, то есть
  насколько рабочая ветка ОТСТАЁТ. Правый — которые есть только у неё, то есть
  насколько ОПЕРЕЖАЕТ. Отставание в десятки, опережение в тысячи — и это
  не поломка, так устроен эксперимент. Из порядка величин следует всё
  остальное.

  Три точки: «то, что есть у одной и нет у другой, в обе стороны»;
  --count печатает количество вместо коммитов, --left-right раскладывает
  его на два числа.
TEXT

say "Заготовка: репозиторий, где draft и рабочая ветка разошлись"
git init -q -b draft big && cd big
git config user.name t && git config user.email t@e.com
mkdir -p tests && echo "общая база" > tests/base.ts
git add . && git commit -q -m "начало"
BASE=$(git rev-parse HEAD)
for i in $(seq 1 30); do echo "draft-правка $i" >> tests/base.ts; git commit -qam "draft: коммит $i"; done
git switch -q -c test-generation "$BASE"
for i in $(seq 1 20); do echo "exp-правка $i" >> tests/base.ts; git commit -qam "exp: коммит $i"; done
echo "починенный тест" > tests/C20992.spec.ts
echo "правка хелпера" >> tests/base.ts
git add . && git commit -q -m "AUT-1566: фикс поиска в Store"
echo '-- насколько разошлись (слева draft, справа рабочая):'
git rev-list --left-right --count draft...test-generation

say "Очевидный путь: перенести коммит через cherry-pick"
git switch -q draft
git cherry-pick test-generation 2>&1 | grep -E 'CONFLICT|could not apply' || true
git status --short | head -3
git cherry-pick --abort
cat <<'TEXT'
  Конфликт на пустом месте — и он тут неизбежен.

  cherry-pick переносит ИЗМЕНЕНИЕ, то есть диф. А диф считается относительно
  РОДИТЕЛЯ коммита — и этого родителя на draft не существует, там файл
  выглядит совсем иначе. При расхождении в тысячи коммитов конфликт получается
  сразу и на каждом файле.

  Поэтому в bugfix-batch.md это записано правилом 7: НИКОГДА не делать
  cherry-pick на draft. Не «нежелательно» — никогда.
TEXT

say "Как надо: worktree от draft + git show"
git worktree add -q -b AUT-1566-C20992-store-search ../pr-wt draft
cd ../pr-wt
git -C ../big show test-generation:tests/C20992.spec.ts > tests/C20992.spec.ts
git status --short
git add tests/C20992.spec.ts
git commit -q -m "AUT-1566: фикс поиска в Store (C20992)"
echo '-- что увидит ревьюер:'
git diff --stat draft...HEAD
echo '-- ветка стоит на свежем draft:'
git log --oneline | head -2
cat <<'TEXT'

  По шагам:

    git worktree add -b ИМЯ ПАПКА draft
        завёл новую ветку от draft и сразу в отдельной папке. Рабочая ветка
        в основной папке не тронута, переключаться не пришлось.

    git -C ../big show ВЕТКА:ПУТЬ > ПУТЬ
        достал СОДЕРЖИМОЕ файла из другой ветки и записал поверх. -C говорит
        «выполни git вон в той папке»: мы стоим в новом рабочем дереве,
        а читать надо из основного. Никакого копирования мышью — хотя мышью
        тоже можно, это обычные папки.

    git diff --stat draft...HEAD
        то, что увидит ревьюер: один файл, одна строка. ТРИ точки означают
        «от точки расхождения», то есть только наше, без тридцати чужих
        коммитов.

  Три точки против двух — единственный синтаксис, который стоит запомнить
  отдельно:
      draft..HEAD    коммиты, которых нет в draft
      draft...HEAD   для diff: изменения относительно точки расхождения
  В PR попадает второе.
TEXT

say "Настоящие команды процесса (wl-e2e, .claude/commands/bugfix-batch.md)"
cat <<'TEXT'
    git fetch origin draft

    git worktree add -b AUT-1566-C20992-store-search \
      /home/alex/work/wl-e2e-worktrees/AUT-1566-C20992 origin/draft
    cd /home/alex/work/wl-e2e-worktrees/AUT-1566-C20992
    T=projects/monolith/tests/regression-run/client-profile/account/passes-and-memberships

    git -C /home/alex/work/wl-e2e show \
      test-generation:$T/C20992.spec.ts \
      > $T/C20992.spec.ts
    git -C /home/alex/work/wl-e2e show \
      test-generation:$T/C20992.helpers.ts \
      > $T/C20992.helpers.ts

    yarn install
    cp /home/alex/work/wl-e2e/projects/monolith/config/.env.staging-exp3.secure \
       projects/monolith/config/.env.staging-exp3.secure

    yarn eslint $T/C20992.spec.ts $T/C20992.helpers.ts

    git add $T/C20992.spec.ts $T/C20992.helpers.ts
    git commit -m "AUT-1566: fix Store search for C20992"
    git push -u origin AUT-1566-C20992-store-search
    gh pr create --base draft --title "AUT-1566 C20992 ..." --body "..."

    git worktree remove /home/alex/work/wl-e2e-worktrees/AUT-1566-C20992

  Три места, где спотыкаются:

  • yarn install обязателен. Ветка от draft — другой yarn.lock, и node_modules
    в новой папке своя.
  • yarn eslint ДО коммита, а не после. Импорты на draft и на рабочей ветке
    разошлись: файл, который линтился на test-generation, на draft может не пройти.
    Это ловят здесь, а не в PR.
  • .env.*.secure копируется, а не переносится через git: эти файлы
    в .gitignore, в репозиторий креды не попадают никогда.

  И --base draft в `gh pr create` — без него PR уедет на ветку по умолчанию.
TEXT
