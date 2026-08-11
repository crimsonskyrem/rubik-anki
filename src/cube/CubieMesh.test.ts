import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createStickerElements } from './SquareData';
import { groupStickersIntoCubies } from './SquareData';
import { CubieMesh } from './CubieMesh';
import { solvedState, applyMove } from './CubeState';

function closeTo(a: THREE.Vector3, b: { x: number; y: number; z: number }): void {
  expect(a.x).toBeCloseTo(b.x, 4);
  expect(a.y).toBeCloseTo(b.y, 4);
  expect(a.z).toBeCloseTo(b.z, 4);
}

describe('CubieMesh', () => {
  it('solved state renders stickers exactly at model positions', () => {
    const elements = createStickerElements();
    const groups = groupStickersIntoCubies(elements);
    const cubies = groups.map((g) => new CubieMesh(g, elements));
    const root = new THREE.Group();
    cubies.forEach((c) => root.add(c));

    const state = solvedState();
    cubies.forEach((c) => c.syncFromState(state));

    for (const c of cubies) {
      for (let k = 0; k < c.indices.length; k++) {
        const s = state[c.indices[k]];
        closeTo(c.stickers[k].getWorldPosition(new THREE.Vector3()), s.pos);
        closeTo(c.stickers[k].getWorldDirection(new THREE.Vector3()), s.normal);
      }
    }
  });

  it('after R and U moves, rendered stickers match the model exactly', () => {
    const elements = createStickerElements();
    const groups = groupStickersIntoCubies(elements);
    const cubies = groups.map((g) => new CubieMesh(g, elements));
    const root = new THREE.Group();
    cubies.forEach((c) => root.add(c));

    let state = solvedState();
    state = applyMove(state, { base: 'R', dir: 1 });
    state = applyMove(state, { base: 'U', dir: -1 });
    cubies.forEach((c) => c.syncFromState(state));

    for (const c of cubies) {
      for (let k = 0; k < c.indices.length; k++) {
        const s = state[c.indices[k]];
        closeTo(c.stickers[k].getWorldPosition(new THREE.Vector3()), s.pos);
        closeTo(c.stickers[k].getWorldDirection(new THREE.Vector3()), s.normal);
      }
    }
  });
});
