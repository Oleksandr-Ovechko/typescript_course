#!/usr/bin/env bash
# Урок 9 · Конфликт: где проходит его граница и как его разрешать
#
# Что здесь: когда конфликт возникает, а когда git сливает молча (замеры) ·
# что означают маркеры <<<<<<< ======= >>>>>>> · как выйти, ничего не решая ·
# служебные файлы внутри .git во время слияния · коммит с двумя родителями.
#
#   bash lessons/lesson-09/examples/03-conflict.sh

set -e
export GIT_PAGER=cat
SANDBOX=/tmp/wl-git-examples/l9-conflict
rm -rf "$SANDBOX" && mkdir -p "$SANDBOX" && cd "$SANDBOX"

say() { printf '\n\033[1m── %s\033[0m\n' "$1"; }

say "Сначала — где вообще проходит граница конфликта"
mkdir -p probe && cd probe
git init -q -b main
git config user.name t && git config user.email t@e.com
seq 1 10 > f.txt && git add . && git commit -q -m base
git switch -q -c their && sed -i '5s/.*/ИХ ПРАВКА/' f.txt && git commit -q -am their
for L in 6 7 8; do
  git switch -q main
  git branch -q -D our$L 2>/dev/null || true
  git switch -q -c our$L main
  sed -i "${L}s/.*/НАША ПРАВКА/" f.txt && git commit -q -am our$L
  printf '  они правят строку 5, мы строку %s: ' "$L"
  if git merge their >/dev/null 2>&1; then echo "слилось молча"; else echo "КОНФЛИКТ"; git merge --abort; fi
done
cat <<'TEXT'

  То есть «мы правили разные строки» — не гарантия. Git сливает молча, если
  изменённые куски НЕ СОПРИКАСАЮТСЯ: между ними осталась хотя бы одна
  нетронутая строка. Соседние строки конфликтуют.

  Три строки контекста, которые показывают `git diff` и `git add -p`
  (урок 8), здесь НЕ считаются: строки 5 и 7 стоят ближе трёх строк, а слились
  молча. Конфликт — это когда двое изменили ОДНО И ТО ЖЕ место (или строки
  вплотную), и решить за вас нельзя.
TEXT
cd ..

say "Получаем настоящий конфликт"
mkdir -p sandbox && cd sandbox
git init -q -b main
git config user.name "Тестировщик" && git config user.email "qa@example.com"
git config pull.rebase false
printf 'widgets\nmonolith\n' > suites.txt && git add . && git commit -q -m "два сьюта"
git init -q --bare -b main ../server.git
git remote add origin ../server.git && git push -q -u origin main
cd .. && git clone -q server.git colleague && cd colleague
git config user.name "Коллега" && git config user.email "peer@example.com"
echo "schedule" >> suites.txt && git commit -q -am "коллега добавил schedule" && git push -q origin main
cd ../sandbox
echo "appointments" >> suites.txt && git commit -q -am "мы добавили appointments"
git pull --no-rebase origin main 2>&1 | grep -E 'CONFLICT|Automatic merge failed' || true
echo '-- файл с маркерами:'
cat suites.txt
echo '-- статус и машинный список конфликтных файлов:'
git status --short
git diff --name-only --diff-filter=U
cat <<'TEXT'
  Маркеры:
    <<<<<<< HEAD   отсюда начинается ВАШ вариант — тот, что уже был у вас
    =======        разделитель
    >>>>>>> 0a20b  здесь кончается ЧУЖОЙ, и указан его коммит

  UU в статусе — «изменён с обеих сторон, не разрешён».
  Разрешить конфликт — это привести файл к нужному виду и убрать все три
  маркера. Команды «разреши за меня» не существует.
TEXT

say "Что лежит в .git, пока слияние не закончено"
ls .git | grep -E 'MERGE|COMMIT_EDITMSG' || true
cat <<'TEXT'
  MERGE_HEAD    — с каким коммитом сливаемся
  MERGE_MSG     — заготовка сообщения для коммита слияния
  MERGE_MODE    — режим слияния
  AUTO_MERGE    — то, что git сумел слить сам
  COMMIT_EDITMSG— файл, который откроется в редакторе для сообщения
  Пока эти файлы есть, git считает, что операция идёт, и не даст переключаться.
  У cherry-pick и rebase свои такие же: CHERRY_PICK_HEAD, REBASE_HEAD.
TEXT

say "Передумали — выходим, ничего не решая"
git merge --abort
cat suites.txt
git status --short
echo '   (пусто — дерево вернулось ровно в то состояние, что было до pull)'
echo '   Это безопасная кнопка «отмена». Нажимать её, если не понимаете,'
echo '   что происходит, — правильнее, чем править маркеры наугад.'

say "Разрешаем и коммитим"
git pull --no-rebase origin main >/dev/null 2>&1 || true
printf 'widgets\nmonolith\nschedule\nappointments\n' > suites.txt
git add suites.txt
git commit -q -m "слияние: оставил оба сьюта"
echo '-- у коммита слияния ДВА родителя:'
git cat-file -p HEAD | grep '^parent'
git log --oneline --graph --all --decorate | head -6
cat <<'TEXT'

  `git add` на конфликтном файле означает «я разрешил» — в VS Code это плюс
  у файла или кнопка Complete Merge. У коммита слияния два parent — только
  у коммита слияния родителей больше одного: именно поэтому граф в этом
  месте сходится обратно.

  В VS Code над блоком с маркерами появляется строка кнопок:
    Accept Current Change   оставить верхний блок (HEAD)
    Accept Incoming Change  оставить нижний блок
    Accept Both Changes     оставить оба подряд
    Compare Changes         открыть два варианта рядом
  Next Conflict и Accept All Current — команды палитры (Ctrl+Shift+P).

  Кнопка Resolve in Merge Editor открывает трёхпанельный редактор: две
  панели с подписями Current и Incoming и снизу Result с кнопкой Complete
  Merge. Ориентируйтесь по ПОДПИСИ панели, а не по тому, слева она или справа:
  подписи те же, что у маркеров и кнопок. Current — всегда HEAD. Чей это
  вариант, зависит от команды — см. последний блок.

  ⚠️ Accept Both — не универсальный ответ. Для списка сьютов она правильная,
  а для изменённой строки кода даст две несовместимые строки, и файл
  перестанет компилироваться. Смотреть глазами всегда.

  ⚠️ Если вместо кнопок открылся терминальный редактор — значит не настроен
  core.editor (урок 8). Файл с маркерами тот же самый, разрешается так же.
TEXT

say "При rebase «ваше» и «чужое» меняются местами"
cd .. && mkdir -p rebase && cd rebase
git init -q -b main
git config user.name t && git config user.email t@e.com
printf 'widgets\nmonolith\n' > suites.txt && git add . && git commit -q -m "два сьюта"
git switch -q -c feature && echo "appointments" >> suites.txt && git commit -q -am "наш коммит"
git switch -q main && echo "schedule" >> suites.txt && git commit -q -am "чужой коммит"
git switch -q feature
git rebase main >/dev/null 2>&1 || true
echo '-- маркеры при git rebase main (мы на feature):'
cat suites.txt
git rebase --abort
cat <<'TEXT'
  При merge в блоке HEAD было наше (appointments). При rebase в блоке HEAD —
  чужое (schedule), а наш коммит — внизу, после =======.

  Так происходит потому, что rebase сначала встаёт на чужую ветку (main),
  а потом по одному накладывает на неё ваши коммиты. В момент конфликта HEAD —
  это main. Поэтому при rebase Current (и `git checkout --ours`) — чужая
  ветка, Incoming (`--theirs`) — ваш коммит.
TEXT
