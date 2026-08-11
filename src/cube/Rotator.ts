import * as THREE from 'three';
import { CubieMesh } from './CubieMesh';

const RIGHT_ANGLE = Math.PI / 2;

/** Which coordinate a cardinal axis lives on. */
function axisIndex(axis: THREE.Vector3): 'x' | 'y' | 'z' {
  return Math.abs(axis.x) > 0 ? 'x' : Math.abs(axis.y) > 0 ? 'y' : 'z';
}

/**
 * Rotator — rotates a set of layers via a pivot Group (view-only tween).
 * Layer membership is decided by each cubie's group position (local to
 * cubeGroup, unchanged by drag-rotation of the cube itself).
 */
export class Rotator {
  private cubies: CubieMesh[];
  private parentGroup: THREE.Group;

  private _pivot: THREE.Group | null = null;
  private _rotating = false;
  get isRotating(): boolean { return this._rotating; }
  private _axis = new THREE.Vector3();
  private _targetAngle = 0;
  private _startTime = 0;
  private _duration = 250;
  private _activeCubies: CubieMesh[] = [];
  private _onComplete: (() => void) | null = null;

  constructor(cubies: CubieMesh[]) {
    this.cubies = cubies;
    this.parentGroup = cubies[0].parent as THREE.Group;
  }

  /** Begin rotating every cubie in `layers` around `axis` by dir × 90°. */
  startRotation(axis: THREE.Vector3, layers: number[], dir: 1 | -1, onComplete?: () => void): boolean {
    if (this._rotating) return false;

    const axisIdx = axisIndex(axis);
    const layerSet = new Set(layers);
    const activeCubies = this.cubies.filter((c) =>
      layerSet.has(Math.round(c.position[axisIdx])),
    );
    if (activeCubies.length === 0) return false;

    // Create pivot Group at origin and move active cubies into it (attach preserves world transform).
    this._pivot = new THREE.Group();
    this.parentGroup.add(this._pivot);
    for (const c of activeCubies) {
      this._pivot.attach(c);
    }

    this._activeCubies = activeCubies;
    this._axis.copy(axis).normalize();
    this._targetAngle = dir === 1 ? RIGHT_ANGLE : -RIGHT_ANGLE;
    this._startTime = performance.now();
    this._rotating = true;
    this._onComplete = onComplete || null;
    return true;
  }

  /** Call every frame. Returns true while animating. */
  update(): boolean {
    if (!this._rotating || !this._pivot) return false;

    const elapsed = performance.now() - this._startTime;
    const t = Math.min(elapsed / this._duration, 1.0);

    // Ease-in-out
    const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    const angle = this._targetAngle * eased;

    // Set absolute rotation on pivot (reset first, then apply)
    this._pivot.quaternion.identity();
    this._pivot.rotateOnWorldAxis(this._axis, angle);

    if (t >= 1.0) {
      // Ensure exact final angle
      this._pivot.quaternion.identity();
      this._pivot.rotateOnWorldAxis(this._axis, this._targetAngle);
      this._finish();
      return false;
    }
    return true;
  }

  private _finish(): void {
    // Move cubies back to parent (attach preserves world transform).
    for (const c of this._activeCubies) {
      this.parentGroup.attach(c);
    }

    // Remove pivot
    this.parentGroup.remove(this._pivot!);
    this._pivot = null;

    this._activeCubies = [];
    this._rotating = false;

    // The caller's onComplete commits the exact state via the model
    // (applyMove) + renderer.sync. No snap-to-grid drift hack here.
    this._onComplete?.();
    this._onComplete = null;
  }
}

export function hitToFace(sticker: { normal: THREE.Vector3 }): { normal: THREE.Vector3; dir: 1 | -1 } {
  return { normal: sticker.normal.clone(), dir: 1 };
}
