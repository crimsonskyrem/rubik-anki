import { Cube, parseAlgorithm } from './cube/Cube';
import { CubeRenderer } from './cube/renderer';
import { OrbitController } from './interaction/OrbitController';
import { buildFormulaPanel } from './ui/FormulaPanel';
import { getAllFormulas } from './cfop/data';
import type { Formula } from './cfop/types';

let renderer: CubeRenderer;
let cube: Cube;
let applyQueue: Array<[number, number]> = [];
let isPlaying = false;

export function initApp(): void {
  cube = new Cube();

  const container = document.getElementById('cube-container')!;
  renderer = new CubeRenderer(container);
  new OrbitController(renderer);

  renderer.syncFromCube(cube);

  const panelContainer = document.getElementById('panel-container')!;
  const formulas = getAllFormulas();
  buildFormulaPanel(panelContainer, formulas, (formula: Formula) => {
    applyFormula(formula);
  });

  function animate(): void {
    requestAnimationFrame(animate);
    // Process animation queue
    if (!renderer.isAnimating && applyQueue.length > 0) {
      const [face, dir] = applyQueue.shift()!;
      renderer.animateMove(face, dir as 1 | -1 | 2, cube);
    }
    if (applyQueue.length === 0 && isPlaying) {
      isPlaying = false;
    }
    renderer.render();
  }
  animate();
}

function applyFormula(formula: Formula): void {
  // Reset cube to solved state and show it
  cube.reset();
  // Snap cubies back to grid positions
  renderer.syncFromCube(cube);

  // Build the pattern by applying inverse algorithm
  cube.applyAlgorithm(formula.inverse);
  renderer.syncFromCube(cube);
}
