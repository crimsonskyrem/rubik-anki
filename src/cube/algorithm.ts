/**
 * Parse an algorithm string (e.g. "R U R' U'") into [faceIndex, direction] pairs.
 * Face indices: U=0, R=1, F=2, D=3, L=4, B=5.
 * Direction: 1=CW, -1=CCW, 2=double.
 */
export function parseAlgorithm(alg: string): Array<[number, number]> {
  const faceMap: Record<string, number> = { U: 0, R: 1, F: 2, D: 3, L: 4, B: 5 };
  const result: Array<[number, number]> = [];
  const tokens = alg.trim().split(/\s+/);
  for (const token of tokens) {
    if (!token) continue;
    const match = token.match(/^([URFDLB])([']|2)?$/i);
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
