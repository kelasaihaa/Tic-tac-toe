/* ============================================================
   Tic Tac Toe — logik permainan
   ------------------------------------------------------------
   Fail ini dibahagi kepada dua bahagian:
     1. LOGIK TULEN  — tiada kaitan dengan DOM, boleh diuji
     2. LAPISAN UI   — hanya berjalan di dalam pelayar
   ============================================================ */

/* ------------------------------------------------------------
   BAHAGIAN 1 — LOGIK TULEN
   ------------------------------------------------------------ */

/** Kesemua 8 kombinasi barisan yang boleh menang. */
const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // mendatar
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // menegak
  [0, 4, 8], [2, 4, 6]             // pepenjuru
];

const EMPTY = '';

/**
 * Cari pemenang pada papan.
 * @returns {{mark: string, line: number[]}|null}
 */
function getWinner(board) {
  for (const line of LINES) {
    const [a, b, c] = line;
    if (board[a] !== EMPTY && board[a] === board[b] && board[a] === board[c]) {
      return { mark: board[a], line };
    }
  }
  return null;
}

/** Senarai indeks sel yang masih kosong. */
function emptyCells(board) {
  const out = [];
  for (let i = 0; i < board.length; i++) {
    if (board[i] === EMPTY) out.push(i);
  }
  return out;
}

/** Adakah papan sudah penuh? */
function isFull(board) {
  return board.every((cell) => cell !== EMPTY);
}

/** Simbol bertentangan. */
function opponentOf(mark) {
  return mark === 'X' ? 'O' : 'X';
}

/**
 * Minimax dengan pemangkasan alpha-beta.
 *
 * Skor dikira dari perspektif `aiMark`. `depth` ditolak daripada skor
 * kemenangan supaya AI memilih kemenangan yang paling cepat, dan
 * ditambah pada skor kekalahan supaya AI melengahkan kekalahan
 * selama mungkin (berguna bila kekalahan tidak dapat dielak).
 *
 * @returns {number} skor: positif = baik untuk AI
 */
function minimax(board, isAiTurn, depth, aiMark, alpha, beta) {
  const won = getWinner(board);
  if (won) return won.mark === aiMark ? 10 - depth : depth - 10;
  if (isFull(board)) return 0;

  const humanMark = opponentOf(aiMark);
  const moves = emptyCells(board);

  if (isAiTurn) {
    let best = -Infinity;
    for (const i of moves) {
      board[i] = aiMark;
      const score = minimax(board, false, depth + 1, aiMark, alpha, beta);
      board[i] = EMPTY;
      if (score > best) best = score;
      if (best > alpha) alpha = best;
      if (beta <= alpha) break; // pangkas
    }
    return best;
  }

  let best = Infinity;
  for (const i of moves) {
    board[i] = humanMark;
    const score = minimax(board, true, depth + 1, aiMark, alpha, beta);
    board[i] = EMPTY;
    if (score < best) best = score;
    if (best < beta) beta = best;
    if (beta <= alpha) break; // pangkas
  }
  return best;
}

/**
 * Langkah terbaik secara mutlak untuk `aiMark`.
 * Antara langkah yang sama skor, satu dipilih secara rawak supaya
 * permainan tidak menjadi terlalu berulang.
 * @returns {number|null} indeks sel, atau null jika papan penuh
 */
function bestMove(board, aiMark) {
  const moves = emptyCells(board);
  if (moves.length === 0) return null;

  let bestScore = -Infinity;
  let candidates = [];

  for (const i of moves) {
    board[i] = aiMark;
    const score = minimax(board, false, 1, aiMark, -Infinity, Infinity);
    board[i] = EMPTY;

    if (score > bestScore) {
      bestScore = score;
      candidates = [i];
    } else if (score === bestScore) {
      candidates.push(i);
    }
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}

/** Peluang AI memilih langkah optimum, mengikut tahap kesukaran. */
const ACCURACY = {
  mudah:     0.15,
  sederhana: 0.70,
  mustahil:  1.00
};

/**
 * Pilih langkah AI berdasarkan tahap kesukaran.
 * Pada tahap rendah, AI kadang-kadang bermain secara rawak.
 * @returns {number|null} indeks sel
 */
function chooseAiMove(board, aiMark, difficulty) {
  const moves = emptyCells(board);
  if (moves.length === 0) return null;

  const accuracy = ACCURACY[difficulty] ?? 1;
  if (Math.random() < accuracy) return bestMove(board, aiMark);
  return moves[Math.floor(Math.random() * moves.length)];
}

/* Dedahkan logik tulen untuk ujian di Node. */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    LINES, EMPTY, getWinner, emptyCells, isFull,
    opponentOf, minimax, bestMove, chooseAiMove, ACCURACY
  };
}

/* ------------------------------------------------------------
   BAHAGIAN 2 — LAPISAN UI
   ------------------------------------------------------------ */

if (typeof document !== 'undefined') {
  const STORAGE_KEY = 'tictactoe.v1';
  const AI_DELAY_MS = 380;

  const el = {
    board:        document.getElementById('board'),
    strike:       document.getElementById('strike'),
    strikeLine:   document.getElementById('strikeLine'),
    status:       document.getElementById('status'),
    scoreX:       document.getElementById('scoreX'),
    scoreO:       document.getElementById('scoreO'),
    scoreDraw:    document.getElementById('scoreDraw'),
    labelX:       document.getElementById('labelX'),
    labelO:       document.getElementById('labelO'),
    btnRestart:   document.getElementById('btnRestart'),
    btnResetScore:document.getElementById('btnResetScore'),
    settingDiff:  document.getElementById('settingDifficulty'),
    settingSide:  document.getElementById('settingSide')
  };

  const state = {
    board: Array(9).fill(EMPTY),
    current: 'X',        // 'X' sentiasa mula dahulu
    mode: 'ai',          // 'ai' | 'pvp'
    difficulty: 'mustahil',
    humanMark: 'X',      // hanya bermakna dalam mod 'ai'
    over: false,
    locked: false,       // benar semasa komputer berfikir
    winner: null,        // { mark, line } | null
    scores: { X: 0, O: 0, draw: 0 }
  };

  let aiTimer = null;
  const cells = [];

  /* ---------- Kegigihan ---------- */

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        scores: state.scores,
        mode: state.mode,
        difficulty: state.difficulty,
        humanMark: state.humanMark
      }));
    } catch { /* localStorage mungkin dihalang — abaikan */ }
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);

      if (data.scores && typeof data.scores === 'object') {
        for (const key of ['X', 'O', 'draw']) {
          const value = Number(data.scores[key]);
          if (Number.isFinite(value) && value >= 0) state.scores[key] = value;
        }
      }
      if (data.mode === 'ai' || data.mode === 'pvp') state.mode = data.mode;
      if (data.difficulty in ACCURACY) state.difficulty = data.difficulty;
      if (data.humanMark === 'X' || data.humanMark === 'O') state.humanMark = data.humanMark;
    } catch { /* data rosak — guna nilai lalai */ }
  }

  /* ---------- Pembantu ---------- */

  const aiMark = () => opponentOf(state.humanMark);
  const isAiTurn = () => state.mode === 'ai' && state.current === aiMark();

  function playerName(mark) {
    if (state.mode === 'pvp') return `Pemain ${mark}`;
    return mark === state.humanMark ? 'Anda' : 'Komputer';
  }

  /* ---------- Bina papan ---------- */

  function buildBoard() {
    for (let i = 0; i < 9; i++) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'cell';
      cell.dataset.index = String(i);

      const ghost = document.createElement('span');
      ghost.className = 'cell__ghost';
      cell.appendChild(ghost);

      cell.addEventListener('click', () => handleMove(i));
      // Sisipkan sebelum SVG supaya garisan kemenangan kekal di atas
      el.board.insertBefore(cell, el.strike);
      cells.push(cell);
    }
  }

  /* ---------- Garisan kemenangan ---------- */

  /** Pusat sel dalam sistem koordinat SVG 300×300. */
  function cellCenter(index) {
    return { x: (index % 3) * 100 + 50, y: Math.floor(index / 3) * 100 + 50 };
  }

  function drawStrike(line, mark) {
    const from = cellCenter(line[0]);
    const to = cellCenter(line[2]);

    // Panjangkan sedikit melewati kedua-dua hujung supaya nampak lebih baik
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.hypot(dx, dy) || 1;
    const pad = 22;
    const ux = (dx / dist) * pad;
    const uy = (dy / dist) * pad;

    const x1 = from.x - ux, y1 = from.y - uy;
    const x2 = to.x + ux,   y2 = to.y + uy;

    el.strikeLine.setAttribute('x1', String(x1));
    el.strikeLine.setAttribute('y1', String(y1));
    el.strikeLine.setAttribute('x2', String(x2));
    el.strikeLine.setAttribute('y2', String(y2));

    el.strike.style.setProperty('--len', String(Math.hypot(x2 - x1, y2 - y1)));
    el.strike.classList.add('is-visible', mark === 'X' ? 'is-x' : 'is-o');
  }

  function clearStrike() {
    el.strike.classList.remove('is-visible', 'is-x', 'is-o');
  }

  /* ---------- Render ---------- */

  function render() {
    const winLine = state.winner ? state.winner.line : [];

    cells.forEach((cell, i) => {
      const mark = state.board[i];
      const filled = mark !== EMPTY;

      cell.classList.toggle('is-filled', filled);
      cell.classList.toggle('cell--x', mark === 'X');
      cell.classList.toggle('cell--o', mark === 'O');
      cell.classList.toggle('is-win', winLine.includes(i));
      cell.disabled = filled || state.over || state.locked;

      const ghost = cell.querySelector('.cell__ghost');
      const existing = cell.querySelector('.cell__mark');

      if (filled) {
        if (ghost) ghost.textContent = '';
        if (!existing) {
          const span = document.createElement('span');
          span.className = 'cell__mark';
          span.textContent = mark;
          cell.appendChild(span);
        } else if (existing.textContent !== mark) {
          existing.textContent = mark;
        }
        cell.setAttribute('aria-label', `Petak ${i + 1}: ${mark}`);
      } else {
        if (existing) existing.remove();
        // Pratonton simbol pemain semasa (hanya bila giliran manusia)
        if (ghost) ghost.textContent = (state.over || isAiTurn()) ? '' : state.current;
        cell.setAttribute('aria-label', `Petak ${i + 1}: kosong`);
      }
    });

    el.board.classList.toggle('is-locked', state.locked || state.over);
    el.board.classList.toggle('is-over', state.over);
    el.board.classList.toggle('is-won', state.winner !== null);

    el.scoreX.textContent = String(state.scores.X);
    el.scoreO.textContent = String(state.scores.O);
    el.scoreDraw.textContent = String(state.scores.draw);

    el.labelX.textContent = playerName('X');
    el.labelO.textContent = playerName('O');

    const turnX = !state.over && state.current === 'X';
    const turnO = !state.over && state.current === 'O';
    el.scoreX.closest('.score').classList.toggle('is-turn', turnX);
    el.scoreO.closest('.score').classList.toggle('is-turn', turnO);

    renderStatus();
  }

  function renderStatus() {
    el.status.className = 'status';

    if (state.winner) {
      const mark = state.winner.mark;
      const who = playerName(mark);
      el.status.textContent =
        state.mode === 'ai'
          ? (mark === state.humanMark ? 'Anda menang! 🎉' : 'Komputer menang 🤖')
          : `${who} menang! 🎉`;
      el.status.classList.add(mark === 'X' ? 'is-win-x' : 'is-win-o');
      return;
    }

    if (state.over) {
      el.status.textContent = 'Seri — tiada pemenang 🤝';
      el.status.classList.add('is-draw');
      return;
    }

    if (state.locked) {
      el.status.textContent = 'Komputer sedang berfikir…';
      el.status.classList.add('is-thinking');
      return;
    }

    el.status.textContent =
      state.mode === 'ai' && state.current === state.humanMark
        ? `Giliran anda (${state.current})`
        : `Giliran ${playerName(state.current)} (${state.current})`;
  }

  function bumpScore(mark) {
    const node = mark === 'draw' ? el.scoreDraw : (mark === 'X' ? el.scoreX : el.scoreO);
    node.classList.remove('is-bumped');
    void node.offsetWidth; // paksa reflow supaya animasi dimainkan semula
    node.classList.add('is-bumped');
  }

  /* ---------- Aliran permainan ---------- */

  function handleMove(index) {
    if (state.over || state.locked) return;
    if (state.board[index] !== EMPTY) return;
    if (isAiTurn()) return; // tunggu komputer

    commitMove(index, state.current);
  }

  function commitMove(index, mark) {
    state.board[index] = mark;

    const won = getWinner(state.board);
    if (won) {
      state.winner = won;
      state.over = true;
      state.locked = false;
      state.scores[won.mark] += 1;
      save();
      render();
      drawStrike(won.line, won.mark);
      bumpScore(won.mark);
      return;
    }

    if (isFull(state.board)) {
      state.over = true;
      state.locked = false;
      state.scores.draw += 1;
      save();
      render();
      bumpScore('draw');
      return;
    }

    state.current = opponentOf(mark);
    maybeRunAi();
    render();
  }

  function maybeRunAi() {
    if (!isAiTurn() || state.over) return;

    state.locked = true;
    clearTimeout(aiTimer);
    aiTimer = setTimeout(() => {
      // Salinan papan supaya minimax tidak menyentuh keadaan sebenar
      const move = chooseAiMove(state.board.slice(), aiMark(), state.difficulty);
      state.locked = false;
      if (move === null || state.over) { render(); return; }
      commitMove(move, aiMark());
    }, AI_DELAY_MS + Math.random() * 220);
  }

  function newRound() {
    clearTimeout(aiTimer);
    state.board = Array(9).fill(EMPTY);
    state.current = 'X';
    state.over = false;
    state.locked = false;
    state.winner = null;
    clearStrike();
    maybeRunAi();  // jika komputer main sebagai X, dia mula dahulu
    render();
  }

  function resetScores() {
    state.scores = { X: 0, O: 0, draw: 0 };
    save();
    render();
  }

  /* ---------- Kawalan tetapan ---------- */

  /** Tandakan butang aktif dalam satu kumpulan segmented. */
  function setActive(group, value, attr) {
    group.querySelectorAll('.segmented__item').forEach((btn) => {
      const on = btn.dataset[attr] === value;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-checked', String(on));
    });
  }

  function syncSettingsUi() {
    const isAi = state.mode === 'ai';
    el.settingDiff.hidden = !isAi;
    el.settingSide.hidden = !isAi;

    document.querySelectorAll('[data-mode]').forEach((btn) => {
      const on = btn.dataset.mode === state.mode;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-checked', String(on));
    });
    setActive(el.settingDiff, state.difficulty, 'difficulty');
    setActive(el.settingSide, state.humanMark, 'side');
  }

  function bindSettings() {
    document.querySelectorAll('[data-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (state.mode === btn.dataset.mode) return;
        state.mode = btn.dataset.mode;
        save();
        syncSettingsUi();
        newRound();
      });
    });

    el.settingDiff.querySelectorAll('[data-difficulty]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (state.difficulty === btn.dataset.difficulty) return;
        state.difficulty = btn.dataset.difficulty;
        save();
        syncSettingsUi();
        render();
      });
    });

    el.settingSide.querySelectorAll('[data-side]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (state.humanMark === btn.dataset.side) return;
        state.humanMark = btn.dataset.side;
        save();
        syncSettingsUi();
        newRound();
      });
    });
  }

  /* ---------- Papan kekunci ---------- */

  function bindKeyboard() {
    document.addEventListener('keydown', (event) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      if (event.key >= '1' && event.key <= '9') {
        const index = Number(event.key) - 1;
        // Elak menaip dalam medan input (tiada dalam projek ini, tapi selamat)
        if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
        event.preventDefault();
        handleMove(index);
        return;
      }

      if (event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        newRound();
      }
    });
  }

  /* ---------- Mulakan ---------- */

  load();
  buildBoard();
  bindSettings();
  bindKeyboard();
  el.btnRestart.addEventListener('click', newRound);
  el.btnResetScore.addEventListener('click', resetScores);
  syncSettingsUi();
  newRound();
}
