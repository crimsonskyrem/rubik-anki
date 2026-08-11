import * as THREE from 'three';

/**
 * Orientation for a sticker: local +z = face normal, local +y = "up".
 * Side faces use world up; U/D faces use the z axis so they are not degenerate.
 */
export function stickerQuaternion(normal: THREE.Vector3): THREE.Quaternion {
  const nn = normal.clone().normalize();
  const up = Math.abs(nn.y) > 0.99
    ? new THREE.Vector3(0, 0, nn.y > 0 ? -1 : 1)
    : new THREE.Vector3(0, 1, 0);
  const right = new THREE.Vector3().crossVectors(up, nn).normalize();
  const up2 = new THREE.Vector3().crossVectors(nn, right);
  return new THREE.Quaternion().setFromRotationMatrix(
    new THREE.Matrix4().makeBasis(right, up2, nn),
  );
}

/** A single sticker square: static layout inside its cubie, double-sided. */
export class StickerMesh extends THREE.Group {
  /** Model-space normal (set by CubieMesh.syncFromState; used for click→face). */
  readonly normal = new THREE.Vector3();
  private front: THREE.Mesh;

  constructor(size: number = 0.9) {
    super();
    const shape = new THREE.Shape();
    const hw = size / 2;
    const r = 0.08; // corner radius
    shape.moveTo(-hw + r, hw);
    shape.lineTo(hw - r, hw);
    shape.quadraticCurveTo(hw, hw, hw, hw - r);
    shape.lineTo(hw, -hw + r);
    shape.quadraticCurveTo(hw, -hw, hw - r, -hw);
    shape.lineTo(-hw + r, -hw);
    shape.quadraticCurveTo(-hw, -hw, -hw, -hw + r);
    shape.lineTo(-hw, hw - r);
    shape.quadraticCurveTo(-hw, hw, -hw + r, hw);
    const geo = new THREE.ShapeGeometry(shape);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });
    this.front = new THREE.Mesh(geo, mat);
    this.add(this.front);
  }

  /** Static layout relative to the cubie center — call once at build time. */
  layout(offset: THREE.Vector3, normal: THREE.Vector3): void {
    this.position.copy(offset);
    this.quaternion.copy(stickerQuaternion(normal));
  }

  setColor(color: string): void {
    (this.front.material as THREE.MeshStandardMaterial).color.set(color);
  }
}
