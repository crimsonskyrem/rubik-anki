// ═══════════════════════════════════════════════════════════════════
//  Algorithm parsing & inversion (pure, no cube state, no Three.js).
//  Owns the Move/Face types so the state model can import them.
// ═══════════════════════════════════════════════════════════════════

export type Face = 'U' | 'D' | 'R' | 'L' | 'F' | 'B';

/** Move direction: 1 = CW, -1 = CCW, 2 = double (180°). */
export type MoveDir = 1 | -1 | 2;

export interface Move {
  face: Face;
  dir: MoveDir;
}

/**
 * Parse an algorithm string (e.g. "R U R' U2") into Move[].
 * Tokens outside [URFDLB] with optional ' / 2 suffix are ignored.
 */
export function parseAlgorithm(alg: string): Move[] {
  const result: Move[] = [];
  const tokens = alg.trim().split(/\s+/);
  for (const token of tokens) {
    if (!token) continue;
    const match = token.match(/^([URFDLB])([']|2)?$/i);
    if (!match) continue;
    const face = match[1].toUpperCase() as Face;
    const suffix = match[2] || '';
    const dir: MoveDir = suffix === "'" ? -1 : suffix === '2' ? 2 : 1;
    result.push({ face, dir });
  }
  return result;
}

/**
 * Return the inverse of an algorithm string.
 * E.g. "R U R'" -> "R U' R'".
 */
export function inverseAlgorithm(alg: string): string {
  const moves = parseAlgorithm(alg);
  const reversed: string[] = [];
  for (let i = moves.length - 1; i >= 0; i--) {
    const { face, dir } = moves[i];
    const inv = dir === 1 ? "'" : dir === -1 ? '' : '2';
    reversed.push(face + inv);
  }
  return reversed.join(' ');
}
