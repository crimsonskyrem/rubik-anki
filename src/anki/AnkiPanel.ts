import type { Formula } from '../cfop/types';
import { algorithmsOf } from '../cfop/data';
import { parseAlgorithm, type Move, type MoveBase, type MoveDir } from '../cube/algorithm';

// ═══ Types ═══

type Category = 'f2l' | 'oll' | 'pll';

export interface AnkiHandlers {
  onPickFormula: (formula: Formula) => void;
  onCorrectMove: (move: Move) => void;
  onComplete: () => void;
  onExit: () => void;
}

interface MoveButton {
  label: string;
  base: MoveBase;
  dir: MoveDir;
}

// ═══ Constants ═══

const STORAGE_KEY = 'rubik-anki-pools';

const MOVE_BUTTONS: MoveButton[][] = [
  [
    { label: "U", base: "U", dir: 1 },
    { label: "U'", base: "U", dir: -1 },
    { label: "R", base: "R", dir: 1 },
    { label: "R'", base: "R", dir: -1 },
    { label: "F", base: "F", dir: 1 },
    { label: "F'", base: "F", dir: -1 },
  ],
  [
    { label: "D", base: "D", dir: 1 },
    { label: "D'", base: "D", dir: -1 },
    { label: "L", base: "L", dir: 1 },
    { label: "L'", base: "L", dir: -1 },
    { label: "B", base: "B", dir: 1 },
    { label: "B'", base: "B", dir: -1 },
  ],
  [
    { label: "r", base: "r", dir: 1 },
    { label: "r'", base: "r", dir: -1 },
    { label: "l", base: "l", dir: 1 },
    { label: "l'", base: "l", dir: -1 },
    { label: "M", base: "M", dir: 1 },
    { label: "M'", base: "M", dir: -1 },
  ],
  [
    { label: "x", base: "x", dir: 1 },
    { label: "x'", base: "x", dir: -1 },
    { label: "y", base: "y", dir: 1 },
    { label: "y'", base: "y", dir: -1 },
  ],
];

const CATEGORY_LABELS: Record<Category, string> = {
  f2l: 'F2L',
  oll: 'OLL',
  pll: 'PLL',
};

const CATEGORY_COUNTS: Record<Category, number> = {
  f2l: 41,
  oll: 57,
  pll: 21,
};

// ═══ Helpers ═══

function loadPools(): Category[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((c): c is Category => ['f2l', 'oll', 'pll'].includes(c));
  } catch {
    return [];
  }
}

function savePools(pools: Category[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pools));
}

function moveEqual(a: Move, b: Move): boolean {
  return a.base === b.base && a.dir === b.dir;
}

/** Expand an algorithm string into single-turn moves (dir:2 -> two dir:1). */
function expandToSingles(alg: string): Move[] {
  return parseAlgorithm(alg).flatMap((m): Move[] =>
    m.dir === 2
      ? [{ base: m.base, dir: 1 }, { base: m.base, dir: 1 }]
      : [m],
  );
}

/** True if `prefix` is a prefix of `candidate` (move-by-move). */
function isPrefix(prefix: Move[], candidate: Move[]): boolean {
  if (prefix.length > candidate.length) return false;
  for (let i = 0; i < prefix.length; i++) {
    if (!moveEqual(prefix[i], candidate[i])) return false;
  }
  return true;
}

function pickRandom(formulas: Formula[], pools: Category[]): Formula {
  const pool = formulas.filter((f) => pools.includes(f.category as Category));
  return pool[Math.floor(Math.random() * pool.length)];
}

function categoryBadge(cat: Formula['category']): string {
  const map: Record<string, string> = { cross: '十字', f2l: 'F2L', oll: 'OLL', pll: 'PLL' };
  return map[cat] ?? cat;
}

function moveLabel(m: Move): string {
  const suffix = m.dir === -1 ? "'" : m.dir === 2 ? '2' : '';
  return m.base + suffix;
}

// ═══ Builder ═══

export function buildAnkiPanel(
  container: HTMLElement,
  formulas: Formula[],
  handlers: AnkiHandlers,
): void {
  const { onPickFormula, onCorrectMove, onComplete, onExit } = handlers;

  let selectedPools = loadPools();
  let currentFormula: Formula | null = null;
  /** All candidate algorithms for the current formula, each expanded to single turns. */
  let candidates: Move[][] = [];
  /** Moves accepted so far (a prefix of at least one candidate). */
  let userMoves: Move[] = [];
  let skipped = false;

  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.overflow = 'hidden';

  function render(): void {
    container.innerHTML = '';
    if (selectedPools.length === 0) {
      renderPoolSelector();
    } else {
      renderPractice();
    }
  }

  /** True when the user has finished any candidate algorithm. */
  function isComplete(): boolean {
    return candidates.some((c) => c.length === userMoves.length && isPrefix(userMoves, c));
  }

  // ═══ Pool Selector ═══

  function renderPoolSelector(): void {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display: flex; flex-direction: column; gap: 16px; padding: 8px 0;';

    const title = document.createElement('h3');
    title.textContent = '选择公式池';
    title.style.cssText = 'text-align: center; font-size: 16px; margin: 0;';
    wrapper.appendChild(title);

    const pools: Category[] = ['f2l', 'oll', 'pll'];
    const checkboxes: Record<Category, HTMLInputElement> = {} as any;

    for (const pool of pools) {
      const row = document.createElement('label');
      row.style.cssText = `
        display: flex; align-items: center; gap: 10px;
        padding: 12px; background: #0f3460; border-radius: 8px;
        cursor: pointer; font-size: 14px;
      `;
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = selectedPools.includes(pool);
      cb.style.cssText = 'width: 18px; height: 18px; accent-color: #e94560;';
      row.appendChild(cb);
      const span = document.createElement('span');
      span.textContent = `${CATEGORY_LABELS[pool]}（${CATEGORY_COUNTS[pool]} 条公式）`;
      row.appendChild(span);
      wrapper.appendChild(row);
      checkboxes[pool] = cb;
    }

    const startBtn = document.createElement('button');
    startBtn.textContent = '开始练习';
    startBtn.style.cssText = `
      padding: 12px; border: none; border-radius: 8px; cursor: pointer;
      font-size: 15px; font-weight: 600; background: #e94560; color: #fff;
      transition: opacity 0.15s;
    `;
    startBtn.addEventListener('click', () => {
      const selected: Category[] = pools.filter((p) => checkboxes[p].checked);
      if (selected.length === 0) return;
      selectedPools = selected;
      savePools(selectedPools);
      startRound();
    });
    wrapper.appendChild(startBtn);

    container.appendChild(wrapper);
  }

  // ═══ Practice ═══

  function startRound(): void {
    currentFormula = pickRandom(formulas, selectedPools);
    // Each algorithm is a candidate; expand double turns into two single turns.
    candidates = algorithmsOf(currentFormula).map(expandToSingles);
    userMoves = [];
    skipped = false;
    onPickFormula(currentFormula);
    render();
  }

  function renderPractice(): void {
    if (!currentFormula) {
      startRound();
      return;
    }

    const done = isComplete();

    // Top bar
    const topBar = document.createElement('div');
    topBar.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 12px; flex-shrink: 0;';

    const badge = document.createElement('span');
    badge.textContent = categoryBadge(currentFormula.category);
    badge.style.cssText = `
      padding: 4px 10px; background: #e94560; color: #fff;
      border-radius: 4px; font-size: 12px; font-weight: 600;
    `;
    topBar.appendChild(badge);

    const formulaName = document.createElement('span');
    formulaName.textContent = currentFormula.name;
    formulaName.style.cssText = 'font-size: 13px; color: #aaa; flex: 1;';
    topBar.appendChild(formulaName);

    // Settings gear
    const gearBtn = document.createElement('button');
    gearBtn.textContent = '⚙';
    gearBtn.title = '修改公式池';
    gearBtn.style.cssText = `
      width: 32px; height: 32px; border: none; border-radius: 6px;
      cursor: pointer; font-size: 16px; background: #0f3460; color: #aaa;
      display: flex; align-items: center; justify-content: center;
    `;
    gearBtn.addEventListener('click', () => {
      selectedPools = [];
      currentFormula = null;
      savePools([]);
      render();
    });
    topBar.appendChild(gearBtn);

    // Exit button
    const exitBtn = document.createElement('button');
    exitBtn.textContent = '退出';
    exitBtn.style.cssText = `
      padding: 6px 12px; border: none; border-radius: 6px; cursor: pointer;
      font-size: 12px; background: #0f3460; color: #aaa;
    `;
    exitBtn.addEventListener('click', () => onExit());
    topBar.appendChild(exitBtn);

    container.appendChild(topBar);

    // Progress display: completed moves as green tokens (count shown, no fixed total
    // because alternative algorithms may differ in length).
    const progress = document.createElement('div');
    progress.style.cssText = `
      display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
      margin-bottom: 12px; flex-shrink: 0; min-height: 28px;
    `;
    const progressLabel = document.createElement('span');
    progressLabel.textContent = `${userMoves.length} 步`;
    progressLabel.style.cssText = 'font-size: 13px; color: #aaa; font-weight: 600; margin-right: 6px;';
    progress.appendChild(progressLabel);

    for (const m of userMoves) {
      const token = document.createElement('span');
      token.textContent = moveLabel(m);
      token.style.cssText = 'color: #4caf50; font-weight: 600; font-size: 13px;';
      progress.appendChild(token);
    }
    container.appendChild(progress);

    // Revealed formulas (only when skipped): show primary + alternatives.
    if (skipped) {
      const reveal = document.createElement('div');
      reveal.style.cssText = `
        padding: 8px 12px; background: #0f3460; border-radius: 6px;
        font-family: monospace; font-size: 13px; flex-shrink: 0;
        display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px;
      `;
      algorithmsOf(currentFormula).forEach((alg, i) => {
        const line = document.createElement('div');
        line.textContent = `${i === 0 ? '主' : '变' + i}: ${alg}`;
        line.style.cssText = `color: ${i === 0 ? '#ff9800' : '#ffd180'};`;
        reveal.appendChild(line);
      });
      container.appendChild(reveal);
    }

    // Move buttons
    const btnArea = document.createElement('div');
    btnArea.style.cssText = 'display: flex; flex-direction: column; gap: 6px; flex: 1; overflow-y: auto; min-height: 0;';
    for (const row of MOVE_BUTTONS) {
      const rowDiv = document.createElement('div');
      rowDiv.style.cssText = 'display: flex; gap: 4px;';
      for (const mb of row) {
        const btn = document.createElement('button');
        btn.textContent = mb.label;
        btn.style.cssText = `
          flex: 1; padding: 10px 4px; border: none; border-radius: 6px;
          cursor: pointer; font-size: 13px; font-weight: 600;
          background: #0f3460; color: #e0e0e0;
          transition: background 0.15s, color 0.15s;
        `;
        btn.addEventListener('click', () => handleMoveInput(mb, btn));
        rowDiv.appendChild(btn);
      }
      btnArea.appendChild(rowDiv);
    }
    container.appendChild(btnArea);

    // Bottom action row
    const actionRow = document.createElement('div');
    actionRow.style.cssText = 'display: flex; gap: 8px; margin-top: 12px; flex-shrink: 0;';

    if (!done && !skipped) {
      const skipBtn = document.createElement('button');
      skipBtn.textContent = '显示答案';
      skipBtn.style.cssText = `
        flex: 1; padding: 10px; border: none; border-radius: 6px;
        cursor: pointer; font-size: 13px; background: #0f3460; color: #aaa;
      `;
      skipBtn.addEventListener('click', () => {
        skipped = true;
        render();
      });
      actionRow.appendChild(skipBtn);
    }

    if (done || skipped) {
      const nextBtn = document.createElement('button');
      nextBtn.textContent = skipped ? '下一题' : '✓ 正确！下一题';
      nextBtn.style.cssText = `
        flex: 1; padding: 10px; border: none; border-radius: 6px;
        cursor: pointer; font-size: 14px; font-weight: 600;
        background: ${skipped ? '#0f3460' : '#4caf50'};
        color: ${skipped ? '#aaa' : '#fff'};
      `;
      nextBtn.addEventListener('click', () => startRound());
      actionRow.appendChild(nextBtn);
    }

    container.appendChild(actionRow);

    // Completion message
    if (done && !skipped) {
      const msg = document.createElement('div');
      msg.textContent = '🎉 正确！';
      msg.style.cssText = 'text-align: center; color: #4caf50; font-weight: 600; font-size: 14px; margin-top: 8px; flex-shrink: 0;';
      container.appendChild(msg);
    }
  }

  // ═══ Move input ═══

  function handleMoveInput(mb: MoveButton, btnEl: HTMLButtonElement): void {
    if (skipped || isComplete()) return;

    const input: Move = { base: mb.base, dir: mb.dir };
    const tentative = [...userMoves, input];

    // Accept if any candidate algorithm has the tentative sequence as a prefix.
    const ok = candidates.some((c) => isPrefix(tentative, c));
    if (ok) {
      userMoves = tentative;
      onCorrectMove(input);
      if (isComplete()) {
        onComplete();
      }
      render();
    } else {
      // Wrong move: flash red briefly.
      const origBg = btnEl.style.background;
      btnEl.style.color = '#fff';
      btnEl.style.background = '#e94560';
      setTimeout(() => {
        btnEl.style.background = origBg;
        btnEl.style.color = '#e0e0e0';
      }, 300);
    }
  }

  render();
}
