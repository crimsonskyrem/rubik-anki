/**
 * Algorithm parsing & inversion (pure, no cube state, no Three.js).
 * Owns the Move/MoveBase types so the state model can import them.
 */

/** A move base: 6 outer faces + wide r/l + slice M + cube rotations x/y. */
export type MoveBase = 'U' | 'D' | 'R' | 'L' | 'F' | 'B' | 'r' | 'l' | 'M' | 'x' | 'y';

/** The 6 outer faces (subset of MoveBase; r/l/M/x/y are not faces). */
export const FACE_BASES: MoveBase[] = ['U', 'D', 'R', 'L', 'F', 'B'];

/** Move direction: 1 = CW, -1 = CCW, 2 = double (180deg). */
export type MoveDir = 1 | -1 | 2;

export interface Move {
  base: MoveBase;
  dir: MoveDir;
}

/** Strip grouping parentheses (readability only in algorithm tables). */
function stripParens(alg: string): string {
  return alg.replace(/[()]/g, ' ');
}

/** Match a single token: base letter + optional prime or 2. Case-sensitive (r != R). */
const PRIME_RE = /['‘’]/; // straight ' and curly '' both mean prime

/**
 * Parse an algorithm string into Move[]. Parentheses are stripped;
 * tokens outside the supported set are ignored. Case-sensitive.
 */
export function parseAlgorithm(alg: string): Move[] {
  const result: Move[] = [];
  const tokens = stripParens(alg).trim().split(/\s+/);
  for (const token of tokens) {
    if (!token) continue;
    const mBase = token.match(/^([URFDLBrlMxy])/);
    if (!mBase) continue;
    const base = mBase[1] as MoveBase;
    const tail = token.slice(mBase[0].length);
    if (tail === '2') { result.push({ base, dir: 2 }); continue; }
    if (PRIME_RE.test(tail)) { result.push({ base, dir: -1 }); continue; }
    result.push({ base, dir: 1 });
  }
  return result;
}

/**
 * Return the inverse of an algorithm string.
 * Reverse order and invert each move's direction (base unchanged).
 */
export function inverseAlgorithm(alg: string): string {
  const moves = parseAlgorithm(alg);
  const reversed: string[] = [];
  for (let i = moves.length - 1; i >= 0; i--) {
    const { base, dir } = moves[i];
    const inv = dir === 1 ? "'" : dir === -1 ? '' : '2';
    reversed.push(base + inv);
  }
  return reversed.join(' ');
}

/**
 * Strip trailing cube rotations (x/y with any suffix) from an algorithm.
 * Used so that the initial pattern is displayed with U on top (trailing
 * cube rotations would otherwise reorient the whole cube).
 */
export function stripTrailingRotations(alg: string): string {
  const tokens = alg.trim().split(/\s+/);
  while (tokens.length > 0 && /^[xy]/.test(tokens[tokens.length - 1])) {
    tokens.pop();
  }
  return tokens.join(' ');
}
