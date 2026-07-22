// ═══════════════════════════════════════════════════════════════════
//  CubeState - pure, immutable, Three.js-free sticker state model.
//
//  Single source of truth for cube state. applyMove is a pure
//  (state, move) -> state function using exact 90° cardinal rotations
//  (integer math, no floating-point drift). Supports 6 faces, wide
//  r/l, and middle slice M via a unified MOVE_DEF table.
// ═══════════════════════════════════════════════════════════════════

import { parseAlgorithm, type MoveBase, type Move } from './algorithm';

export type { MoveBase, Move } from './algorithm';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface StickerState {
  color: string;
  pos: Vec3;
  normal: Vec3;
}

/** Face sticker colors (only the 6 outer faces carry color). */
const FACE_COLORS: Record<'U' | 'D' | 'L' | 'R' | 'F' | 'B', string> = {
  U: '#ffd500', // yellow
  D: '#ffffff', // white
  L: '#ff5900', // orange
  R: '#b90000', // red
  F: '#0045f6', // blue
  B: '#009b48', // green
};

/** How a move base rotates the cube: axis + which coordinate the layers sit on + layer values. */
export interface MoveDef {
  axis: Vec3;
  axisIdx: 'x' | 'y' | 'z';
  layers: number[];
}

/**
 * Unified move table. Face entries use standard CW-from-outside notation
 * (dir 1 = a quarter turn CW viewed from that face). Wide/slice compose
 * consistently: r = R + M' (layers {0,1}), l = L + M (layers {-1,0}),
 * M = middle slice, L direction (layer {0}).
 */
const MOVE_DEF: Record<MoveBase, MoveDef> = {
  U: { axis: { x: 0, y: -1, z: 0 }, axisIdx: 'y', layers: [1] },
  D: { axis: { x: 0, y: 1, z: 0 }, axisIdx: 'y', layers: [-1] },
  R: { axis: { x: -1, y: 0, z: 0 }, axisIdx: 'x', layers: [1] },
  L: { axis: { x: 1, y: 0, z: 0 }, axisIdx: 'x', layers: [-1] },
  F: { axis: { x: 0, y: 0, z: -1 }, axisIdx: 'z', layers: [1] },
  B: { axis: { x: 0, y: 0, z: 1 }, axisIdx: 'z', layers: [-1] },
  r: { axis: { x: -1, y: 0, z: 0 }, axisIdx: 'x', layers: [0, 1] },
  l: { axis: { x: 1, y: 0, z: 0 }, axisIdx: 'x', layers: [-1, 0] },
  M: { axis: { x: 1, y: 0, z: 0 }, axisIdx: 'x', layers: [0] },
  x: { axis: { x: -1, y: 0, z: 0 }, axisIdx: 'x', layers: [-1, 0, 1] },
  y: { axis: { x: 0, y: -1, z: 0 }, axisIdx: 'y', layers: [-1, 0, 1] },
};

export function getMoveDef(base: MoveBase): MoveDef {
  return MOVE_DEF[base];
}

const ORDER = 3;
const SIZE = 1;
const BORDER = (ORDER * SIZE) / 2 - 0.5; // 1.0
const FACE_OFFSET = BORDER + SIZE * 0.5; // 1.5

function cloneVec(v: Vec3): Vec3 {
  return { x: v.x, y: v.y, z: v.z };
}

function cloneSticker(s: StickerState): StickerState {
  return { color: s.color, pos: cloneVec(s.pos), normal: cloneVec(s.normal) };
}

/** Collapse -0 to +0 so the model produces clean integers (0 === -0 is true). */
function norm(n: number): number {
  return n === 0 ? 0 : n;
}

/**
 * Rotate v by +90° around a unit cardinal axis.
 * Rodrigues with cos=0, sin=+1: v' = (axis × v) + axis·(axis·v).
 * Exact integer arithmetic for cardinal axes/positions.
 */
function rotate90(v: Vec3, axis: Vec3): Vec3 {
  const cross: Vec3 = {
    x: axis.y * v.z - axis.z * v.y,
    y: axis.z * v.x - axis.x * v.z,
    z: axis.x * v.y - axis.y * v.x,
  };
  const dot = axis.x * v.x + axis.y * v.y + axis.z * v.z;
  return {
    x: norm(cross.x + axis.x * dot),
    y: norm(cross.y + axis.y * dot),
    z: norm(cross.z + axis.z * dot),
  };
}

/** Build the 54 stickers of a solved cube. */
export function solvedState(): StickerState[] {
  const elements: StickerState[] = [];

  // U face (+y) - yellow
  for (let x = -BORDER; x <= BORDER; x += SIZE) {
    for (let z = -BORDER; z <= BORDER; z += SIZE) {
      elements.push({ color: FACE_COLORS.U, pos: { x, y: FACE_OFFSET, z }, normal: { x: 0, y: 1, z: 0 } });
    }
  }
  // D face (-y) - white
  for (let x = -BORDER; x <= BORDER; x += SIZE) {
    for (let z = -BORDER; z <= BORDER; z += SIZE) {
      elements.push({ color: FACE_COLORS.D, pos: { x, y: -FACE_OFFSET, z }, normal: { x: 0, y: -1, z: 0 } });
    }
  }
  // L face (-x) - orange
  for (let y = -BORDER; y <= BORDER; y += SIZE) {
    for (let z = -BORDER; z <= BORDER; z += SIZE) {
      elements.push({ color: FACE_COLORS.L, pos: { x: -FACE_OFFSET, y, z }, normal: { x: -1, y: 0, z: 0 } });
    }
  }
  // R face (+x) - red
  for (let y = -BORDER; y <= BORDER; y += SIZE) {
    for (let z = -BORDER; z <= BORDER; z += SIZE) {
      elements.push({ color: FACE_COLORS.R, pos: { x: FACE_OFFSET, y, z }, normal: { x: 1, y: 0, z: 0 } });
    }
  }
  // F face (+z) - blue
  for (let x = -BORDER; x <= BORDER; x += SIZE) {
    for (let y = -BORDER; y <= BORDER; y += SIZE) {
      elements.push({ color: FACE_COLORS.F, pos: { x, y, z: FACE_OFFSET }, normal: { x: 0, y: 0, z: 1 } });
    }
  }
  // B face (-z) - green
  for (let x = -BORDER; x <= BORDER; x += SIZE) {
    for (let y = -BORDER; y <= BORDER; y += SIZE) {
      elements.push({ color: FACE_COLORS.B, pos: { x, y, z: -FACE_OFFSET }, normal: { x: 0, y: 0, z: -1 } });
    }
  }

  return elements;
}

/**
 * Apply a move to a state, returning a NEW state (immutable).
 * Stickers whose cubie center lies in one of the move's layers are
 * rotated (dir × 90°) around the move axis; all stickers are deep-cloned.
 */
export function applyMove(state: StickerState[], move: Move): StickerState[] {
  const def = MOVE_DEF[move.base];
  const turns = move.dir === 1 ? 1 : move.dir === -1 ? 3 : 2;
  const layerSet = new Set(def.layers);

  return state.map((s) => {
    const center: Vec3 = {
      x: s.pos.x - 0.5 * s.normal.x,
      y: s.pos.y - 0.5 * s.normal.y,
      z: s.pos.z - 0.5 * s.normal.z,
    };
    if (!layerSet.has(Math.round(center[def.axisIdx]))) {
      return cloneSticker(s);
    }
    let pos = cloneVec(s.pos);
    let normal = cloneVec(s.normal);
    for (let i = 0; i < turns; i++) {
      pos = rotate90(pos, def.axis);
      normal = rotate90(normal, def.axis);
    }
    return { color: s.color, pos, normal };
  });
}

/** Apply a whole algorithm string to a state, returning a NEW state. */
export function applyAlgorithm(state: StickerState[], alg: string): StickerState[] {
  return parseAlgorithm(alg).reduce<StickerState[]>(
    (acc, move) => applyMove(acc, move),
    state,
  );
}
