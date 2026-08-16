import { describe, expect, it } from 'vitest';
import { nextPlayback } from './AnkiPanel';
import type { Move } from '../cube/algorithm';

const U: Move = { base: 'U', dir: 1 };
const R: Move = { base: 'R', dir: 1 };
const alg = [U, R, U];

describe('nextPlayback', () => {
  it('continues from the user position on first click when the cube is clean', () => {
    expect(nextPlayback(null, 0, 0, [U], alg, false)).toEqual({ index: 1, restart: false });
  });

  it('starts from the scramble when the user diverged', () => {
    // Manually rotated the cube.
    expect(nextPlayback(null, 0, 0, [U], alg, true)).toEqual({ index: 0, restart: true });
    // User followed a different algorithm (moves not a prefix of this one).
    expect(nextPlayback(null, 0, 0, [U, R, U, U], alg, false)).toEqual({ index: 0, restart: true });
  });

  it('restarts from the scramble when switching algorithms', () => {
    expect(nextPlayback(0, 2, 1, [], alg, false)).toEqual({ index: 0, restart: true });
  });

  it('replays from the start when the algorithm is finished', () => {
    expect(nextPlayback(0, 3, 0, [], alg, false)).toEqual({ index: 0, restart: true });
  });

  it('continues mid-playback on the same algorithm', () => {
    expect(nextPlayback(0, 1, 0, [], alg, false)).toEqual({ index: 1, restart: false });
  });

  it('restarts when the cube was manually rotated mid-playback', () => {
    expect(nextPlayback(0, 1, 0, [], alg, true)).toEqual({ index: 0, restart: true });
  });
});
