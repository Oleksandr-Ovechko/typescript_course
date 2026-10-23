#!/usr/bin/env bash
# Урок 8 · Приложение: минимум bash и настройка редактора
#
# Что здесь: команды терминала, которыми набирались все примеры ·
# почему `git commit` без -m открывает «что-то чёрное» и как из этого выйти ·
# чем `git commit -m` отличается от `-am` и при чём тут кнопка в VS Code.
#
#   bash lessons/lesson-08/examples/08-bash-and-editor.sh

set -e
export GIT_PAGER=cat
SANDBOX=/tmp/wl-git-examples/l8-bash
rm -rf "$SANDBOX" && mkdir -p "$SANDBOX" && cd "$SANDBOX"

say() { printf '\n\033[1m── %s\033[0m\n' "$1"; }

say "Минимум bash — этого хватает на оба git-урока"
mkdir -p tests                      # -p: создать вместе с родителями, не ругаться, если есть
echo "widgets" > suites.txt         # > записать в файл (ПЕРЕЗАПИСАВ его)
echo "monolith" >> suites.txt       # >> дописать в конец
cat suites.txt                      # напечатать содержимое файла
printf 'a\nb\n' > two-lines.txt     # printf понимает \n, в отличие от echo
touch empty.txt                     # создать пустой файл
cp suites.txt backup.txt            # скопировать
rm -f empty.txt                     # удалить, -f = не ругаться, если файла нет
ls -a                               # -a: показать и скрытые (те, что с точки)
cat <<'TEXT'

  Ещё три вещи, которые встречаются постоянно:

    команда1 && команда2    выполнить вторую, ТОЛЬКО если первая прошла успешно.
                            Один & вместо двух — совсем другая команда:
                            «запусти первое в фоне», и цепочка развалится.
    команда1 | команда2     пайп: отдать вывод первой на вход второй
    $(команда)              подставить ВЫВОД команды в это место
TEXT
echo "-- пайп и подстановка на живом примере:"
echo "строк в файле: $(cat suites.txt | wc -l)"
echo "-- grep -c считает совпадения, а не печатает их:"
printf 'Book\nBook Now\nReserve\n' | grep -c 'Book'

say "Редактор: почему открывается «что-то чёрное»"
cat <<'TEXT'
  Git открывает редактор, когда сообщение не задано флагом -m: при
  `git commit` (файл .git/COMMIT_EDITMSG), при слиянии без конфликта,
  которое создаёт коммит слияния (.git/MERGE_MSG), при `git rebase -i`.
  После конфликта — на `git commit`, когда конфликт разрешён. Закрыли
  файл — git пошёл дальше, оставили пустым — git отменит операцию.

  Что именно откроется, решает цепочка:
      $GIT_EDITOR → core.editor → $VISUAL → $EDITOR → системный `editor`

  На Ubuntu системный `editor` — это НЕ vim, а nano. Отсюда путаница:
  выглядят они похоже, а выходят из них по-разному.

      nano:  Ctrl+O  записать · Enter  подтвердить · Ctrl+X  выйти
      vim:   Esc  потом  :wq  записать и выйти  ·  :q!  выйти не сохраняя

  Чтобы вместо обоих открывался VS Code:
      git config --global core.editor "code --wait"
  --wait заставляет git дождаться, пока вы закроете вкладку.
TEXT
echo "-- что откроется лично у вас (запускается прямо сейчас):"
git var GIT_EDITOR
echo '   Ожидаемое: code --wait. Если видите nano, vi или что-то ещё —'
echo '   настройка не применилась. Если видите true — значит переменная'
echo '   окружения GIT_EDITOR перебивает core.editor (так делают некоторые'
echo '   инструменты); её надо убрать, иначе настройка не заработает никогда.'
cat <<'TEXT'
  ⚠️ Проверять надо именно `git var GIT_EDITOR`, а не `git config --get
  core.editor`. Git не проверяет имена ключей: опечатка в названии
  (`core.editoer` вместо `core.editor`) не вызовет НИКАКОЙ ошибки — настройка
  просто не будет существовать, а git молча возьмёт редактор по умолчанию.
  Реальный случай, стоивший урока.
TEXT

say "git commit -m против git commit -am"
git init -q -b main
git config user.name "Тестировщик" && git config user.email "qa@example.com"
git add suites.txt && git commit -q -m "первый коммит"
echo "explorer" >> suites.txt
echo "-- пробуем закоммитить, ничего не добавив в индекс:"
git commit -m "попытка" || true
cat <<'TEXT'
  `git commit -m` НЕ индексирует ничего и никогда. Пустой индекс — нет коммита.

    git add файл && git commit -m "…"   явно: что добавили, то и уедет
    git commit -am "…"                  -a берёт все изменённые УЖЕ
                                        ОТСЛЕЖИВАЕМЫЕ файлы. Для новых
                                        файлов не работает: git их не знает

  «А у меня `git commit -m` коммитил всё подряд» — так бывает по двум причинам:
  либо перед этим был `git add .`, либо коммит делался кнопкой в VS Code.
  У кнопки есть Smart Commit — настройка git.enableSmartCommit, «Commit all
  changes when there are no staged changes». Сама она выключена, но VS Code
  предлагает её включить при первом же коммите с пустым индексом, и почти все
  соглашаются. После этого кнопка коммитит всё, и поведение перестаёт
  отличаться от -am.
TEXT
git commit -q -am "закоммитили через -am"
git log --oneline
