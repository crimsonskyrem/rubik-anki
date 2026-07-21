import * as THREE from 'three';
import { StickerElement, createStickerElements } from './SquareData';
import { solvedState, type StickerState } from './CubeState';

/** A single sticker square: colored front + black backing, positioned in 3D space */
export class SquareMesh extends THREE.Group {
  public element: StickerElement;

  constructor(element: StickerElement, size: number = 0.9) {
    super();
    this.element = element;

    // Rounded-rectangle shape
    const shape = new THREE.Shape();
    const hw = 0.45; // half-width (0.5 * 0.9 scale = 0.45)
    const hh = 0.45;
    const r = 0.08;  // corner radius
    shape.moveTo(-hw + r, hh);
    shape.lineTo(hw - r, hh);
    shape.quadraticCurveTo(hw, hh, hw, hh - r);
    shape.lineTo(hw, -hh + r);
    shape.quadraticCurveTo(hw, -hh, hw - r, -hh);
    shape.lineTo(-hw + r, -hh);
    shape.quadraticCurveTo(-hw, -hh, -hw, -hh + r);
    shape.lineTo(-hw, hh - r);
    shape.quadraticCurveTo(-hw, hh, -hw + r, hh);

    const geo = new THREE.ShapeGeometry(shape);
    const mat = new THREE.MeshStandardMaterial({
      color: element.color,
      roughness: 0.3,
      metalness: 0.0,
    });
    mat.polygonOffset = true;
    mat.polygonOffsetFactor = 1;
    mat.polygonOffsetUnits = 1;

    const front = new THREE.Mesh(geo, mat);
    this.add(front);

    // Black backing (slightly behind, double-sided)
    const backMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.9,
      side: THREE.DoubleSide,
    });
    const back = new THREE.Mesh(geo, backMat);
    back.position.set(0, 0, -0.01);
    this.add(back);

    // Position and orient
    this.position.copy(element.pos);
    this.lookAt(element.pos.clone().add(element.normal));
  }

  /** Update the element position and normal, then reposition the mesh */
  syncFromElement(): void {
    this.position.copy(this.element.pos);
    this.lookAt(this.element.pos.clone().add(this.element.normal));
  }
}

// ═══════════════════════════════════════════════════════════════════
//  SquareRenderer — manages the Three.js scene for the sticker squares
// ═══════════════════════════════════════════════════════════════════

export class SquareRenderer {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  /** The Cube group — all squares are children of this group */
  cubeGroup: THREE.Group;
  /** All 54 sticker squares */
  squares: SquareMesh[] = [];
  private raycaster: THREE.Raycaster;

  // Animation state
  private _isAnimating = false;
  get isAnimating(): boolean { return this._isAnimating; }

  constructor(container: HTMLElement) {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100,
    );
    this.camera.position.set(5, 4.5, 6);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    // Cube group — squares live in this local space
    this.cubeGroup = new THREE.Group();
    this.scene.add(this.cubeGroup);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);
    const dir1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dir1.position.set(5, 10, 5);
    this.scene.add(dir1);
    const dir2 = new THREE.DirectionalLight(0xffffff, 0.4);
    dir2.position.set(-5, -3, -5);
    this.scene.add(dir2);

    // Build squares
    const elements = createStickerElements();
    for (const el of elements) {
      const sq = new SquareMesh(el);
      this.cubeGroup.add(sq);
      this.squares.push(sq);
    }

    // Raycaster
    this.raycaster = new THREE.Raycaster();

    // Resize
    window.addEventListener('resize', () => this._onResize(container));
  }

  /**
   * Write a pure StickerState[] into the meshes. Single view-sync point:
   * the model is truth, the renderer renders it. Exact (no float drift)
   * because the model uses integer 90° rotations.
   */
  sync(state: StickerState[]): void {
    for (let i = 0; i < this.squares.length; i++) {
      const sq = this.squares[i];
      const s = state[i];
      sq.element.color = s.color;
      sq.element.pos.set(s.pos.x, s.pos.y, s.pos.z);
      sq.element.normal.set(s.normal.x, s.normal.y, s.normal.z);
      sq.syncFromElement();
      const frontMesh = sq.children[0] as THREE.Mesh;
      (frontMesh.material as THREE.MeshStandardMaterial).color.set(s.color);
    }
  }

  /** Reset all squares to solved state (delegates to sync over the solved model). */
  resetToSolved(): void {
    this.sync(solvedState());
  }

  /** Cast a ray and return the closest square hit */
  getIntersection(
    clientX: number,
    clientY: number,
    container: HTMLElement,
  ): SquareMesh | null {
    const rect = container.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(ndc, this.camera);
    const hits = this.raycaster.intersectObjects(this.squares, true);
    if (hits.length > 0) {
      // Walk up to find the SquareMesh
      let obj: THREE.Object3D | null = hits[0].object;
      while (obj && !(obj instanceof SquareMesh)) {
        obj = obj.parent;
      }
      return obj as SquareMesh | null;
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
