import type { Formula } from '../cfop/types';

/** Callbacks the panel fires into the app. */
export interface PanelHandlers {
  /** A formula was selected: snap to its pattern (and auto-play if enabled). */
  onSelect: (formula: Formula) => void;
  /** The auto-play toggle changed. `next` is the new state (true = auto). */
  onToggleAutoPlay: (next: boolean) => void;
  /** The algorithm display was clicked: advance one step (manual mode). */
  onStep: () => void;
}

/**
 * Build the formula selection panel in the given container.
 *
 * Layout (top to bottom): title, category tabs, control row
 * (auto-play toggle + clickable algorithm display), formula list.
 */
export function buildFormulaPanel(
  container: HTMLElement,
  formulas: Formula[],
  handlers: PanelHandlers,
): void {
  const { onSelect, onToggleAutoPlay, onStep } = handlers;

  const categories: Array<{ key: Formula['category']; label: string }> = [
    { key: 'cross', label: 'Cross' },
    { key: 'f2l', label: 'F2L' },
    { key: 'oll', label: 'OLL' },
    { key: 'pll', label: 'PLL' },
  ];

  let activeCategory: Formula['category'] = 'cross';
  let autoPlay = false;
  let currentAlgorithm = '';

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
  algDisplay.id = 'algorithm-display';
  algDisplay.style.cssText = `
    flex: 1; padding: 10px 12px; background: #0f3460; border-radius: 6px;
    font-family: monospace; font-size: 15px; text-align: center; min-height: 44px;
    cursor: pointer; transition: background 0.15s;
    display: flex; align-items: center; justify-content: center;
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

  function updateAlgDisplay(): void {
    if (!currentAlgorithm) {
      algDisplay.textContent = '选择一个公式开始';
      return;
    }
    algDisplay.textContent = autoPlay
      ? currentAlgorithm
      : `${currentAlgorithm}  （点击逐步执行）`;
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
      `;
      item.textContent = f.name;
      item.title = f.description || f.algorithm;

      item.addEventListener('click', () => {
        // Deselect all others (clear inline background so CSS class takes over)
        listContainer.querySelectorAll('.selected').forEach((el) => {
          el.classList.remove('selected');
          (el as HTMLElement).style.background = '';
        });
        // Select this one (background handled by .selected CSS rule)
        item.classList.add('selected');

        currentAlgorithm = f.algorithm;
        updateAlgDisplay();
        onSelect(f);
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
}
