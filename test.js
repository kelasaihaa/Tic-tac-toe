/* ============================================================
   Ujian untuk logik Tic Tac Toe
   ------------------------------------------------------------
   Jalankan:  node test.js
   Ujian ini mengimport script.js secara terus, jadi ia menguji
   kod yang sama seperti yang berjalan dalam pelayar.
   ============================================================ */

const g = require('./script.js');
const { EMPTY, getWinner, emptyCells, isFull, opponentOf, minimax, bestMove } = g;

let passed = 0;
let failed = 0;

function check(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  \u2713 ${name}`);
  } catch (err) {
    failed++;
    console.log(`  \u2717 ${name}`);
    console.log(`      ${err.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'penegasan gagal');
}

function eq(actual, expected, message) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${message || 'tidak sama'} — dapat ${a}, jangkaan ${e}`);
}

/** Tukar rentetan 9 aksara jadi papan. Guna '.' untuk petak kosong. */
function board(str) {
  const cells = str.replace(/[^XO.]/g, '').split('');
  assert(cells.length === 9, `papan perlu 9 petak, dapat ${cells.length}`);
  return cells.map((c) => (c === '.' ? EMPTY : c));
}

/* ------------------------------------------------------------
   1. Pengesanan kemenangan
   ------------------------------------------------------------ */

console.log('\nPengesanan kemenangan');

check('mengesan ketiga-tiga barisan mendatar', () => {
  eq(getWinner(board('XXX OO. ...')).line, [0, 1, 2], 'baris atas');
  eq(getWinner(board('OO. XXX ...')).line, [3, 4, 5], 'baris tengah');
  eq(getWinner(board('OO. ... XXX')).line, [6, 7, 8], 'baris bawah');
});

check('mengesan ketiga-tiga barisan menegak', () => {
  eq(getWinner(board('X.O X.O X..')).line, [0, 3, 6], 'lajur kiri');
  eq(getWinner(board('OX. .X. .XO')).line, [1, 4, 7], 'lajur tengah');
  eq(getWinner(board('O.X .OX ..X')).line, [2, 5, 8], 'lajur kanan');
});

check('mengesan kedua-dua pepenjuru', () => {
  eq(getWinner(board('XO. .XO ..X')).line, [0, 4, 8], 'pepenjuru \\');
  eq(getWinner(board('.OX .XO X..')).line, [2, 4, 6], 'pepenjuru /');
});

check('melaporkan simbol pemenang yang betul', () => {
  eq(getWinner(board('OOO XX. ...')).mark, 'O');
  eq(getWinner(board('XXX OO. ...')).mark, 'X');
});

check('tiada pemenang bagi papan kosong atau belum selesai', () => {
  eq(getWinner(board('... ... ...')), null, 'papan kosong');
  eq(getWinner(board('XOX OX. ...')), null, 'belum selesai');
});

check('petak kosong tidak dikira sebagai barisan', () => {
  // Tiga petak kosong dalam satu baris bukan kemenangan
  eq(getWinner(board('... XO. OX.')), null);
});

/* ------------------------------------------------------------
   2. Pembantu papan
   ------------------------------------------------------------ */

console.log('\nPembantu papan');

check('emptyCells menyenaraikan indeks yang betul', () => {
  eq(emptyCells(board('X.O .X. O..')), [1, 3, 5, 7, 8]);
  eq(emptyCells(board('XOXOXOXOX')), []);
  eq(emptyCells(board('.........')).length, 9);
});

check('isFull mengesan papan penuh', () => {
  assert(isFull(board('XOXOXOXOX')) === true, 'papan penuh sepatutnya true');
  assert(isFull(board('XOXOXOXO.')) === false, 'satu petak kosong sepatutnya false');
  assert(isFull(board('.........')) === false, 'papan kosong sepatutnya false');
});

check('opponentOf menukar simbol', () => {
  eq(opponentOf('X'), 'O');
  eq(opponentOf('O'), 'X');
});

/* ------------------------------------------------------------
   3. Kelakuan taktikal AI
   ------------------------------------------------------------ */

console.log('\nTaktik AI');

check('mengambil kemenangan segera bila ada', () => {
  // O boleh menang di petak 2
  eq(bestMove(board('OO. XX. ...'), 'O'), 2, 'sepatutnya main petak 2 untuk menang');
});

check('menghalang kemenangan segera pihak lawan', () => {
  // X akan menang di petak 2 — O mesti menghalang
  eq(bestMove(board('XX. O.. ...'), 'O'), 2, 'sepatutnya halang petak 2');
});

check('memilih menang sendiri daripada menghalang', () => {
  // X mengancam di 5, tetapi O boleh menang terus di 2
  eq(bestMove(board('OO. XX. ...'), 'O'), 2, 'menang lebih penting daripada menghalang');
});

check('menghalang ancaman pepenjuru', () => {
  // X di 0 dan 8, kosong di 4 — O mesti ambil tengah
  eq(bestMove(board('X.. ... ..X'), 'O'), 4, 'sepatutnya ambil petak tengah');
});

check('minimax menilai keadaan terminal dengan betul', () => {
  const aiWon = board('OOO XX. ...');
  assert(minimax(aiWon, false, 0, 'O', -Infinity, Infinity) > 0, 'AI menang sepatutnya positif');
  assert(minimax(aiWon, false, 0, 'X', -Infinity, Infinity) < 0, 'AI kalah sepatutnya negatif');

  const drawn = board('XXO OOX XXO');
  eq(getWinner(drawn), null, 'papan ujian ini sepatutnya seri');
  eq(minimax(drawn, true, 0, 'X', -Infinity, Infinity), 0, 'seri sepatutnya 0');
});

check('lebih suka menang cepat daripada menang lambat', () => {
  // Skor kemenangan ditolak depth, jadi menang segera bernilai lebih tinggi
  const now = board('OO. XX. ...');
  const scoreWinNow = (() => {
    now[2] = 'O';
    const s = minimax(now, false, 1, 'O', -Infinity, Infinity);
    now[2] = EMPTY;
    return s;
  })();
  assert(scoreWinNow === 9, `menang serta-merta sepatutnya bernilai 9, dapat ${scoreWinNow}`);
});

/* ------------------------------------------------------------
   4. Ujian menyeluruh: AI "Mustahil" tidak boleh kalah
   ------------------------------------------------------------
   Kita terokai SETIAP permainan yang mungkin:
     - pemain manusia mencuba setiap langkah yang sah
     - AI mencuba setiap langkah optimum (semua yang sama skor)
   Jika ada satu sahaja permainan di mana manusia menang, ujian gagal.
   ------------------------------------------------------------ */

console.log('\nAI Mustahil tidak boleh dikalahkan');

/** Semua langkah yang berkongsi skor minimax tertinggi. */
function allBestMoves(b, aiMark) {
  let best = -Infinity;
  let out = [];
  for (const i of emptyCells(b)) {
    b[i] = aiMark;
    const score = minimax(b, false, 1, aiMark, -Infinity, Infinity);
    b[i] = EMPTY;
    if (score > best) { best = score; out = [i]; }
    else if (score === best) out.push(i);
  }
  return out;
}

/** Terokai pokok permainan. Melontar ralat jika manusia berjaya menang. */
function explore(b, turn, aiMark, history) {
  const won = getWinner(b);
  if (won) {
    if (won.mark !== aiMark) {
      throw new Error(`manusia menang selepas langkah [${history.join(', ')}]`);
    }
    return { aiWins: 1, draws: 0 };
  }
  if (isFull(b)) return { aiWins: 0, draws: 1 };

  const moves = turn === aiMark ? allBestMoves(b, aiMark) : emptyCells(b);
  let aiWins = 0;
  let draws = 0;

  for (const i of moves) {
    b[i] = turn;
    history.push(`${turn}${i}`);
    const result = explore(b, opponentOf(turn), aiMark, history);
    history.pop();
    b[i] = EMPTY;
    aiWins += result.aiWins;
    draws += result.draws;
  }

  return { aiWins, draws };
}

check('AI sebagai O (manusia mula dahulu) tidak pernah kalah', () => {
  const started = Date.now();
  const result = explore(Array(9).fill(EMPTY), 'X', 'O', []);
  const total = result.aiWins + result.draws;
  assert(total > 0, 'tiada permainan diterokai');
  console.log(`      ${total} permainan diterokai — AI menang ${result.aiWins}, seri ${result.draws}, kalah 0 (${Date.now() - started}ms)`);
});

check('AI sebagai X (AI mula dahulu) tidak pernah kalah', () => {
  const started = Date.now();
  const result = explore(Array(9).fill(EMPTY), 'X', 'X', []);
  const total = result.aiWins + result.draws;
  assert(total > 0, 'tiada permainan diterokai');
  console.log(`      ${total} permainan diterokai — AI menang ${result.aiWins}, seri ${result.draws}, kalah 0 (${Date.now() - started}ms)`);
});

/* ------------------------------------------------------------
   5. Kesahan langkah AI
   ------------------------------------------------------------ */

console.log('\nKesahan langkah AI');

check('bestMove sentiasa memulangkan petak yang kosong', () => {
  // Uji 200 papan rawak yang sah
  for (let trial = 0; trial < 200; trial++) {
    const b = Array(9).fill(EMPTY);
    const marks = ['X', 'O'];
    const count = Math.floor(Math.random() * 7); // 0–6 langkah
    let turn = 0;
    for (let m = 0; m < count; m++) {
      const free = emptyCells(b);
      if (free.length === 0 || getWinner(b)) break;
      b[free[Math.floor(Math.random() * free.length)]] = marks[turn % 2];
      turn++;
    }
    if (getWinner(b) || isFull(b)) continue;

    const move = bestMove(b, marks[turn % 2]);
    assert(move !== null, 'sepatutnya memulangkan satu langkah');
    assert(b[move] === EMPTY, `petak ${move} sudah diisi: ${b.join('')}`);
  }
});

check('bestMove memulangkan null bila papan penuh', () => {
  eq(bestMove(board('XOXOXOXOX'), 'O'), null);
});

check('chooseAiMove menghormati setiap tahap kesukaran', () => {
  for (const level of ['mudah', 'sederhana', 'mustahil']) {
    for (let trial = 0; trial < 40; trial++) {
      const b = board('X.O .X. ...');
      const move = g.chooseAiMove(b, 'O', level);
      assert(b[move] === EMPTY, `tahap ${level} memilih petak yang sudah diisi`);
    }
  }
});

/* ------------------------------------------------------------
   Ringkasan
   ------------------------------------------------------------ */

console.log(`\n${'-'.repeat(46)}`);
console.log(`Lulus: ${passed}   Gagal: ${failed}`);
console.log('-'.repeat(46));

process.exit(failed === 0 ? 0 : 1);
