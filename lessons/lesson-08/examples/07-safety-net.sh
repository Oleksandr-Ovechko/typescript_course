#!/usr/bin/env bash
# Урок 8 · Сеть безопасности: reflog и его граница
#
# Что здесь: как вернуть коммит, снесённый `reset --hard` · чем HEAD@{N}
# отличается от HEAD~N · сколько на самом деле живут записи reflog ·
# что он НЕ вернёт и почему `git add` — это уже сохранение.
#
#   bash lessons/lesson-08/examples/07-safety-net.sh

set -e
export GIT_PAGER=cat
SANDBOX=/tmp/wl-git-examples/l8-reflog
rm -rf "$SANDBOX" && mkdir -p "$SANDBOX" && cd "$SANDBOX"

say() { printf '\n\033[1m── %s\033[0m\n' "$1"; }

git init -q -b main
git config user.name "Тестировщик" && git config user.email "qa@example.com"
printf 'widgets\n' > suites.txt && git add . && git commit -q -m "первый коммит"

say "Теряем коммит"
echo "ценная работа" >> suites.txt && git commit -q -am "ценный коммит"
git reset -q --hard HEAD~1
echo '-- git log про него больше не знает:'
git log --oneline
echo '-- а reflog знает:'
git reflog | head -3

say "Возвращаем"
git reset -q --hard 'HEAD@{1}'
git log --oneline | head -1
cat <<'TEXT'
  HEAD@{1} читается как «где HEAD был ОДНО ДЕЙСТВИЕ назад». Это не то же
  самое, что HEAD~1:
     HEAD~1    на один коммит назад по цепочке parent  (история проекта)
     HEAD@{1}  на одно ваше действие назад по журналу  (история ваших рук)

  reflog — журнал всех перемещений HEAD в ВАШЕМ локальном репозитории:
  коммиты, переключения веток, reset, rebase. Он не передаётся ни при push,
  ни при clone: он только ваш.
TEXT

say "Сколько живут записи reflog"
cat <<'TEXT'
  «Неудаляемым» журнал не является. Значения по умолчанию (man git-gc):

    gc.reflogExpire              90 дней — для записей, достижимых
                                 из текущей вершины ветки
    gc.reflogExpireUnreachable   30 дней — для всего остального, включая
                                 коммиты из detached HEAD и снесённые reset

  Сеть безопасности есть, но не вечная. Проверить свои значения:
    git config --get gc.reflogExpire        (пусто = умолчание)
TEXT

say "Чего reflog не вернёт"
echo "незакоммиченный черновик" >> suites.txt
git reset -q --hard HEAD
echo "-- строк «незакоммиченный черновик» в файле: $(grep -c 'незакоммиченный черновик' suites.txt || true). Строка пропала, и вернуть её нечем"
cat <<'TEXT'
  Таблица целиком:

    что потеряли                                      вернётся?  чем
    коммит (reset --hard HEAD~1, неудачный rebase,    ДА         git reflog →
    amend)                                                       git reset --hard HEAD@{N}
    правка в РАБОЧЕМ ДЕРЕВЕ, не добавленная в индекс  НЕТ        —
    правка В ИНДЕКСЕ (git add, потом reset --hard)    ДА,        git fsck --lost-found
                                                      но грязно
TEXT

say "Проверяем среднюю и нижнюю строки таблицы"
echo "черновик в индексе" >> suites.txt && git add suites.txt
BLOB=$(git rev-parse :suites.txt)          # : впереди = «версия из индекса»
git reset -q --hard HEAD
echo "-- висячих объектов в репозитории: $(git fsck --lost-found 2>/dev/null | grep -c 'dangling blob')"
echo '-- и содержимое достаётся, хотя reset --hard его «снёс»:'
git cat-file -p "$BLOB" | tail -1
cat <<'TEXT'

  Вот это и есть настоящая граница опасности, и она проходит не там,
  где кажется:

      git add — ЭТО УЖЕ СОХРАНЕНИЕ.

  Всё, что попало в индекс, git сохранил как объект, и его можно достать
  даже после reset --hard. Всё, что лежало только в папке, не сохранялось
  нигде и не вернётся ничем.

  Отсюда правило полезнее, чем «будьте осторожны»: коммитьте чаще и
  добавляйте в индекс раньше. Не ради красивой истории — ради того, что
  испорченный коммит правится, а испорченный черновик нет.
TEXT
