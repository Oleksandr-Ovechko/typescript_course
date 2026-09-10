#!/usr/bin/env bash
# Урок 8 · .gitignore и уборка мусора
#
# Что здесь: что не должно попадать в репозиторий · классическая ловушка
# «добавил в .gitignore, а файл всё равно виден» · git clean и почему после
# прогона Playwright папка test-results не исчезает.
#
#   bash lessons/lesson-08/examples/04-gitignore-and-clean.sh

set -e
export GIT_PAGER=cat
SANDBOX=/tmp/wl-git-examples/l8-ignore
rm -rf "$SANDBOX" && mkdir -p "$SANDBOX" && cd "$SANDBOX"

say() { printf '\n\033[1m── %s\033[0m\n' "$1"; }

git init -q -b main
git config user.name "Тестировщик" && git config user.email "qa@example.com"
echo "widgets" > suites.txt && git add . && git commit -q -m "первый коммит"

say "Мусор после прогона"
mkdir -p test-results && echo "мусор" > test-results/trace.zip
echo "screenshot" > shot.png
git status --short

say "Заводим .gitignore"
printf 'test-results/\n*.png\n' > .gitignore
git status --short
echo '   Из трёх записей осталась одна — сам .gitignore, и его как раз'
echo '   коммитить нужно: он общий для всех.'
git add .gitignore && git commit -q -m "добавил .gitignore"

say "Настоящий .gitignore из wl-e2e — те же строки, не выдуманные"
cat <<'TEXT'
    node_modules/
    test-results/
    playwright-report/
    **/tests/**/*.png
    **/config/.env.*.secure
    **/config/.env.*.secure.*

  Последние две строки — самые важные: в репозиторий не попадают креды.
  `.env.*.secure` содержат логины и пароли тестовых бизнесов, а вторая строка
  ловит любые копии рядом (.draft, .bak-*): те же креды, то же правило.
  Из этого, кстати, следует всё поведение worktree из урока 9: то, чего нет
  в репозитории, в новую рабочую папку не приедет.
TEXT

say "Ловушка: на уже отслеживаемый файл .gitignore не действует"
echo "tracked.png" > tracked.png
git add -f tracked.png                 # -f = force, «добавить вопреки ignore»
git commit -q -m "файл добавлен принудительно"
echo "правка" >> tracked.png
git status --short
cat <<'TEXT'
  Файл в .gitignore, а git его показывает. Ошибки здесь нет:
  .gitignore решает ровно одно — БРАТЬ ЛИ ФАЙЛ ПОД НАБЛЮДЕНИЕ. Файл, который
  уже отслеживается, продолжает отслеживаться, что бы в ignore ни написали.

  Как файл вообще туда попал: кто-то (или Claude) добавил его через `git add -f`
  либо добавил ещё до появления правила в .gitignore.
TEXT
echo '-- лечится явно:'
git rm --cached -q tracked.png         # убрать из ИНДЕКСА, файл на диске оставить
git commit -q -m "перестал отслеживать tracked.png"
git status --short
echo '   (пусто — файл на диске остался, но git его больше не трогает)'

say "git clean — вымести неотслеживаемое"
echo '-- git clean -nd  (n = dry run, только показать; d = заходить в папки):'
git clean -nd
echo '   (пусто — то, что в .gitignore, git clean не трогает. Именно поэтому'
echo '    test-results после прогона Playwright никуда не девается)'
echo '-- git clean -ndx (x = не щадить и то, что в .gitignore):'
git clean -ndx
cat <<'TEXT'
  Флаги: -n показать · -d заходить в неотслеживаемые папки · -x включая
  игнорируемое · -f собственно удалить (без -f git откажется).

  ⚠️ Всегда сначала -n. `git clean -fdx` в рабочем проекте снесёт
  node_modules/ и файлы .env.*.secure, которых нет в репозитории, —
  восстанавливать придётся руками.
TEXT
