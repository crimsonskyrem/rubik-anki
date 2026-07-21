import { describe, expect, test } from 'vitest';
import {
  solvedState,
  applyMove,
  applyAlgorithm,
  type StickerState,
  type Vec3,
  type Face,
} from './CubeState';
import { inverseAlgorithm } from './algorithm';
import { getAllFormulas } from '../cfop/data';

// ═══════════════════════════════════════════════════════════════════
//  Helpers
// ═══════════════════════════════════════════════════════════════════

/** Deterministic serialization for deep-equality checks (sticker identity = array index). */
function serialize(state: StickerState[]): string {
  return JSON.stringify(
    state.map((s) => ({
      c: s.color,
      p: [s.pos.x, s.pos.y, s.pos.z],
      n: [s.normal.x, s.normal.y, s.normal.z],
    })),
  );
}

/** A sticker's slot = (position, normal). A legal move permutes slots, never creates/destroys them. */
function slotKey(s: StickerState): string {
  return `${s.pos.x},${s.pos.y},${s.pos.z}|${s.normal.x},${s.normal.y},${s.normal.z}`;
}

function slotMultiset(state: StickerState[]): string[] {
  return state.map(slotKey).sort();
}

/** Find the index of the sticker occupying a given slot. */
function findIndex(state: StickerState[], pos: Vec3, normal: Vec3): number {
  return state.findIndex(
    (s) =>
      s.pos.x === pos.x &&
      s.pos.y === pos.y &&
      s.pos.z === pos.z &&
      s.normal.x === normal.x &&
      s.normal.y === normal.y &&
      s.normal.z === normal.z,
  );
}

const SOLVED = solvedState();
const ALL_FACES: Face[] = ['U', 'D', 'R', 'L', 'F', 'B'];

// ═══════════════════════════════════════════════════════════════════
//  Solved state
// ═══════════════════════════════════════════════════════════════════

describe('solvedState', () => {
  test('has 54 stickers', () => {
    expect(SOLVED.length).toBe(54);
  });

  test('has 9 stickers per face, each face monochrome', () => {
    const faces: Array<{ normal: Vec3; color: string }> = [
      { normal: { x: 0, y: 1, z: 0 }, color: '#ffd500' }, // U yellow
      { normal: { x: 0, y: -1, z: 0 }, color: '#ffffff' }, // D white
      { normal: { x: -1, y: 0, z: 0 }, color: '#ff5900' }, // L orange
      { normal: { x: 1, y: 0, z: 0 }, color: '#b90000' }, // R red
      { normal: { x: 0, y: 0, z: 1 }, color: '#0045f6' }, // F blue
      { normal: { x: 0, y: 0, z: -1 }, color: '#009b48' }, // B green
    ];
    for (const { normal, color } of faces) {
      const stickers = SOLVED.filter(
        (s) =>
          s.normal.x === normal.x &&
          s.normal.y === normal.y &&
          s.normal.z === normal.z,
      );
      expect(stickers.length).toBe(9);
      expect(stickers.every((s) => s.color === color)).toBe(true);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
//  applyMove - immutability & permutation invariants
// ═══════════════════════════════════════════════════════════════════

describe('applyMove - immutability', () => {
  test('returns a new array (does not mutate input)', () => {
    const before = serialize(SOLVED);
    const next = applyMove(SOLVED, { face: 'U', dir: 1 });
    expect(next).not.toBe(SOLVED);
    expect(serialize(SOLVED)).toBe(before); // input unchanged
  });

  test('returns 54 stickers', () => {
    const next = applyMove(SOLVED, { face: 'R', dir: 1 });
    expect(next.length).toBe(54);
  });
});

describe('applyMove - permutation invariant', () => {
  test('a move permutes slots without creating or destroying any', () => {
    for (const face of ALL_FACES) {
      const next = applyMove(SOLVED, { face, dir: 1 });
      expect(slotMultiset(next)).toEqual(slotMultiset(SOLVED));
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
//  applyMove - group-theory identities (consistency)
// ═══════════════════════════════════════════════════════════════════

describe('applyMove - identities', () => {
  test('four quarter-turns return to solved (4×U = identity)', () => {
    for (const face of ALL_FACES) {
      let s = SOLVED;
      for (let i = 0; i < 4; i++) s = applyMove(s, { face, dir: 1 });
      expect(serialize(s)).toBe(serialize(SOLVED));
    }
  });

  test('a move followed by its inverse returns to solved', () => {
    for (const face of ALL_FACES) {
      const there = applyMove(SOLVED, { face, dir: 1 });
      const back = applyMove(there, { face, dir: -1 });
      expect(serialize(back)).toBe(serialize(SOLVED));
    }
  });

  test('a double turn equals two quarter-turns', () => {
    for (const face of ALL_FACES) {
      const double = applyMove(SOLVED, { face, dir: 2 });
      const twice = applyMove(applyMove(SOLVED, { face, dir: 1 }), { face, dir: 1 });
      expect(serialize(double)).toBe(serialize(twice));
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
//  applyMove - known answers (locks the handedness convention)
//  These pin the port of FACE_AXES / getRotationParams; round-trip
//  tests below CANNOT catch a global handedness flip, these can.
// ═══════════════════════════════════════════════════════════════════

describe('applyMove - known answers (handedness)', () => {
  test('U (dir 1) sends the UFR top sticker to URB', () => {
    // UFR corner's U-face sticker: pos (1, 1.5, 1), normal (0, 1, 0).
    const idx = findIndex(SOLVED, { x: 1, y: 1.5, z: 1 }, { x: 0, y: 1, z: 0 });
    expect(idx).toBeGreaterThanOrEqual(0);
    const next = applyMove(SOLVED, { face: 'U', dir: 1 });
    // After U: (x,y,z) -> (z, y, -x) => (1, 1.5, -1) = URB top slot.
    expect(next[idx].pos).toEqual({ x: 1, y: 1.5, z: -1 });
    expect(next[idx].normal).toEqual({ x: 0, y: 1, z: 0 });
  });

  test('R (dir 1) sends the UFR right sticker to URB', () => {
    // UFR corner's R-face sticker: pos (1.5, 1, 1), normal (1, 0, 0).
    const idx = findIndex(SOLVED, { x: 1.5, y: 1, z: 1 }, { x: 1, y: 0, z: 0 });
    expect(idx).toBeGreaterThanOrEqual(0);
    const next = applyMove(SOLVED, { face: 'R', dir: 1 });
    // After R: (x,y,z) -> (x, z, -y) => (1.5, 1, -1) = URB right slot.
    expect(next[idx].pos).toEqual({ x: 1.5, y: 1, z: -1 });
    expect(next[idx].normal).toEqual({ x: 1, y: 0, z: 0 });
  });

  test('F (dir 1) sends the UFR front sticker to DFR', () => {
    // UFR corner's F-face sticker: pos (1, 1, 1.5), normal (0, 0, 1).
    const idx = findIndex(SOLVED, { x: 1, y: 1, z: 1.5 }, { x: 0, y: 0, z: 1 });
    expect(idx).toBeGreaterThanOrEqual(0);
    const next = applyMove(SOLVED, { face: 'F', dir: 1 });
    // After F: (x,y,z) -> (y, -x, z) => (1, -1, 1.5) = DFR front slot.
    expect(next[idx].pos).toEqual({ x: 1, y: -1, z: 1.5 });
    expect(next[idx].normal).toEqual({ x: 0, y: 0, z: 1 });
  });
});

// ═══════════════════════════════════════════════════════════════════
//  applyAlgorithm & inverseAlgorithm
// ═══════════════════════════════════════════════════════════════════

describe('applyAlgorithm', () => {
  test('does not mutate input state', () => {
    const before = serialize(SOLVED);
    applyAlgorithm(SOLVED, "R U R' U'");
    expect(serialize(SOLVED)).toBe(before);
  });

  test('algorithm then its inverse returns to solved', () => {
    const alg = "R U R' U'";
    const scrambled = applyAlgorithm(SOLVED, alg);
    const restored = applyAlgorithm(scrambled, inverseAlgorithm(alg));
    expect(serialize(restored)).toBe(serialize(SOLVED));
  });
});

// ═══════════════════════════════════════════════════════════════════
//  Round-trip: every CFOP formula's inverse(alg) is undone by alg.
//  This is the core regression net for all 122 formulas.
// ═══════════════════════════════════════════════════════════════════

describe('CFOP round-trip (all formulas)', () => {
  const formulas = getAllFormulas();

  test('formula set is non-empty', () => {
    expect(formulas.length).toBeGreaterThan(0);
  });

  for (const f of formulas) {
    test(`${f.id} (${f.name}): inverse then algorithm returns to solved`, () => {
      const pattern = applyAlgorithm(solvedState(), f.inverse);
      const restored = applyAlgorithm(pattern, f.algorithm);
      expect(serialize(restored)).toBe(serialize(solvedState()));
    });
  }
});
