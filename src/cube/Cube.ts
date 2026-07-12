import { U, R, F, D, L, B, COLORS } from './constants';

/**
 * Cube state: 54 stickers arranged as 6 faces × 9 stickers per face.
 * Face order: U, R, F, D, L, B.
 * Each face is stored row-major (top-left to bottom-right).
 */
export class Cube {
  /** 54 sticker face indices */
  state: number[];

  constructor() {
    this.state = this._solvedState();
  }

  /** Return a fresh solved cube state */
  private _solvedState(): number[] {
    const s: number[] = [];
    for (let face = 0; face < 6; face++) {
      for (let i = 0; i < 9; i++) {
        s.push(face);
      }
    }
    return s;
  }

  reset(): void {
    this.state = this._solvedState();
  }

  /**
   * Apply a single face move.
   * face: index 0-5 (U/R/F/D/L/B)
   * dir: 1 = clockwise, -1 = counter-clockwise, 2 = double
   */
  applyMove(face: number, dir: 1 | -1 | 2): void {
    const cycles = dir === 2 ? 2 : dir === 1 ? 1 : 3;
    for (let i = 0; i < cycles; i++) {
      this._rotateFaceCW(face);
      this._cycleEdgesCW(face);
    }
  }

  /** Parse an algorithm string and apply all moves */
  applyAlgorithm(alg: string): void {
    const moves = parseAlgorithm(alg);
    for (const [face, dir] of moves) {
      this.applyMove(face, dir as 1 | -1 | 2);
    }
  }

  /** Rotate the 9 stickers of a single face clockwise */
  private _rotateFaceCW(face: number): void {
    const base = face * 9;
    const s = this.state;
    // corners
    [s[base + 0], s[base + 2], s[base + 8], s[base + 6]] =
      [s[base + 6], s[base + 0], s[base + 2], s[base + 8]];
    // edges
    [s[base + 1], s[base + 5], s[base + 7], s[base + 3]] =
      [s[base + 3], s[base + 1], s[base + 5], s[base + 7]];
  }

  /** Cycle the edge/corner stickers around a face */
  private _cycleEdgesCW(face: number): void {
    const s = this.state;
    const ring = this._adjacentRing(face);
    // ring is 12 indices [a0,a1,a2, b0,b1,b2, c0,c1,c2, d0,d1,d2]
    // shift all 12 stickers by 3 positions: ABCD → DABC (clockwise cycle)
    const prev = ring.map(i => s[i]);
    for (let i = 0; i < 12; i++) {
      s[ring[i]] = prev[(i + 9) % 12];
    }
  }

  /** Return a flat 12-element array of sticker indices around a face */
  private _adjacentRing(face: number): number[] {
    const a = (f: number, ...idx: number[]) => idx.map(i => f * 9 + i);
    let groups: number[][];
    switch (face) {
      case U: groups = [a(F,0,1,2), a(R,0,1,2), a(B,0,1,2), a(L,0,1,2)]; break;
      case D: groups = [a(F,6,7,8), a(L,6,7,8), a(B,6,7,8), a(R,6,7,8)]; break;
      case R: groups = [a(U,2,5,8), a(B,6,3,0), a(D,2,5,8), a(F,2,5,8)]; break;
      case L: groups = [a(U,0,3,6), a(F,0,3,6), a(D,0,3,6), a(B,8,5,2)]; break;
      case F: groups = [a(U,6,7,8), a(R,0,3,6), a(D,2,1,0), a(L,8,5,2)]; break;
      case B: groups = [a(U,0,1,2), a(L,0,3,6), a(D,6,7,8), a(R,8,5,2)]; break;
      default: return [];
    }
    return groups.flat();
  }
}

/**
 * Parse an algorithm string into an array of [faceIndex, direction].
 * E.g. "R U R' U'" → [[R,1], [U,1], [R,-1], [U,-1]]
 */
export function parseAlgorithm(alg: string): Array<[number, number]> {
  const faceMap: Record<string, number> = { U, R, F, D, L, B };
  const result: Array<[number, number]> = [];
  const tokens = alg.trim().split(/\s+/);
  for (const token of tokens) {
    if (!token) continue;
    const match = token.match(/^([URFDLB])(['']|2)?$/i);
    if (!match) continue;
    const f = faceMap[match[1].toUpperCase()];
    const suffix = match[2] || '';
    const dir: 1 | -1 | 2 = suffix === "'" ? -1 : suffix === '2' ? 2 : 1;
    result.push([f, dir]);
  }
  return result;
}

/**
 * Return the inverse of an algorithm string.
 * E.g. "R U R'" → "R U' R'"
 */
export function inverseAlgorithm(alg: string): string {
  const moves = parseAlgorithm(alg);
  const faceName = ['U', 'R', 'F', 'D', 'L', 'B'];
  const reversed: string[] = [];
  for (let i = moves.length - 1; i >= 0; i--) {
    const [f, d] = moves[i];
    const inv = d === 1 ? "'" : d === -1 ? '' : '2';
    reversed.push(faceName[f] + inv);
  }
  return reversed.join(' ');
}
