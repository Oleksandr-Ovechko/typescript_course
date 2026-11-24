/**
 * Урок 5 · Методы объекта и this.
 *
 * Что здесь: метод и this · метод меняет свой объект · необязательный метод
 * и ?.() · this вычисляется при вызове · this: в скобках — не параметр ·
 * метод у копии · оторванный метод · у стрелки своего this нет.
 *
 *   node lessons/lesson-05/examples/03-methods-and-this.ts   запустить
 *   yarn typecheck                                           проверить типы
 */

// ── Метод и this ───────────────────────────────────────────────────────────
// Метод — функция в свойстве объекта. greet(): string { … } — короткая
// запись для greet: function (): string { … }.
// this — объект, у которого метод ВЫЗВАЛИ: то, что слева от точки.
// Просто name внутри метода искалось бы как обычная переменная снаружи.
const user = {
  name: 'Ann',
  greet(): string {
    return `Привет, я ${this.name}`;
  },
};
console.log('1)', user.greet()); // 1) Привет, я Ann

// ── Метод меняет свой объект ───────────────────────────────────────────────
// Слева от точки wallet, значит this.balance — это wallet.balance.
const wallet = {
  balance: 100,
  add(amount: number): number {
    this.balance = this.balance + amount;
    return this.balance;
  },
};
console.log('2)', wallet.add(50), wallet.balance); // 2) 150 150

// ── Метода может не быть ───────────────────────────────────────────────────
// say?(): string — необязательный метод. quiet.say?.(): метод есть — вызвать,
// нет — результат undefined, и вызова не будет.
const quiet: { say?(): string } = {};
const loud: { say?(): string } = {
  say(): string {
    return 'Привет';
  },
};
console.log('3)', quiet.say?.(), loud.say?.()); // 3) undefined Привет

// ❌ TS2722: Cannot invoke an object which is possibly 'undefined'.
// quiet.say();

// ── this вычисляется при вызове ────────────────────────────────────────────
// Функция одна, объектов два. this берётся не из функции, а из вызова.
// Замыкание — из места НАПИСАНИЯ, this — из места ВЫЗОВА.
//
// this: { name: string } первым в скобках — НЕ параметр. Это подсказка
// TypeScript, каким будет this. При вызове его не передают, а в JavaScript
// от него не остаётся ничего: introduce.length — 0.
function introduce(this: { name: string }): string {
  return `меня зовут ${this.name}`;
}
const cat = { name: 'Мурка', introduce: introduce };
const dog = { name: 'Бобик', introduce: introduce };
console.log('4)', cat.introduce(), dog.introduce(), cat.introduce === dog.introduce); // 4) меня зовут Мурка меня зовут Бобик true
console.log('5)', introduce.length); // 5) 0

// ❌ TS2684: The 'this' context of type 'void' is not assignable to method's 'this' of type '{ name: string; }'.
// introduce();

// ❌ TS2554: Expected 0 arguments, but got 1.
// introduce(cat);

// ── Метод у копии ──────────────────────────────────────────────────────────
// ... копирует свойства: число balance — значением (это примитив), функцию
// add — ссылкой. Функция одна, а this у неё — тот, у кого вызвали.
const walletCopy = { ...wallet };
walletCopy.add(10);
console.log('6)', wallet.balance, walletCopy.balance, wallet.add === walletCopy.add); // 6) 150 160 true

// ── Вызвали без объекта — this потерялся ───────────────────────────────────
// const detached = user.greet; detached() — точки нет, this взять неоткуда.
// В модуле (наши файлы) this тогда undefined, и чтение .name падает.
// TypeScript этого НЕ ловит, поэтому в файле такой строки нет — запустите:
//   node --input-type=module -e "const pet = { name: 'Ann', greet() { return 'Привет, я ' + this.name; } }; const detached = pet.greet; console.log(detached());"
//   → TypeError: Cannot read properties of undefined (reading 'name')
// В старом скрипте (та же команда без --input-type=module) this — глобальный
// объект: падения нет, печатает «Привет, я undefined». Тихо и хуже.
//
// Так this теряют на практике: метод передают колбэком — его вызывает уже
// не объект. Ниже — как этого избежать стрелкой.

// ── У стрелки своего this нет ──────────────────────────────────────────────
// repeatTimes вызывает колбэк сам, без точки. У стрелки своего this нет:
// она берёт его снаружи, по цепочке окружений, — из вызова listMembers.
// А там this — то, у кого вызвали listMembers: team.
//
//   метод — обычный:      listMembers() { … }      this = team (слева от точки)
//   колбэк — стрелка:     (round) => this.title     своего this нет → берёт у метода
//   стрелка ВМЕСТО метода: listMembers: () => …      this снаружи объекта → не работает
//
// Стрелка берёт this вызова listMembers, а не «объект навсегда»: оторванный
// const list = team.listMembers; list() упадёт на this.members.
function repeatTimes(times: number, action: (round: number) => void): void {
  for (let round = 1; round <= times; round++) {
    action(round);
  }
}
const team = {
  title: 'Команда',
  members: ['Ann', 'Bob'],
  listMembers(): string[] {
    const lines: string[] = [];
    repeatTimes(this.members.length, (round) => {
      lines.push(`${this.title}: ${this.members[round - 1]}`);
    });
    return lines;
  },
};
console.log('7)', team.listMembers()); // 7) [ 'Команда: Ann', 'Команда: Bob' ]

export {};
