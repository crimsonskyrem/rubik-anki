import * as THREE from 'three';
import { SquareRenderer } from './cube/SquareRenderer';
import { Rotator, hitToFace } from './cube/Rotator';
import { OrbitController } from './interaction/OrbitController';
import { buildFormulaPanel } from './ui/FormulaPanel';
import { getAllFormulas } from './cfop/data';
import type { Formula } from './cfop/types';
import { solvedState, applyMove, applyAlgorithm, type StickerState } from './cube/CubeState';
import { parseAlgorithm, type Face, type Move } from './cube/algorithm';

// ═══ State ═══

let renderer: SquareRenderer;
let rotator: Rotator;
let container: HTMLElement;

/** Single source of truth for the cube (immutable; reassigned on each move). */
let state: StickerState[] = solvedState();

/** A queued animated quarter-turn. dir 2 is split into two dir-1 turns. */
interface QueuedMove { face: Face; dir: 1 | -1; normal: THREE.Vector3 }
let moveQueue: QueuedMove[] = [];
let pendingFormula: Formula | null = null;

/** Auto-play toggle. ON: animate the full solve after snapping. OFF: step manually. */
let autoPlay = true;

/** Face outward normal in Cube local space (view-layer adapter for the Rotator). */
const MOVE_TO_NORMAL: Record<Face, THREE.Vector3> = {
  U: new THREE.Vector3(0, 1, 0),
  D: new THREE.Vector3(0, -1, 0),
  R: new THREE.Vector3(1, 0, 0),
  L: new THREE.Vector3(-1, 0, 0),
  F: new THREE.Vector3(0, 0, 1),
  B: new THREE.Vector3(0, 0, -1),
};

/** Derive a Face from an outward normal (inverse of MOVE_TO_NORMAL). */
function faceFromNormal(normal: THREE.Vector3): Face {
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

// ═══ Init ═══

export function initApp(): void {
  container = document.getElementById('cube-container')!;
  renderer = new SquareRenderer(container);
  rotator = new Rotator(renderer.squares);

  // Establish the invariant: displayed cube === state.
  renderer.sync(state);

  const controller = new OrbitController(renderer);
  controller.onClick((e: MouseEvent) => handleClick(e));

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
  const face = faceFromNormal(normal);
  rotator.startRotation(normal, dir, () => {
    state = applyMove(state, { face, dir });
    renderer.sync(state);
  });
}

// ═══ Formula animation ═══

/** Play one queued move (animate + commit to model). No-op if rotating or queue empty. */
function playNextMove(): void {
  if (rotator.isRotating || moveQueue.length === 0) return;
  const move = moveQueue.shift()!;
  rotator.startRotation(move.normal, move.dir, () => {
    // Commit the move to the model, then sync the view (exact, drift-free).
    state = applyMove(state, { face: move.face, dir: move.dir });
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
  const normal = MOVE_TO_NORMAL[move.face];
  if (move.dir === 2) {
    moveQueue.push({ face: move.face, dir: 1, normal: normal.clone() });
    moveQueue.push({ face: move.face, dir: 1, normal: normal.clone() });
  } else {
    moveQueue.push({ face: move.face, dir: move.dir, normal: normal.clone() });
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
  // Snap to the pattern (the state this formula solves) with NO animation,
  // then enqueue the solving algorithm. Auto-play drains it; manual mode
  // waits for step() clicks. Either way: pattern -> solved.
  state = applyAlgorithm(solvedState(), formula.inverse);
  renderer.sync(state);

  for (const move of parseAlgorithm(formula.algorithm)) {
    enqueueMove(move);
  }
}
