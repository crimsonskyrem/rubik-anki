import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { stickerQuaternion } from './StickerMesh';

describe('stickerQuaternion', () => {
  it('maps local +z to the sticker normal', () => {
    const q = stickerQuaternion(new THREE.Vector3(1, 0, 0));
    const z = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
    expect(z.x).toBeCloseTo(1);
    expect(z.y).toBeCloseTo(0);
    expect(z.z).toBeCloseTo(0);
  });

  it('U-face sticker top (+y) points to -z', () => {
    const q = stickerQuaternion(new THREE.Vector3(0, 1, 0));
    const y = new THREE.Vector3(0, 1, 0).applyQuaternion(q);
    expect(y.x).toBeCloseTo(0);
    expect(y.y).toBeCloseTo(0);
    expect(y.z).toBeCloseTo(-1);
  });

  it('D-face sticker top (+y) points to +z', () => {
    const q = stickerQuaternion(new THREE.Vector3(0, -1, 0));
    const y = new THREE.Vector3(0, 1, 0).applyQuaternion(q);
    expect(y.x).toBeCloseTo(0);
    expect(y.y).toBeCloseTo(0);
    expect(y.z).toBeCloseTo(1);
  });
});
