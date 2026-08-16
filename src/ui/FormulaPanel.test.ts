import { describe, expect, it } from 'vitest';
import { tokenStates } from './FormulaPanel';

const played = (alg: string, n: number) => tokenStates(alg, n).map((t) => t.played);

describe('tokenStates', () => {
  it('colors tokens green once their quarter-turns are fully played', () => {
    expect(played('R U', 0)).toEqual([false, false]);
    expect(played('R U', 1)).toEqual([true, false]);
    expect(played('R U', 2)).toEqual([true, true]);
  });

  it('a double turn needs two clicks', () => {
    expect(played('R2 U', 1)).toEqual([false, false]);
    expect(played('R2 U', 2)).toEqual([true, false]);
    expect(played('R2 U', 3)).toEqual([true, true]);
  });

  it('keeps prime and double labels', () => {
    expect(tokenStates("R U' R2", 0).map((t) => t.label)).toEqual(['R', "U'", 'R2']);
  });

  it('ignores unsupported tokens', () => {
    expect(played('R (q) U', 1)).toEqual([true, false]);
  });
});
