// src/cube/SquareRenderer.ts
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { CubieMesh } from './CubieMesh';
import { StickerMesh } from './StickerMesh';
import { createStickerElements, groupStickersIntoCubies } from './SquareData';
import { solvedState, type StickerState } from './CubeState';

export { StickerMesh };

export class SquareRenderer {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  /** The Cube group — all cubies are children of this group (drag-rotated). */
  cubeGroup: THREE.Group;
  /** All 26 cubie pieces */
  cubies: CubieMesh[] = [];
  /** All 54 sticker squares (flat references for raycasting) */
  squares: StickerMesh[] = [];
  private raycaster: THREE.Raycaster;

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);

    this.camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100,
    );
    this.camera.position.set(5, 4.5, 6);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);
    const dir1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dir1.position.set(5, 10, 5);
    this.scene.add(dir1);
    const dir2 = new THREE.DirectionalLight(0xffffff, 0.4);
    dir2.position.set(-5, -3, -5);
    this.scene.add(dir2);

    // Fixed mirrors (world space): left (L), back (B), bottom (D).
    // 10×10 so edges are off-screen; at distance 3.0 the cube (max radius
    // 2.6 when rotated) never intersects them.
    const addMirror = (pos: [number, number, number], rot: [number, number, number] | null): void => {
      const mirror = new Reflector(new THREE.PlaneGeometry(10, 10), {
        clipBias: 0.003,
        textureWidth: 512,
        textureHeight: 512,
        color: 0x556677,
      });
      mirror.position.set(pos[0], pos[1], pos[2]);
      if (rot) mirror.rotation.set(rot[0], rot[1], rot[2]);
      const mat = mirror.material as THREE.ShaderMaterial;
      mat.transparent = true;
      mat.opacity = 0.7;
      this.scene.add(mirror);
    };
    addMirror([-3, 0, 0], [0, Math.PI / 2, 0]); // reflects L face
    addMirror([0, 0, -3], null);                // reflects B face
    addMirror([0, -3, 0], [-Math.PI / 2, 0, 0]); // reflects D face

    // Cubies
    this.cubeGroup = new THREE.Group();
    this.scene.add(this.cubeGroup);
    const elements = createStickerElements();
    const groups = groupStickersIntoCubies(elements);
    this.cubies = groups.map((g) => new CubieMesh(g, elements));
    for (const c of this.cubies) this.cubeGroup.add(c);
    this.squares = this.cubies.flatMap((c) => c.stickers);

    this.raycaster = new THREE.Raycaster();

    window.addEventListener('resize', () => this._onResize(container));
  }

  /** Write a pure StickerState[] into the cubies. The model is truth. */
  sync(state: StickerState[]): void {
    for (const c of this.cubies) c.syncFromState(state);
  }

  resetToSolved(): void {
    this.sync(solvedState());
  }

  /** Cast a ray and return the closest sticker hit */
  getIntersection(
    clientX: number,
    clientY: number,
    container: HTMLElement,
  ): StickerMesh | null {
    const rect = container.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(ndc, this.camera);
    const hits = this.raycaster.intersectObjects(this.squares, true);
    if (hits.length > 0) {
      let obj: THREE.Object3D | null = hits[0].object;
      while (obj && !(obj instanceof StickerMesh)) {
        obj = obj.parent;
      }
      return obj as StickerMesh | null;
    }
    return null;
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  private _onResize(container: HTMLElement): void {
    this.camera.aspect = container.clientWidth / container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(container.clientWidth, container.clientHeight);
  }
}
