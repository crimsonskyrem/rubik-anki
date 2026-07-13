import * as THREE from 'three';
import { SquareRenderer } from './cube/SquareRenderer';
import { Rotator, hitToFace } from './cube/Rotator';
import { OrbitController } from './interaction/OrbitController';
import { buildFormulaPanel } from './ui/FormulaPanel';
import { getAllFormulas } from './cfop/data';
import type { Formula } from './cfop/types';

// ═══ State ═══

let renderer: SquareRenderer;
let rotator: Rotator;
let container: HTMLElement;

/** Formula animation queue: pending moves to animate */
interface QueuedMove { normal: THREE.Vector3; dir: 1 | -1 }
let moveQueue: QueuedMove[] = [];
let pendingFormula: Formula | null = null;

// ═══ Init ═══

export function initApp(): void {
  container = document.getElementById('cube-container')!;
  renderer = new SquareRenderer(container);
  rotator = new Rotator(renderer.squares);

  const controller = new OrbitController(renderer);
  controller.onClick((e: MouseEvent) => handleClick(e));

  // Formula panel
  const panelContainer = document.getElementById('panel-container')!;
  const formulas = getAllFormulas();
  buildFormulaPanel(panelContainer, formulas, (formula: Formula) => {
    applyFormula(formula);
  });

  // Animation loop
  function animate(): void {
    requestAnimationFrame(animate);

    // Process rotation animation
    rotator.update();

    // Process formula move queue
    if (!rotator.isRotating && moveQueue.length > 0) {
      const move = moveQueue.shift()!;
      rotator.startRotation(move.normal, move.dir, () => {
        // After each move: if queue empty & pending formula, apply it
        if (moveQueue.length === 0 && pendingFormula) {
          const f = pendingFormula;
          pendingFormula = null;
          applyFormulaNow(f);
        }
      });
    }

    renderer.render();
  }
  animate();
}

// ═══ Click-to-rotate ═══

function handleClick(e: MouseEvent): void {
  if (rotator.isRotating) return;

  const square = renderer.getIntersection(e.clientX, e.clientY, container);
  if (!square) return;

  const { normal, dir } = hitToFace(square);
  rotator.startRotation(normal, dir);
}

// ═══ Formula animation ═══

/** Map move letter to face normal in Cube local space */
const MOVE_TO_NORMAL: Record<string, THREE.Vector3> = {
  U: new THREE.Vector3(0, 1, 0),
  D: new THREE.Vector3(0, -1, 0),
  R: new THREE.Vector3(1, 0, 0),
  L: new THREE.Vector3(-1, 0, 0),
  F: new THREE.Vector3(0, 0, 1),
  B: new THREE.Vector3(0, 0, -1),
};

function parseAlgorithm(alg: string): QueuedMove[] {
  const result: QueuedMove[] = [];
  const tokens = alg.trim().split(/\s+/);
  for (const token of tokens) {
    if (!token) continue;
    const match = token.match(/^([URFDLB])([']|2)?$/i);
    if (!match) continue;
    const normal = MOVE_TO_NORMAL[match[1].toUpperCase()];
    if (!normal) continue;
    const suffix = match[2] || '';
    if (suffix === '2') {
      result.push({ normal: normal.clone(), dir: 1 });
      result.push({ normal: normal.clone(), dir: 1 });
    } else {
      result.push({ normal: normal.clone(), dir: suffix === "'" ? -1 : 1 });
    }
  }
  return result;
}

function applyFormula(formula: Formula): void {
  moveQueue = [];

  if (rotator.isRotating) {
    pendingFormula = formula;
    return;
  }

  applyFormulaNow(formula);
}

function applyFormulaNow(formula: Formula): void {
  renderer.resetToSolved();

  const moves = parseAlgorithm(formula.inverse);
  for (const m of moves) {
    moveQueue.push(m);
  }
}
