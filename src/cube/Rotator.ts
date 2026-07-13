import * as THREE from 'three';
import { SquareMesh } from './SquareRenderer';
import { roundToGrid } from './SquareData';

// ═══════════════════════════════════════════════════════════════════
//  Face rotation axes — CW from outside, in Cube local space
// ═══════════════════════════════════════════════════════════════════

const FACE_AXES: Record<string, THREE.Vector3> = {
  '0,1,0':  new THREE.Vector3(0, 1, 0),   // U: right→back from top
  '0,-1,0': new THREE.Vector3(0, 1, 0),   // D: right→back from bottom
  '1,0,0':  new THREE.Vector3(-1, 0, 0),  // R: top→back from right
  '-1,0,0': new THREE.Vector3(1, 0, 0),   // L: top→front from left
  '0,0,1':  new THREE.Vector3(0, 0, -1),  // F: top→right from front
  '0,0,-1': new THREE.Vector3(0, 0, 1),   // B: top→right from back
};

const RIGHT_ANGLE = Math.PI / 2;

function getRotationParams(normal: THREE.Vector3, dir: 1 | -1) {
  const key = `${Math.round(normal.x)},${Math.round(normal.y)},${Math.round(normal.z)}`;
  const axis = FACE_AXES[key];
  if (!axis) return null;
  return { axis: axis.clone(), targetAngle: dir === 1 ? RIGHT_ANGLE : -RIGHT_ANGLE };
}

/** Cubie-center position: offset inward by 0.5 along the sticker normal */
function getTemPos(sq: SquareMesh): THREE.Vector3 {
  return sq.element.pos.clone().addScaledVector(sq.element.normal, -0.5);
}

// ═══════════════════════════════════════════════════════════════════
//  Rotator — rotates an entire layer (21 stickers) via a pivot Group
// ═══════════════════════════════════════════════════════════════════

export class Rotator {
  private squares: SquareMesh[];
  private parentGroup: THREE.Group; // cubeGroup

  private _pivot: THREE.Group | null = null;
  private _rotating = false;
  get isRotating(): boolean { return this._rotating; }
  private _axis = new THREE.Vector3();
  private _targetAngle = 0;
  private _startTime = 0;
  private _duration = 250;
  private _activeSquares: SquareMesh[] = [];
  private _onComplete: (() => void) | null = null;

  constructor(squares: SquareMesh[]) {
    this.squares = squares;
    this.parentGroup = squares[0].parent as THREE.Group;
  }

  /** Begin rotating a face layer (21 stickers). */
  startRotation(faceNormal: THREE.Vector3, dir: 1 | -1, onComplete?: () => void): boolean {
    if (this._rotating) return false;

    const params = getRotationParams(faceNormal, dir);
    if (!params) return false;

    // Select all stickers in the layer by cubie-center position.
    // The layer is the set of stickers whose cubie center lies on
    // the same plane perpendicular to the face normal.
    const n = new THREE.Vector3(
      Math.round(faceNormal.x), Math.round(faceNormal.y), Math.round(faceNormal.z),
    );
    const axisIdx = Math.abs(n.x) > 0 ? 'x' : Math.abs(n.y) > 0 ? 'y' : 'z';
    const layerVal = n[axisIdx] as number; // 1 or -1

    const activeSquares = this.squares.filter(sq => {
      const tp = getTemPos(sq);
      return Math.round(tp[axisIdx]) === layerVal;
    });

    if (activeSquares.length !== 21) return false;

    // Create pivot Group at origin
    this._pivot = new THREE.Group();
    this.parentGroup.add(this._pivot);

    // Move squares into pivot (attach preserves world transform)
    for (const sq of activeSquares) {
      this._pivot!.attach(sq);
    }

    this._activeSquares = activeSquares;
    this._axis.copy(params.axis);
    this._targetAngle = params.targetAngle;
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
    // Move squares back to parent (attach preserves world transform)
    for (const sq of this._activeSquares) {
      this.parentGroup.attach(sq);
    }

    // Remove pivot
    this.parentGroup.remove(this._pivot!);
    this._pivot = null;

    // Snap positions and normals to grid
    for (const sq of this._activeSquares) {
      sq.element.pos = roundToGrid(sq.position);
      const n = new THREE.Vector3(0, 0, 1).applyQuaternion(sq.quaternion);
      sq.element.normal = roundToGrid(n).normalize();
      // Also snap the square itself (just in case)
      sq.position.copy(sq.element.pos);
      const snapQ = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, 1), sq.element.normal,
      );
      sq.quaternion.copy(snapQ);
    }

    this._activeSquares = [];
    this._rotating = false;
    this._onComplete?.();
    this._onComplete = null;
  }
}

// ═══════════════════════════════════════════════════════════════════

export function hitToFace(square: SquareMesh): { normal: THREE.Vector3; dir: 1 | -1 } {
  return { normal: square.element.normal.clone(), dir: 1 };
}
