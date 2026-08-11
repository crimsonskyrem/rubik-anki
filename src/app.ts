import * as THREE from 'three';
import { SquareRenderer } from './cube/SquareRenderer';
import { Rotator, hitToFace } from './cube/Rotator';
import { OrbitController } from './interaction/OrbitController';
import { buildFormulaPanel } from './ui/FormulaPanel';
import { buildAnkiPanel, type AnkiHandlers } from './anki/AnkiPanel';
import { getAllFormulas, algorithmsOf } from './cfop/data';
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
let pendingAlgIndex = 0;

/** The active formula session (browse mode) — used to restart after manual turns. */
let currentFormula: Formula | null = null;
let currentAlgIndex = 0;
/** True once the user manually turned a layer, diverging state from the active session. */
let manualTurn = false;
/** Auto-play toggle. ON: animate the full solve after snapping. OFF: step manually. */
let autoPlay = false;

/** App mode: browse (original) or anki (memory practice). */
let appMode: 'browse' | 'anki' = 'browse';

/** Whether anki mode is active — used by the animation loop to drain move queue. */
let ankiActive = false;

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
  rotator = new Rotator(renderer.cubies);

  // Establish the invariant: displayed cube === state.
  renderer.sync(state);

  const controller = new OrbitController(renderer.cubeGroup, renderer.camera);
  controller.bindCanvas(renderer.renderer.domElement);
  controller.onClick((e: MouseEvent) => handleClick(e));

  // Reset/lock button (icon style, bottom-right of cube-container)
  const resetBtn = document.createElement('button');
  resetBtn.textContent = '⟳';
  resetBtn.title = '点击重置魔方，再次点击锁定';
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
      setBtnStyle('rgba(15, 52, 96, 0.7)', '#aaa', '点击重置魔方，再次点击锁定');
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
      setBtnStyle('rgba(233, 69, 96, 0.7)', '#fff', '再次点击锁定魔方');
      pendingTimer = setTimeout(() => {
        pendingTimer = null;
        btnState = 0;
        setBtnStyle('rgba(15, 52, 96, 0.7)', '#aaa', '点击重置魔方，再次点击锁定');
      }, 1000);
    }
  });
  container.appendChild(resetBtn);

  // Anki mode button
  const ankiBtn = document.createElement('button');
  ankiBtn.textContent = 'A';
  ankiBtn.title = 'Anki 记忆模式';
  ankiBtn.style.cssText = `
    position: absolute; bottom: 16px; right: 64px; z-index: 10;
    width: 40px; height: 40px; border: none; border-radius: 50%;
    cursor: pointer; font-size: 16px; font-weight: 700; line-height: 1;
    background: rgba(15, 52, 96, 0.7); color: #aaa;
    display: flex; align-items: center; justify-content: center;
    backdrop-filter: blur(4px);
    transition: background 0.2s, color 0.2s;
  `;
  ankiBtn.addEventListener('click', () => {
    if (appMode === 'anki') {
      appMode = 'browse';
      ankiActive = false;
      moveQueue = [];
      manualTurn = false;
      state = solvedState();
      renderer.sync(state);
      ankiBtn.style.background = 'rgba(15, 52, 96, 0.7)';
      ankiBtn.style.color = '#aaa';
    } else {
      appMode = 'anki';
      ankiActive = true;
      manualTurn = false;
      ankiBtn.style.background = 'rgba(233, 69, 96, 0.7)';
      ankiBtn.style.color = '#fff';
    }
    buildPanel();
  });
  container.appendChild(ankiBtn);

  // Panel
  const panelContainer = document.getElementById('panel-container')!;
  panelContainer.style.display = 'flex';
  panelContainer.style.flexDirection = 'column';
  panelContainer.style.overflow = 'hidden';
  const formulas = getAllFormulas();

  // Panel content
  const panelContent = document.createElement('div');
  panelContent.style.cssText = 'display: flex; flex-direction: column; flex: 1; overflow: hidden; min-height: 0;';
  panelContainer.appendChild(panelContent);

  function buildPanel(): void {
    panelContent.innerHTML = '';
    if (appMode === 'browse') {
      buildFormulaPanel(panelContent, formulas, {
        onSelect: (formula: Formula, algIndex: number) => applyFormula(formula, algIndex),
        onToggleAutoPlay: (next: boolean) => { autoPlay = next; },
        onStep: () => step(),
      });
    } else {
      const ankiHandlers: AnkiHandlers = {
        onPickFormula: (formula: Formula) => {
          moveQueue = [];
          manualTurn = false;
          state = applyAlgorithm(solvedState(), formula.inverse);
          renderer.sync(state);
        },
        onCorrectMove: (move: Move) => {
          enqueueMove(move);
        },
        onComplete: () => {
          // panel handles UI feedback
        },
        onExit: () => {
          appMode = 'browse';
          ankiActive = false;
          moveQueue = [];
          manualTurn = false;
          state = solvedState();
          renderer.sync(state);
          ankiBtn.style.background = 'rgba(15, 52, 96, 0.7)';
          ankiBtn.style.color = '#aaa';
          buildPanel();
        },
        isSessionDirty: () => manualTurn,
      };
      buildAnkiPanel(panelContent, formulas, ankiHandlers);
    }
  }
  buildPanel();

  // Animation loop
  function animate(): void {
    requestAnimationFrame(animate);

    // Process rotation animation
    rotator.update();

    // Auto-play drains the queue each frame; anki mode also drains it.
    if (autoPlay || ankiActive) playNextMove();

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
    // Manual turn diverges state from the active formula session; next step restarts it.
    manualTurn = true;
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
    // After each move: if queue empty & pending formula, apply it (browse mode only)
    if (moveQueue.length === 0 && pendingFormula && !ankiActive) {
      const f = pendingFormula;
      const idx = pendingAlgIndex;
      pendingFormula = null;
      pendingAlgIndex = 0;
      applyFormulaNow(f, idx);
    }
  });
}

/** Manual step: advance one move. Only acts when auto-play is off. */
function step(): void {
  if (autoPlay) return;
  if (manualTurn && currentFormula) {
    // State was manually rotated: restart the formula so the steps can restore the cube.
    applyFormula(currentFormula, currentAlgIndex);
    return;
  }
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

function applyFormula(formula: Formula, algIndex = 0): void {
  moveQueue = [];
  currentFormula = formula;
  currentAlgIndex = algIndex;
  manualTurn = false;

  if (rotator.isRotating) {
    pendingFormula = formula;
    pendingAlgIndex = algIndex;
    return;
  }

  applyFormulaNow(formula, algIndex);
}

function applyFormulaNow(formula: Formula, algIndex = 0): void {
  state = applyAlgorithm(solvedState(), formula.inverse);
  renderer.sync(state);
  const alg = algorithmsOf(formula)[algIndex] ?? formula.algorithm;
  for (const move of parseAlgorithm(alg)) {
    enqueueMove(move);
  }
}
