import * as THREE from 'three';
import { StickerMesh } from './StickerMesh';
import type { CubieGroup } from './SquareData';
import type { StickerElement } from './SquareData';
import type { StickerState } from './CubeState';

/**
 * One physical cube piece: black box body + 1–3 stickers laid out statically
 * relative to the group origin (the cubie center). The group transform is
 * rebuilt from the model on every sync — stickers never move locally.
 */
export class CubieMesh extends THREE.Group {
  readonly indices: number[];
  readonly stickers: StickerMesh[] = [];
  private localNormals: THREE.Vector3[] = [];

  constructor(group: CubieGroup, elements: StickerElement[]) {
    super();
    this.indices = group.stickerIndices;

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.97, 0.97, 0.97),
      new THREE.MeshStandardMaterial({ color: 0x0d1117, roughness: 0.35, metalness: 0.1 }),
    );
    this.add(body);

    const center = new THREE.Vector3(group.center.x, group.center.y, group.center.z);
    for (const i of group.stickerIndices) {
      const el = elements[i];
      const st = new StickerMesh();
      st.layout(el.pos.clone().sub(center), el.normal);
      this.add(st);
      this.stickers.push(st);
      this.localNormals.push(el.normal.clone());
    }
  }

  /** Rebuild this cubie's transform from the model state (exact, drift-free). */
  syncFromState(state: StickerState[]): void {
    const i0 = this.indices[0];
    const s0 = state[i0];

    // Cubie center = sticker pos − 0.5 × normal (same rule as the model).
    this.position.set(
      s0.pos.x - 0.5 * s0.normal.x,
      s0.pos.y - 0.5 * s0.normal.y,
      s0.pos.z - 0.5 * s0.normal.z,
    );

    if (this.localNormals.length >= 2) {
      // Use two sticker normals to recover the full 90°-grid rotation.
      // setFromUnitVectors alone gives the SHORTEST arc, which need not match
      // the model's integer 90° turns (rotating +z→+x while a sibling sticker
      // must go +x→−x is a 180° turn, not the shortest arc).
      const s1 = state[this.indices[1]];
      const w0 = new THREE.Vector3(s0.normal.x, s0.normal.y, s0.normal.z);
      const w1 = new THREE.Vector3(s1.normal.x, s1.normal.y, s1.normal.z);
      const l0 = this.localNormals[0];
      const l1 = this.localNormals[1];
      const w2 = new THREE.Vector3().crossVectors(w0, w1);
      const l2 = new THREE.Vector3().crossVectors(l0, l1);
      const basis = new THREE.Matrix4().makeBasis(w0, w1, w2);
      const local = new THREE.Matrix4().makeBasis(l0, l1, l2).transpose();
      this.quaternion.setFromRotationMatrix(basis.multiply(local));
    } else {
      // Face center: one sticker, orientation around the normal is unobservable.
      this.quaternion.setFromUnitVectors(
        this.localNormals[0],
        new THREE.Vector3(s0.normal.x, s0.normal.y, s0.normal.z),
      );
    }

    for (let k = 0; k < this.indices.length; k++) {
      const s = state[this.indices[k]];
      this.stickers[k].normal.set(s.normal.x, s.normal.y, s.normal.z);
      this.stickers[k].setColor(s.color);
    }
  }
}
