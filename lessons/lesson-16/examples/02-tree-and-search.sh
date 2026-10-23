#!/usr/bin/env bash
# Урок 16 · DOM-дерево · навигация и поиск
#
# Что здесь: корень и ветви · текстовые узлы из пробелов и комментарии ·
# childNodes против children · родители, дети, соседи · querySelector,
# querySelectorAll, getElementById, closest, matches.
#
#   bash lessons/lesson-16/examples/02-tree-and-search.sh
#   cd /tmp/wl-dom-examples/tree-and-search    # песочница остаётся

source "$(dirname "$0")/_sandbox.sh" tree-and-search

say "Дерево: корень и первые ветви"
cat > console/tree.js <<'JS'
console.log('2)', document.documentElement.nodeName, document.head.nodeName, document.body.nodeName);
console.log('2a)', [...document.body.childNodes].slice(0, 6).map((n) => n.nodeName).join(' '));
console.log('2b)', document.body.childNodes.length, document.body.children.length);
JS
console_run console/tree.js

cat <<'TEXT'
  Корень — <html> (document.documentElement), от него <head> и <body>.

  2a) — первые дети <body>. #text — текстовый узел: перенос строки
  и отступ между тегами в разметке. #comment — HTML-комментарий
  <!-- список занятий -->. Он тоже узел дерева.

  2b) — childNodes считает все узлы, children — только элементы.
  Разница — пробелы и комментарии.
TEXT

say "Родители, дети, соседи"
cat > console/navigation.js <<'JS'
const header = document.body.firstElementChild;
console.log('3)', header.id, header.children.length, header.nextElementSibling.nodeName, header.nextSibling.nodeName);
JS
console_run console/navigation.js

cat <<'TEXT'
  У каждой пары «все узлы / только элементы»: firstChild и
  firstElementChild, nextSibling и nextElementSibling. Сосед <header>
  среди элементов — <h1>, а просто следующий узел — #text, перенос
  строки после </header>.
TEXT

say "Поиск: querySelector, closest, matches"
cat > console/search.js <<'JS'
const yogaName = document.querySelector('.session .name');
console.log('3a)', yogaName.className, yogaName.parentElement.className, yogaName.closest('ul').id);
console.log('3b)', document.querySelectorAll('.book').length, document.querySelectorAll('.book:disabled').length, yogaName.matches('.session span'));
console.log('3c)', document.getElementById('sessions') === document.querySelector('#sessions'), document.querySelector('.nothing'));
console.log('3d)', yogaName.closest('.name') === yogaName);
JS
console_run console/search.js

cat <<'TEXT'
  querySelector — первый подходящий элемент или null (3c). querySelectorAll —
  все, списком. getElementById — то же, что querySelector('#id').

  closest идёт от элемента вверх, к корню, и возвращает ближайшего
  подходящего. Проверку он начинает с самого элемента (3d): если тот
  подходит, closest вернёт его. matches — подходит ли элемент под
  селектор, true или false.

  Селектор CSS находит элементы. Текстовые узлы и содержимое shadow DOM
  он не находит.
TEXT
