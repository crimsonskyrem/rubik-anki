import type { Formula } from '../cfop/types';

/**
 * Build the formula selection panel in the given container.
 */
export function buildFormulaPanel(
  container: HTMLElement,
  formulas: Formula[],
  onSelect: (formula: Formula) => void,
): void {
  const categories: Array<{ key: Formula['category']; label: string }> = [
    { key: 'cross', label: 'Cross' },
    { key: 'f2l', label: 'F2L' },
    { key: 'oll', label: 'OLL' },
    { key: 'pll', label: 'PLL' },
  ];

  let activeCategory: Formula['category'] = 'cross';

  // Title
  const title = document.createElement('h2');
  title.textContent = 'CFOP 公式';
  title.style.cssText = 'margin-bottom: 12px; font-size: 20px; color: #e94560;';
  container.appendChild(title);

  // Tab bar
  const tabBar = document.createElement('div');
  tabBar.style.cssText = 'display: flex; gap: 4px; margin-bottom: 16px;';
  container.appendChild(tabBar);

  // Formula list
  const listContainer = document.createElement('div');
  listContainer.id = 'formula-list';
  listContainer.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';
  container.appendChild(listContainer);

  // Algorithm display
  const algDisplay = document.createElement('div');
  algDisplay.id = 'algorithm-display';
  algDisplay.style.cssText =
    'margin-top: 16px; padding: 12px; background: #0f3460; border-radius: 8px; font-family: monospace; font-size: 16px; text-align: center; min-height: 48px;';
  algDisplay.textContent = '选择一个公式开始';
  container.appendChild(algDisplay);

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
        // Highlight selected
        listContainer.querySelectorAll('.selected').forEach((el) => el.classList.remove('selected'));
        item.classList.add('selected');
        item.style.background = '#e94560';

        // Update algorithm display
        algDisplay.textContent = f.algorithm;

        // Notify
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

  // Add selected class style
  const style = document.createElement('style');
  style.textContent = '.selected { background: #e94560 !important; }';
  container.appendChild(style);

  renderTabs();
  renderList();
}
