import type { Formula } from '../cfop/types';
import { algorithmsOf } from '../cfop/data';
import { parseAlgorithm } from '../cube/algorithm';

export interface AlgToken { label: string; played: boolean }

/** Per-token play state: a token is "played" once all its quarter-turns are done (dir 2 needs two). */
export function tokenStates(alg: string, played: number): AlgToken[] {
  let cum = 0;
  return parseAlgorithm(alg).map((m) => {
    cum += m.dir === 2 ? 2 : 1;
    const suffix = m.dir === -1 ? "'" : m.dir === 2 ? '2' : '';
    return { label: m.base + suffix, played: cum <= played };
  });
}
/** Callbacks the panel fires into the app. */
export interface PanelHandlers {
  /** A formula (and which algorithm index) was selected: snap to its pattern (and auto-play if enabled). */
  onSelect: (formula: Formula, algIndex: number) => void;
  /** The auto-play toggle changed. `next` is the new state (true = auto). */
  onToggleAutoPlay: (next: boolean) => void;
  /** The algorithm display was clicked: advance one step (manual mode). */
  onStep: () => void;
}

/**
 * Build the formula selection panel in the given container.
 *
 * Layout (top to bottom): title, category tabs, control row
 * (auto-play toggle + clickable algorithm display), optional algorithm
 * variant selector, formula list.
 */
export interface FormulaPanelHandle {
  /** Re-render the algorithm display with `played` completed moves. */
  setProgress(played: number): void;
}
export function buildFormulaPanel(
  container: HTMLElement,
  formulas: Formula[],
  handlers: PanelHandlers,
): FormulaPanelHandle {
  const { onSelect, onToggleAutoPlay, onStep } = handlers;

  const categories: Array<{ key: Formula['category']; label: string }> = [
    { key: 'cross', label: 'Cross' },
    { key: 'f2l', label: 'F2L' },
    { key: 'oll', label: 'OLL' },
    { key: 'pll', label: 'PLL' },
  ];

  let activeCategory: Formula['category'] = 'cross';
  let autoPlay = false;
  let currentFormula: Formula | null = null;
  let currentAlgIndex = 0;
  /** Moves completed for the current formula (pushed by the app after each step). */
  let playedSteps = 0;
  // Container flex layout: header fixed, list scrolls
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.overflow = 'hidden';

  // Sticky header: tabs + auto-play toggle + algorithm display
  const header = document.createElement('div');
  header.style.cssText = 'margin-bottom: 12px; flex-shrink: 0;';
  container.appendChild(header);

  // Tab bar
  const tabBar = document.createElement('div');
  tabBar.style.cssText = 'display: flex; gap: 4px; margin-bottom: 8px;';
  header.appendChild(tabBar);

  // Control row
  const controlRow = document.createElement('div');
  controlRow.style.cssText = 'display: flex; gap: 8px; align-items: stretch;';
  header.appendChild(controlRow);

  // Auto-play toggle
  const autoPlayBtn = document.createElement('button');
  function renderAutoPlayBtn(): void {
    autoPlayBtn.textContent = '自动播放';
    autoPlayBtn.style.cssText = `
      padding: 8px 12px; border: none; border-radius: 6px; cursor: pointer;
      font-size: 13px; font-weight: 600; transition: background 0.2s; white-space: nowrap;
      background: ${autoPlay ? '#e94560' : '#0f3460'};
      color: ${autoPlay ? '#fff' : '#aaa'};
    `;
  }
  renderAutoPlayBtn();
  autoPlayBtn.addEventListener('click', () => {
    autoPlay = !autoPlay;
    renderAutoPlayBtn();
    onToggleAutoPlay(autoPlay);
    updateAlgDisplay();
  });
  controlRow.appendChild(autoPlayBtn);

  // Algorithm display (clickable: advances one step in manual mode)
  const algDisplay = document.createElement('div');
  algDisplay.style.cssText = `
    flex: 1; padding: 10px 12px; background: #0f3460; border-radius: 6px;
    font-family: monospace; font-size: 15px; text-align: center; min-height: 44px;
    cursor: pointer; transition: background 0.15s;
    display: flex; align-items: center; overflow-x: auto;
  `;
  algDisplay.textContent = '选择一个公式开始';
  algDisplay.addEventListener('click', () => onStep());
  algDisplay.addEventListener('mouseenter', () => {
    algDisplay.style.background = '#162d50';
  });
  algDisplay.addEventListener('mouseleave', () => {
    algDisplay.style.background = '#0f3460';
  });
  controlRow.appendChild(algDisplay);

  // Algorithm variant selector (only when the selected formula has alternatives)
  const variantBar = document.createElement('div');
  variantBar.style.cssText = 'display: flex; gap: 4px; margin-bottom: 8px;';
  header.appendChild(variantBar);

  function currentAlgorithm(): string {
    return currentFormula ? algorithmsOf(currentFormula)[currentAlgIndex] : '';
  }

  function updateAlgDisplay(): void {
    const alg = currentAlgorithm();
    if (!alg) {
      algDisplay.textContent = '选择一个公式开始';
      return;
    }
    algDisplay.innerHTML = '';
    // Inner wrapper: margin auto keeps short formulas centered, long ones scroll from the left.
    const inner = document.createElement('div');
    inner.style.cssText = 'display: flex; align-items: center; margin: 0 auto;';
    for (const t of tokenStates(alg, playedSteps)) {
      const span = document.createElement('span');
      span.textContent = t.label;
      span.style.margin = '0 4px';
      if (t.played) span.style.color = '#4caf50';
      inner.appendChild(span);
    }
    algDisplay.appendChild(inner);
  }

  function renderVariants(): void {
    variantBar.innerHTML = '';
    if (!currentFormula || currentFormula.alternatives.length === 0) return;
    const algs = algorithmsOf(currentFormula);
    algs.forEach((_, i) => {
      const tab = document.createElement('button');
      tab.textContent = i === 0 ? '主解法' : `变体 ${i}`;
      tab.style.cssText = `
        flex: 1; padding: 6px 4px; border: none; border-radius: 6px;
        cursor: pointer; font-size: 12px; font-weight: 600; transition: background 0.2s;
        background: ${i === currentAlgIndex ? '#e94560' : '#0f3460'};
        color: ${i === currentAlgIndex ? '#fff' : '#aaa'};
      `;
      tab.addEventListener('click', () => {
        currentAlgIndex = i;
        renderVariants();
        updateAlgDisplay();
        onSelect(currentFormula!, i);
      });
      variantBar.appendChild(tab);
    });
  }

  // Formula list (scrollable)
  const listContainer = document.createElement('div');
  listContainer.id = 'formula-list';
  listContainer.style.cssText = 'display: flex; flex-direction: column; gap: 8px; flex: 1; overflow-y: auto; min-height: 0;';
  container.appendChild(listContainer);

  function renderTabs(): void {
    tabBar.innerHTML = '';
    for (const cat of categories) {
      const tab = document.createElement('button');
      tab.textContent = cat.label;
      tab.style.cssText = `
        flex: 1; padding: 8px 4px; border: none; border-radius: 6px;
        cursor: pointer; font-size: 13px; font-weight: 600; transition: background 0.2s;
        background: ${activeCategory === cat.key ? '#e94560' : '#0f3460'};
        color: ${activeCategory === cat.key ? '#fff' : '#aaa'};
      `;
      tab.addEventListener('click', () => {
        activeCategory = cat.key;
        renderTabs();
        renderList();
      });
      tabBar.appendChild(tab);
    }
  }

  function renderList(): void {
    listContainer.innerHTML = '';
    const filtered = formulas.filter((f) => f.category === activeCategory);
    for (const f of filtered) {
      const item = document.createElement('div');
      item.style.cssText = `
        padding: 10px 12px; background: #0f3460; border-radius: 6px;
        cursor: pointer; transition: background 0.15s; font-size: 13px;
        display: flex; align-items: center; justify-content: space-between; gap: 8px;
      `;
      const nameSpan = document.createElement('span');
      nameSpan.textContent = f.name;
      item.appendChild(nameSpan);

      if (f.alternatives.length > 0) {
        const badge = document.createElement('span');
        badge.textContent = `${f.alternatives.length + 1} 解法`;
        badge.style.cssText = 'font-size: 11px; color: #e94560; font-weight: 600; flex-shrink: 0;';
        item.appendChild(badge);
      }
      item.title = f.description || f.algorithm;

      item.addEventListener('click', () => {
        // Deselect all others (clear inline background so CSS class takes over)
        listContainer.querySelectorAll('.selected').forEach((el) => {
          el.classList.remove('selected');
          (el as HTMLElement).style.background = '';
        });
        // Select this one (background handled by .selected CSS rule)
        item.classList.add('selected');

        currentFormula = f;
        currentAlgIndex = 0;
        renderVariants();
        updateAlgDisplay();
        onSelect(f, 0);
      });

      item.addEventListener('mouseenter', () => {
        if (!item.classList.contains('selected')) {
          item.style.background = '#162d50';
        }
      });
      item.addEventListener('mouseleave', () => {
        if (!item.classList.contains('selected')) {
          item.style.background = '#0f3460';
        }
      });

      listContainer.appendChild(item);
    }
  }

  // Selected class style
  const style = document.createElement('style');
  style.textContent = '.selected { background: #e94560 !important; }';
  container.appendChild(style);

  renderTabs();
  renderList();

  return {
    /** Re-render the algorithm display with `played` completed moves. */
    setProgress(played: number): void { playedSteps = played; updateAlgDisplay(); },
  };
}
