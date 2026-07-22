import * as THREE from 'three';
import { SquareRenderer } from './cube/SquareRenderer';
import { Rotator, hitToFace } from './cube/Rotator';
import { OrbitController } from './interaction/OrbitController';
import { buildFormulaPanel } from './ui/FormulaPanel';
import { getAllFormulas } from './cfop/data';
import type { Formula } from './cfop/types';
import { solvedState, applyMove, applyAlgorithm, getMoveDef, type StickerState } from './cube/CubeState';
import { parseAlgorithm, type MoveBase, type Move } from './cube/algorithm';

// ═══ State ═══

let renderer: SquareRenderer;
let rotator: Rotator;
let container: HTMLElement;

/** Single source of truth for the cube (immutable; reassigned on each move). */
let state: StickerState[] = solvedState();

/** A queued animated quarter-turn (dir 2 is split into two dir-1 turns). */
interface QueuedMove { move: { base: MoveBase; dir: 1 | -1 }; axis: THREE.Vector3; layers: number[] }
let moveQueue: QueuedMove[] = [];
let pendingFormula: Formula | null = null;

/** Auto-play toggle. ON: animate the full solve after snapping. OFF: step manually. */
let autoPlay = false;

/** Derive a face MoveBase from an outward normal (for click-to-rotate free play). */
function baseFromNormal(normal: THREE.Vector3): MoveBase {
  const x = Math.round(normal.x);
  const y = Math.round(normal.y);
  const z = Math.round(normal.z);
  if (y === 1) return 'U';
  if (y === -1) return 'D';
  if (x === 1) return 'R';
  if (x === -1) return 'L';
  if (z === 1) return 'F';
  return 'B';
}

/** Build a THREE axis vector from a MoveBase's MoveDef axis. */
function axisVec(base: MoveBase): THREE.Vector3 {
  const a = getMoveDef(base).axis;
  return new THREE.Vector3(a.x, a.y, a.z);
}

// ═══ Init ═══

export function initApp(): void {
  container = document.getElementById('cube-container')!;
  renderer = new SquareRenderer(container);
  rotator = new Rotator(renderer.squares);

  // Establish the invariant: displayed cube === state.
  renderer.sync(state);

  const controller = new OrbitController(renderer);
  controller.onClick((e: MouseEvent) => handleClick(e));

  // Reset/lock button (icon style, bottom-right of cube-container)
  const resetBtn = document.createElement('button');
  resetBtn.textContent = '⟳';
  resetBtn.title = '点击重置镜头，再次点击锁定';
  resetBtn.style.cssText = `
    position: absolute; bottom: 16px; right: 16px; z-index: 10;
    width: 40px; height: 40px; border: none; border-radius: 50%;
    cursor: pointer; font-size: 20px; line-height: 1;
    background: rgba(15, 52, 96, 0.7); color: #aaa;
    display: flex; align-items: center; justify-content: center;
    backdrop-filter: blur(4px);
    transition: background 0.2s, color 0.2s;
  `;
  let btnState: 0 | 1 | 2 = 0; // 0=default, 1=reset-pending, 2=locked
  let pendingTimer: ReturnType<typeof setTimeout> | null = null;
  function setBtnStyle(background: string, color: string, title: string): void {
    resetBtn.style.background = background;
    resetBtn.style.color = color;
    resetBtn.title = title;
  }
  resetBtn.addEventListener('click', () => {
    if (btnState === 2) {
      // Locked → unlock + reset
      clearTimeout(pendingTimer!);
      pendingTimer = null;
      btnState = 0;
      controller.setEnabled(true);
      controller.reset();
      setBtnStyle('rgba(15, 52, 96, 0.7)', '#aaa', '点击重置镜头，再次点击锁定');
    } else if (btnState === 1) {
      // Reset pending → lock
      clearTimeout(pendingTimer!);
      pendingTimer = null;
      btnState = 2;
      controller.setEnabled(false);
      setBtnStyle('rgba(255, 89, 0, 0.7)', '#fff', '已锁定，点击解锁');
    } else {
      // Default → reset + start 1s pending
      btnState = 1;
      controller.reset();
      controller.setEnabled(true);
      setBtnStyle('rgba(233, 69, 96, 0.7)', '#fff', '再次点击锁定镜头');
      pendingTimer = setTimeout(() => {
        pendingTimer = null;
        btnState = 0;
        setBtnStyle('rgba(15, 52, 96, 0.7)', '#aaa', '点击重置镜头，再次点击锁定');
      }, 1000);
    }
  });
  container.appendChild(resetBtn);

  // Formula panel
  const panelContainer = document.getElementById('panel-container')!;
  const formulas = getAllFormulas();
  buildFormulaPanel(panelContainer, formulas, {
    onSelect: (formula: Formula) => applyFormula(formula),
    onToggleAutoPlay: (next: boolean) => { autoPlay = next; },
    onStep: () => step(),
  });

  // Animation loop
  function animate(): void {
    requestAnimationFrame(animate);

    // Process rotation animation
    rotator.update();

    // Auto-play drains the queue each frame; manual mode steps via step()
    if (autoPlay) playNextMove();

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
  const base = baseFromNormal(normal);
  const move: Move = { base, dir };
  rotator.startRotation(axisVec(base), getMoveDef(base).layers, dir, () => {
    state = applyMove(state, move);
    renderer.sync(state);
  });
}

// ═══ Formula animation ═══

/** Play one queued move (animate + commit to model). No-op if rotating or queue empty. */
function playNextMove(): void {
  if (rotator.isRotating || moveQueue.length === 0) return;
  const q = moveQueue.shift()!;
  rotator.startRotation(q.axis, q.layers, q.move.dir, () => {
    // Commit the move to the model, then sync the view (exact, drift-free).
    state = applyMove(state, q.move);
    renderer.sync(state);
    // After each move: if queue empty & pending formula, apply it
    if (moveQueue.length === 0 && pendingFormula) {
      const f = pendingFormula;
      pendingFormula = null;
      applyFormulaNow(f);
    }
  });
}

/** Manual step: advance one move. Only acts when auto-play is off. */
function step(): void {
  if (autoPlay) return;
  playNextMove();
}

/** Split a Move into animated quarter-turns (dir 2 -> two dir-1 turns). */
function enqueueMove(move: Move): void {
  const axis = axisVec(move.base);
  const layers = getMoveDef(move.base).layers;
  if (move.dir === 2) {
    moveQueue.push({ move: { base: move.base, dir: 1 }, axis: axis.clone(), layers });
    moveQueue.push({ move: { base: move.base, dir: 1 }, axis: axis.clone(), layers });
  } else {
    moveQueue.push({ move: { base: move.base, dir: move.dir }, axis, layers });
  }
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
  state = applyAlgorithm(solvedState(), formula.inverse);
  renderer.sync(state);
  for (const move of parseAlgorithm(formula.algorithm)) {
    enqueueMove(move);
  }
}
