#!/usr/bin/env bash
# Урок 8 · Откаты: amend, add -p, stash, restore, reset, revert
#
# Что здесь: как поправить последний коммит · как закоммитить ЧАСТЬ правок
# и почему `s` иногда не предлагается · как спрятать незаконченное ·
# три режима reset на одной картинке · чем revert отличается от reset.
#
#   bash lessons/lesson-08/examples/06-undo.sh

set -e
export GIT_PAGER=cat
SANDBOX=/tmp/wl-git-examples/l8-undo
rm -rf "$SANDBOX" && mkdir -p "$SANDBOX" && cd "$SANDBOX"

say() { printf '\n\033[1m── %s\033[0m\n' "$1"; }

git init -q -b main
git config user.name "Тестировщик" && git config user.email "qa@example.com"
printf 'widgets\nmonolith\n' > suites.txt
git add . && git commit -q -m "два сьюта"

say "amend — поправить последний коммит"
echo "строка" >> suites.txt && git commit -q -am "апечатка в сообщении"
echo "-- SHA до:   $(git rev-parse --short HEAD)"
git commit -q --amend -m "опечатка исправлена"
echo "-- SHA после: $(git rev-parse --short HEAD)"
cat <<'TEXT'
  SHA изменился — значит это ДРУГОЙ коммит. amend не правит коммит, он
  делает новый вместо него, а старый бросает. Отсюда то же правило, что
  у reset: amend только для коммита, который ещё не ушёл на сервер.

    git commit --amend            откроет редактор, чтобы поправить сообщение
    git commit --amend --no-edit  доложить забытый файл, сообщение не трогая
TEXT

say "add -p — закоммитить только часть правок"
seq -f 'строка %g' 1 20 > parts.txt
git add parts.txt && git commit -q -m "база для add -p"
sed -i '1s/.*/НУЖНАЯ ПРАВКА/;20s/.*/console.log("отладка")/' parts.txt
echo "-- сколько кусков (hunks) в дифе: $(git diff | grep -c '^@@')"
printf 'y\nn\n' | git add -p parts.txt >/dev/null
echo '-- что уйдёт в коммит (индекс) — только первый кусок:'
git diff --cached | grep '^[+-][^+-]'
echo '-- что осталось в рабочем дереве — второй кусок, с отладкой:'
git diff | grep '^[+-][^+-]'
cat <<'TEXT'
  Ответы: y взять кусок · n пропустить · s разбить на более мелкие ·
  q выйти · ? список всех вариантов.

  ⚠️ Почему `s` иногда не предлагается. Git склеивает правки в ОДИН кусок,
  если между ними меньше семи неизменённых строк (по три строки контекста
  с каждой стороны плюс касание). Замеры на файле из двадцати строк:

     правки в строках 1 и 7  (5 строк между) → 1 кусок
     правки в строках 1 и 8  (6 строк между) → 1 кусок
     правки в строках 1 и 9  (7 строк между) → 2 куска
     две СОСЕДНИЕ строки                     → 1 кусок, и `s` даже нет
                                               в списке: делить не по чему

  Здесь правки в первой и двадцатой строке — поэтому кусков два и всё
  получилось. В VS Code то же самое мышью: выделить строки в дифе →
  правый клик → Stage Selected Ranges.

  Зачем: отладочный console.log в PR — шум для ревьюера (линтер wl-e2e его
  не ловит). add -p — способ не тащить отладку в PR, не удаляя её из файла.
TEXT
git reset -q && git restore parts.txt

say "stash — спрятать незаконченное"
echo "недоделанное" >> suites.txt
git stash push -q -m "черновик правки"
echo '-- после stash дерево чистое:'
git status --short
echo '   (пусто)'
git stash list
git stash pop -q
echo '-- pop вернул правку и убрал её из списка:'
git status --short
cat <<'TEXT'
    git stash push -m "текст"   спрятать, дерево становится чистым
    git stash list              что лежит в стопке, верхнее — stash@{0}
    git stash pop               вернуть верхнее и убрать из списка
    git stash apply             вернуть, но ОСТАВИТЬ в списке
    git stash push -u           захватить и новые (неотслеживаемые) файлы

  ⚠️ Без -u новые файлы останутся в папке и при переключении переедут на
  другую ветку вместе с вами — их легко закоммитить не туда. Git откажется
  переключаться, только если там есть отслеживаемый файл с тем же именем.
  В VS Code: Ctrl+Shift+P → Git: Stash / Pop Latest Stash /
  Stash (Include Untracked).
TEXT

say "restore — выбросить правку совсем"
git restore suites.txt
echo '   Файл вернулся к состоянию ИНДЕКСА: то, что уже добавлено через add,'
echo '   restore не трогает (для этого git restore --staged). Правка, которой'
echo '   в индексе не было, стёрта: она нигде не сохранялась, и вернуть её'
echo '   нельзя ничем — ни reflog, ни чем-то ещё. Так же необратимы'
echo '   reset --hard (ниже) и git clean -f.'

say "reset: три режима"
echo "лишнее" >> suites.txt && git commit -q -am "случайный коммит"
echo '-- --soft HEAD~1  (коммит снят, правка осталась в ИНДЕКСЕ):'
git reset -q --soft HEAD~1 && git status --short
echo '-- reset HEAD     (по умолчанию --mixed: индекс очищен, правка в ПАПКЕ):'
git reset -q HEAD && git status --short
echo '-- --hard HEAD    (очищено всё):'
git reset -q --hard HEAD && git status --short
cat <<'TEXT'
   (после --hard пусто)

  reset двигает ВЕТКУ на другой коммит, а что при этом происходит с индексом
  и рабочим деревом — задают три флага:

    режим     коммит   индекс          рабочее дерево
    --soft    снят     правка здесь    не тронуто      «передумал насчёт сообщения»
    --mixed   снят     очищен          правка здесь    «передумал, что класть в коммит»
    --hard    снят     очищен          очищено         «выбросить всё»
TEXT

say "revert — отменить, не переписывая историю"
echo "ошибочная строка" >> suites.txt && git commit -q -am "ошибочный коммит"
git revert --no-edit HEAD >/dev/null
git log --oneline | head -2
cat <<'TEXT'
  revert не удаляет коммит — он делает НОВЫЙ, с обратными изменениями.
  Оба остаются в истории, и это единственный способ отменить то, что уже
  видят другие.

  Граница проходит по push, а не по коммиту:
    коммит ещё НЕ ушёл на сервер  → можно reset и amend
    коммит УЖЕ на сервере          → только revert
  Общую историю не переписывают: у остальных она уже есть.
TEXT
