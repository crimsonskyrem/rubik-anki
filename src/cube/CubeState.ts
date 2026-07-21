// ═══════════════════════════════════════════════════════════════════
//  CubeState - pure, immutable, Three.js-free sticker state model.
//
//  Single source of truth for cube state. applyMove is a pure
//  (state, move) -> state function using exact 90° cardinal rotations
//  (integer math, no floating-point drift). The rotation axis/sign
//  convention is ported verbatim from Rotator.FACE_AXES so that
//  instant application and animated rotation agree exactly.
// ═══════════════════════════════════════════════════════════════════

import { parseAlgorithm, type Face, type Move } from './algorithm';

export type { Face, Move } from './algorithm';

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

/** Sticker colors: U yellow, D white, L orange, R red, F blue, B green. */
const COLORS: Record<Face, string> = {
  U: '#ffd500',
  D: '#ffffff',
  L: '#ff5900',
  R: '#b90000',
  F: '#0045f6',
  B: '#009b48',
};

/**
 * Per-face geometry: outward normal + rotation axis.
 * Ported verbatim from Rotator.FACE_AXES + getRotationParams:
 *   dir === 1  -> +90° around `axis`
 *   dir === -1 -> -90° around `axis` (= 3 × +90°)
 *   dir === 2  -> 180° around `axis` (= 2 × +90°)
 */
const FACE_INFO: Record<Face, { normal: Vec3; axis: Vec3 }> = {
  U: { normal: { x: 0, y: 1, z: 0 }, axis: { x: 0, y: 1, z: 0 } },
  D: { normal: { x: 0, y: -1, z: 0 }, axis: { x: 0, y: 1, z: 0 } },
  R: { normal: { x: 1, y: 0, z: 0 }, axis: { x: -1, y: 0, z: 0 } },
  L: { normal: { x: -1, y: 0, z: 0 }, axis: { x: 1, y: 0, z: 0 } },
  F: { normal: { x: 0, y: 0, z: 1 }, axis: { x: 0, y: 0, z: -1 } },
  B: { normal: { x: 0, y: 0, z: -1 }, axis: { x: 0, y: 0, z: 1 } },
};

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

/** Build the 54 stickers of a solved cube (mirrors createStickerElements geometry). */
export function solvedState(): StickerState[] {
  const elements: StickerState[] = [];

  // U face (+y) - white
  for (let x = -BORDER; x <= BORDER; x += SIZE) {
    for (let z = -BORDER; z <= BORDER; z += SIZE) {
      elements.push({ color: COLORS.U, pos: { x, y: FACE_OFFSET, z }, normal: { x: 0, y: 1, z: 0 } });
    }
  }
  // D face (-y) - yellow
  for (let x = -BORDER; x <= BORDER; x += SIZE) {
    for (let z = -BORDER; z <= BORDER; z += SIZE) {
      elements.push({ color: COLORS.D, pos: { x, y: -FACE_OFFSET, z }, normal: { x: 0, y: -1, z: 0 } });
    }
  }
  // L face (-x) - orange
  for (let y = -BORDER; y <= BORDER; y += SIZE) {
    for (let z = -BORDER; z <= BORDER; z += SIZE) {
      elements.push({ color: COLORS.L, pos: { x: -FACE_OFFSET, y, z }, normal: { x: -1, y: 0, z: 0 } });
    }
  }
  // R face (+x) - red
  for (let y = -BORDER; y <= BORDER; y += SIZE) {
    for (let z = -BORDER; z <= BORDER; z += SIZE) {
      elements.push({ color: COLORS.R, pos: { x: FACE_OFFSET, y, z }, normal: { x: 1, y: 0, z: 0 } });
    }
  }
  // F face (+z) - green
  for (let x = -BORDER; x <= BORDER; x += SIZE) {
    for (let y = -BORDER; y <= BORDER; y += SIZE) {
      elements.push({ color: COLORS.F, pos: { x, y, z: FACE_OFFSET }, normal: { x: 0, y: 0, z: 1 } });
    }
  }
  // B face (-z) - blue
  for (let x = -BORDER; x <= BORDER; x += SIZE) {
    for (let y = -BORDER; y <= BORDER; y += SIZE) {
      elements.push({ color: COLORS.B, pos: { x, y, z: -FACE_OFFSET }, normal: { x: 0, y: 0, z: -1 } });
    }
  }

  return elements;
}

/**
 * True if a sticker belongs to the layer turned by `face`.
 * A sticker is in the layer when its cubie center (pos - 0.5·normal)
 * lies on the face plane: round(center[axis]) === faceNormal[axis].
 */
function inLayer(s: StickerState, face: Face): boolean {
  const n = FACE_INFO[face].normal;
  const axis: 'x' | 'y' | 'z' = n.x !== 0 ? 'x' : n.y !== 0 ? 'y' : 'z';
  const layerVal = n[axis];
  const center: Vec3 = {
    x: s.pos.x - 0.5 * s.normal.x,
    y: s.pos.y - 0.5 * s.normal.y,
    z: s.pos.z - 0.5 * s.normal.z,
  };
  return Math.round(center[axis]) === layerVal;
}

/**
 * Apply a move to a state, returning a NEW state (immutable).
 * Stickers in the turned layer have their pos/normal rotated by
 * (dir × 90°) around the face axis; all stickers are deep-cloned
 * so the result shares no references with the input.
 */
export function applyMove(state: StickerState[], move: Move): StickerState[] {
  const axis = FACE_INFO[move.face].axis;
  const turns = move.dir === 1 ? 1 : move.dir === -1 ? 3 : 2;

  return state.map((s) => {
    if (!inLayer(s, move.face)) {
      return cloneSticker(s);
    }
    let pos = cloneVec(s.pos);
    let normal = cloneVec(s.normal);
    for (let i = 0; i < turns; i++) {
      pos = rotate90(pos, axis);
      normal = rotate90(normal, axis);
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
