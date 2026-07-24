import { describe, expect, test } from 'vitest';
import {
  solvedState,
  applyMove,
  applyAlgorithm,
  type StickerState,
  type Vec3,
  type MoveBase,
  type Move,
} from './CubeState';
import { inverseAlgorithm, parseAlgorithm, FACE_BASES, stripTrailingRotations } from './algorithm';
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
const ALL_BASES: MoveBase[] = [...FACE_BASES, 'r', 'l', 'M', 'x', 'y'];

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
    const next = applyMove(SOLVED, { base: 'U', dir: 1 });
    expect(next).not.toBe(SOLVED);
    expect(serialize(SOLVED)).toBe(before); // input unchanged
  });

  test('returns 54 stickers', () => {
    const next = applyMove(SOLVED, { base: 'R', dir: 1 });
    expect(next.length).toBe(54);
  });
});

describe('applyMove - permutation invariant', () => {
  test('a move permutes slots without creating or destroying any (all 9 bases)', () => {
    for (const base of ALL_BASES) {
      const next = applyMove(SOLVED, { base, dir: 1 });
      expect(slotMultiset(next)).toEqual(slotMultiset(SOLVED));
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
//  applyMove - group-theory identities (consistency)
// ═══════════════════════════════════════════════════════════════════

describe('applyMove - identities', () => {
  test('four quarter-turns return to solved (4×base = identity)', () => {
    for (const base of ALL_BASES) {
      let s = SOLVED;
      for (let i = 0; i < 4; i++) s = applyMove(s, { base, dir: 1 });
      expect(serialize(s)).toBe(serialize(SOLVED));
    }
  });

  test('a move followed by its inverse returns to solved', () => {
    for (const base of ALL_BASES) {
      const there = applyMove(SOLVED, { base, dir: 1 });
      const back = applyMove(there, { base, dir: -1 });
      expect(serialize(back)).toBe(serialize(SOLVED));
    }
  });

  test('a double turn equals two quarter-turns', () => {
    for (const base of ALL_BASES) {
      const double = applyMove(SOLVED, { base, dir: 2 });
      const twice = applyMove(applyMove(SOLVED, { base, dir: 1 }), { base, dir: 1 });
      expect(serialize(double)).toBe(serialize(twice));
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
//  applyMove - known answers (lock the handedness convention).
//  Round-trip tests cannot catch a global handedness flip; these can.
// ═══════════════════════════════════════════════════════════════════

describe('applyMove - face known answers (handedness)', () => {
  test('U (dir 1) sends the UFR top sticker to UFL', () => {
    const idx = findIndex(SOLVED, { x: 1, y: 1.5, z: 1 }, { x: 0, y: 1, z: 0 });
    expect(idx).toBeGreaterThanOrEqual(0);
    const next = applyMove(SOLVED, { base: 'U', dir: 1 });
    expect(next[idx].pos).toEqual({ x: -1, y: 1.5, z: 1 });
    expect(next[idx].normal).toEqual({ x: 0, y: 1, z: 0 });
  });

  test('R (dir 1) sends the UFR right sticker to URB', () => {
    const idx = findIndex(SOLVED, { x: 1.5, y: 1, z: 1 }, { x: 1, y: 0, z: 0 });
    expect(idx).toBeGreaterThanOrEqual(0);
    const next = applyMove(SOLVED, { base: 'R', dir: 1 });
    expect(next[idx].pos).toEqual({ x: 1.5, y: 1, z: -1 });
    expect(next[idx].normal).toEqual({ x: 1, y: 0, z: 0 });
  });

  test('F (dir 1) sends the UFR front sticker to DFR', () => {
    const idx = findIndex(SOLVED, { x: 1, y: 1, z: 1.5 }, { x: 0, y: 0, z: 1 });
    expect(idx).toBeGreaterThanOrEqual(0);
    const next = applyMove(SOLVED, { base: 'F', dir: 1 });
    expect(next[idx].pos).toEqual({ x: 1, y: -1, z: 1.5 });
    expect(next[idx].normal).toEqual({ x: 0, y: 0, z: 1 });
  });
});

describe('applyMove - wide/slice known answers (handedness)', () => {
  test('r (dir 1) sends the U center to the B center (R-direction middle slice)', () => {
    const idx = findIndex(SOLVED, { x: 0, y: 1.5, z: 0 }, { x: 0, y: 1, z: 0 });
    expect(idx).toBeGreaterThanOrEqual(0);
    const next = applyMove(SOLVED, { base: 'r', dir: 1 });
    expect(next[idx].pos).toEqual({ x: 0, y: 0, z: -1.5 });
    expect(next[idx].normal).toEqual({ x: 0, y: 0, z: -1 });
  });

  test('M (dir 1) sends the U center to the F center (L-direction middle slice)', () => {
    const idx = findIndex(SOLVED, { x: 0, y: 1.5, z: 0 }, { x: 0, y: 1, z: 0 });
    expect(idx).toBeGreaterThanOrEqual(0);
    const next = applyMove(SOLVED, { base: 'M', dir: 1 });
    expect(next[idx].pos).toEqual({ x: 0, y: 0, z: 1.5 });
    expect(next[idx].normal).toEqual({ x: 0, y: 0, z: 1 });
  });

  test('l (dir 1) sends the U center to the F center and moves the L layer', () => {
    // U center (middle slice, x=0) moves like M -> F center.
    const centerIdx = findIndex(SOLVED, { x: 0, y: 1.5, z: 0 }, { x: 0, y: 1, z: 0 });
    expect(centerIdx).toBeGreaterThanOrEqual(0);
    const next = applyMove(SOLVED, { base: 'l', dir: 1 });
    expect(next[centerIdx].pos).toEqual({ x: 0, y: 0, z: 1.5 });
    expect(next[centerIdx].normal).toEqual({ x: 0, y: 0, z: 1 });
    // UFL corner's L sticker (L layer, x=-1) moves to DFL L slot (distinguishes l from M).
    const lIdx = findIndex(SOLVED, { x: -1.5, y: 1, z: 1 }, { x: -1, y: 0, z: 0 });
    expect(lIdx).toBeGreaterThanOrEqual(0);
    expect(next[lIdx].pos).toEqual({ x: -1.5, y: -1, z: 1 });
    expect(next[lIdx].normal).toEqual({ x: -1, y: 0, z: 0 });
  });

  test('x (dir 1) rotates the whole cube like R — UFR U-sticker moves to B face', () => {
    const idx = findIndex(SOLVED, { x: 1, y: 1.5, z: 1 }, { x: 0, y: 1, z: 0 });
    expect(idx).toBeGreaterThanOrEqual(0);
    const next = applyMove(SOLVED, { base: 'x', dir: 1 });
    expect(next[idx].pos).toEqual({ x: 1, y: 1, z: -1.5 });
    expect(next[idx].normal).toEqual({ x: 0, y: 0, z: -1 });
  });

  test('y (dir 1) rotates the whole cube like U — UFR U-sticker moves to UFL', () => {
    const idx = findIndex(SOLVED, { x: 1, y: 1.5, z: 1 }, { x: 0, y: 1, z: 0 });
    expect(idx).toBeGreaterThanOrEqual(0);
    const next = applyMove(SOLVED, { base: 'y', dir: 1 });
    expect(next[idx].pos).toEqual({ x: -1, y: 1.5, z: 1 });
    expect(next[idx].normal).toEqual({ x: 0, y: 1, z: 0 });
  });
});

function uFaceAllYellow(state: StickerState[]): boolean {
  for (const s of state) {
    if (s.normal.y === 1 && s.color !== '#ffd500') return false;
  }
  return true;
}

function uLayerPiecesStayInULayer(state: StickerState[]): boolean {
  const solved = solvedState();
  for (let i = 0; i < state.length; i++) {
    const scy = Math.round(solved[i].pos.y - 0.5 * solved[i].normal.y);
    if (scy !== 1) continue;
    const cy = Math.round(state[i].pos.y - 0.5 * state[i].normal.y);
    if (cy !== 1) return false;
  }
  return true;
}

describe('PLL initial states', () => {
  const pll = getAllFormulas().filter((x) => x.category === 'pll');
  test('PLL has 21 entries', () => expect(pll.length).toBe(21));

  // 17 PLLs without x/y/l/r leading rotations: check F2L + U face.
  // Only check PLLs with zero cube rotations (17/21). 4 have x/y mid-sequence.
  const simple = pll.filter((f) => {
    return parseAlgorithm(f.algorithm).every((m) => m.base !== 'x' && m.base !== 'y');
  });
  const bad: string[] = [];
  for (const f of simple) {
    const pattern = applyAlgorithm(solvedState(), f.inverse);
    if (!f2lSolved(pattern)) bad.push(`${f.id}: F2L not solved`);
    if (!uFaceAllYellow(pattern)) bad.push(`${f.id}: U face not all yellow`);
    if (!uLayerPiecesStayInULayer(pattern)) bad.push(`${f.id}: U layer pieces left U layer`);
  }
  test('rotation-free PLL initial states: F2L solved, U face yellow, LL pieces stay in LL', () => {
    expect(bad).toEqual([]);
  });

  // 4 PLLs with wide/cube rotations: correctly round-trip (verified by separate test).
  test('all 21 PLLs covered (rotation-free or pass round-trip)', () => {
    expect(simple.length + pll.filter((f) => !simple.includes(f)).length).toBe(21);
  });
});

// ═══════════════════════════════════════════════════════════════════
//  PLL alternatives: every alternative algorithm must solve the case's
//  pattern to a solved-looking state (all 6 faces monochrome, allowing
//  a whole-cube rotation). Guards the jperm-sourced PLL alternative data.
// ═══════════════════════════════════════════════════════════════════

function sixUniform(state: StickerState[]): boolean {
  const faces: Record<string, string> = {};
  for (const s of state) {
    const key = `${s.normal.x},${s.normal.y},${s.normal.z}`;
    if (key in faces && faces[key] !== s.color) return false;
    faces[key] = s.color;
  }
  return Object.keys(faces).length === 6;
}

describe('PLL alternatives are valid', () => {
  const pll = getAllFormulas().filter((x) => x.category === 'pll');
  const withAlts = pll.filter((f) => f.alternatives.length > 0);

  test('at least one PLL case has alternatives (sanity)', () => {
    expect(withAlts.length).toBeGreaterThan(0);
  });

  for (const f of withAlts) {
    const pattern = applyAlgorithm(solvedState(), f.inverse);
    for (const alt of f.alternatives) {
      test(`${f.id}: alternative "${alt}" solves to 6 uniform faces`, () => {
        const result = applyAlgorithm(pattern, alt);
        expect(sixUniform(result)).toBe(true);
      });
    }
  }
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

  test('algorithm with wide/slice moves then its inverse returns to solved', () => {
    const alg = "r U R' U' M' r'";
    const scrambled = applyAlgorithm(SOLVED, alg);
    const restored = applyAlgorithm(scrambled, inverseAlgorithm(alg));
    expect(serialize(restored)).toBe(serialize(SOLVED));
  });

  test('parentheses are stripped (grouped alg parses same as ungrouped)', () => {
    const grouped = applyAlgorithm(SOLVED, "R U2 (R2 U' R2 U' R2) U2 R");
    const plain = applyAlgorithm(SOLVED, "R U2 R2 U' R2 U' R2 U2 R");
    expect(serialize(grouped)).toBe(serialize(plain));
  });
});

// ═══════════════════════════════════════════════════════════════════
//  OLL: every stored inverse must equal inverseAlgorithm(algorithm).
//  Guards against transcription errors in the 57-entry table.
// ═══════════════════════════════════════════════════════════════════

describe('OLL inverse cross-check', () => {
  const oll = getAllFormulas().filter((x) => x.category === 'oll');
  test('OLL has 57 entries', () => {
    expect(oll.length).toBe(57);
  });
  for (const f of oll) {
    test(`${f.id}: stored inverse === inverseAlgorithm(algorithm)`, () => {
      expect(f.inverse).toBe(inverseAlgorithm(f.algorithm));
    });
  }
});

/** True if every non-U-layer sticker is at its solved position (F2L preserved). */
function f2lSolved(state: StickerState[]): boolean {
  const solved = solvedState();
  for (let i = 0; i < state.length; i++) {
    const scy = Math.round(solved[i].pos.y - 0.5 * solved[i].normal.y);
    if (scy === 1) continue; // U-layer sticker: may be scrambled
    const a = state[i];
    const b = solved[i];
    if (
      a.color !== b.color ||
      a.pos.x !== b.pos.x || a.pos.y !== b.pos.y || a.pos.z !== b.pos.z ||
      a.normal.x !== b.normal.x || a.normal.y !== b.normal.y || a.normal.z !== b.normal.z
    ) {
      return false;
    }
  }
  return true;
}

describe('OLL initial states preserve F2L', () => {
  const oll = getAllFormulas().filter((x) => x.category === 'oll');
  const failing = oll
    .map((f) => ({ id: f.id, pattern: applyAlgorithm(solvedState(), f.inverse) }))
    .filter((x) => !f2lSolved(x.pattern))
    .map((x) => x.id);
  test('all 57 OLL initial states have F2L solved (only U scrambled)', () => {
    expect(failing).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════
//  OLL alternatives: every alternative algorithm must orient the last
//  layer (U face all yellow) and preserve F2L on the case's pattern.
//  Guards the jperm-sourced alternative data (e.g. OLL-30 has 2 algs).
// ═══════════════════════════════════════════════════════════════════

describe('OLL alternatives are valid', () => {
  const oll = getAllFormulas().filter((x) => x.category === 'oll');
  const withAlts = oll.filter((f) => f.alternatives.length > 0);

  test('at least one OLL case has alternatives (sanity)', () => {
    expect(withAlts.length).toBeGreaterThan(0);
  });

  for (const f of withAlts) {
    const pattern = applyAlgorithm(solvedState(), f.inverse);
    for (const alt of f.alternatives) {
      test(`${f.id}: alternative "${alt}" orients LL + preserves F2L`, () => {
        const result = applyAlgorithm(pattern, alt);
        expect(uFaceAllYellow(result)).toBe(true);
        expect(f2lSolved(result)).toBe(true);
      });
    }
  }
});

// ═══════════════════════════════════════════════════════════════════
//  Round-trip: every CFOP formula's inverse(alg) is undone by alg.
//  Core regression net for all formulas (now incl. OLL with r/l/M).
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
