import * as THREE from 'three';
import { Cube } from './Cube';
import { COLORS, FACE_NAMES } from './constants';

/**
 * Three.js renderer for a Rubik's cube.
 * Renders 26 cubies (3×3×3 minus the hidden core).
 */
export class CubeRenderer {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  private cubies: THREE.Mesh[] = [];
  private pivotGroup: THREE.Group;
  private _isAnimating = false;
  get isAnimating(): boolean { return this._isAnimating; }
  private animPivot: THREE.Group | null = null;
  private animStart = 0;
  private animDuration = 250; // ms
  private animTargetAngle = 0;
  private animAxis = new THREE.Vector3();
  private animCubies: THREE.Mesh[] = [];
  private animOnComplete: (() => void) | null = null;

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

    // Pivot group (for rotation animations)
    this.pivotGroup = new THREE.Group();
    this.scene.add(this.pivotGroup);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);
    const dir1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dir1.position.set(5, 10, 5);
    this.scene.add(dir1);
    const dir2 = new THREE.DirectionalLight(0xffffff, 0.4);
    dir2.position.set(-5, -3, -5);
    this.scene.add(dir2);

    // Build cubies
    this._buildCubies();

    // Handle resize
    window.addEventListener('resize', () => this._onResize(container));
  }

  private _buildCubies(): void {
    const gap = 0.08;
    const size = 0.9;

    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          // Skip the invisible core
          if (x === 0 && y === 0 && z === 0) continue;

          const geo = new THREE.BoxGeometry(size, size, size);
          const materials = this._createFaceMaterials(x, y, z);
          const mesh = new THREE.Mesh(geo, materials);

          mesh.position.set(
            x * (size + gap),
            y * (size + gap),
            -z * (size + gap), // negate Z so green is front
          );

          // Store cubie logical position
          mesh.userData = { lx: x, ly: y, lz: z };

          this.pivotGroup.add(mesh);
          this.cubies.push(mesh);
        }
      }
    }
  }

  /** Create 6 materials — colored for exposed faces, black for hidden */
  private _createFaceMaterials(x: number, y: number, z: number): THREE.MeshStandardMaterial[] {
    const black = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1 });
    const facing: [number, number, number, number][] = [
      [0, 1, 0, 1],   // right  (+x) → R face if x == 1
      [0, -1, 0, -1], // left   (-x) → L face if x == -1
      [0, 0, 1, 1],   // top    (+y) → U face if y == 1
      [0, 0, -1, -1], // bottom (-y) → D face if y == -1
      [1, 0, 0, 1],   // front  (+z) → F face if z == 1
      [-1, 0, 0, -1], // back   (-z) → B face if z == -1
    ];

    const materialOrder = [2, 3, 0, 1, 4, 5]; // right, left, top, bottom, front, back
    const colorKeys = ['R', 'L', 'U', 'D', 'F', 'B'];

    const mats: THREE.MeshStandardMaterial[] = [];
    for (const mi of materialOrder) {
      const [cx, cy, cz, sign] = facing[mi];
      const coord = cx * x + cy * y + cz * z;
      if (coord === sign) {
        mats.push(new THREE.MeshStandardMaterial({
          color: COLORS[colorKeys[mi] as keyof typeof COLORS],
          roughness: 0.3,
        }));
      } else {
        mats.push(black);
      }
    }
    return mats;
  }

  /** Sync cubie sticker colors from Cube state */
  syncFromCube(cube: Cube): void {
    // Reset all cubie logical positions from their world positions
    for (const mesh of this.cubies) {
      // Map each cubie's exposed faces to the Cube state sticker colors
      const worldPos = new THREE.Vector3();
      mesh.getWorldPosition(worldPos);
      // Determine logical position from world position
      const gap = 0.08;
      const step = 0.9 + gap;
      mesh.userData.lx = Math.round(worldPos.x / step);
      mesh.userData.ly = Math.round(worldPos.y / step);
      mesh.userData.lz = -Math.round(worldPos.z / step);
      const { lx, ly, lz } = mesh.userData;

      const materials = mesh.material as THREE.MeshStandardMaterial[];

      const faceChecks: Array<{ faceIdx: number; stickerRow: number; stickerCol: number }> = [
        { faceIdx: 1, stickerRow: 1 - ly, stickerCol: lz + 1 },
        { faceIdx: 4, stickerRow: 1 - ly, stickerCol: 1 - lz },
        { faceIdx: 0, stickerRow: 1 - lz, stickerCol: lx + 1 },
        { faceIdx: 3, stickerRow: lz + 1, stickerCol: lx + 1 },
        { faceIdx: 2, stickerRow: 1 - ly, stickerCol: lx + 1 },
        { faceIdx: 5, stickerRow: 1 - ly, stickerCol: 1 - lx },
      ];

      const colorKeys = ['R', 'L', 'U', 'D', 'F', 'B'];
      for (let i = 0; i < 6; i++) {
        const fc = faceChecks[i];
        const stickerIdx = fc.faceIdx * 9 + fc.stickerRow * 3 + fc.stickerCol;
        const colorFaceIdx = cube.state[stickerIdx];
        (materials[i] as THREE.MeshStandardMaterial).color.set(
          COLORS[FACE_NAMES[colorFaceIdx] as keyof typeof COLORS],
        );
      }
    }
  }

  /** Animate a single face rotation */
  animateMove(face: number, dir: 1 | -1 | 2, cube: Cube, onComplete?: () => void): void {
    if (this._isAnimating) return;
    this._isAnimating = true;

    const axisMap: Record<number, { axis: 'lx' | 'ly' | 'lz'; value: number; vec: THREE.Vector3 }> = {
      0: { axis: 'ly', value: 1, vec: new THREE.Vector3(0, 1, 0) },
      3: { axis: 'ly', value: -1, vec: new THREE.Vector3(0, -1, 0) },
      1: { axis: 'lx', value: 1, vec: new THREE.Vector3(1, 0, 0) },
      4: { axis: 'lx', value: -1, vec: new THREE.Vector3(-1, 0, 0) },
      2: { axis: 'lz', value: 1, vec: new THREE.Vector3(0, 0, 1) },
      5: { axis: 'lz', value: -1, vec: new THREE.Vector3(0, 0, -1) },
    };

    const info = axisMap[face];
    if (!info) { this._isAnimating = false; return; }

    const layerCubies = this.cubies.filter(c => c.userData[info.axis] === info.value);
    this.animCubies = layerCubies;
    this.animPivot = new THREE.Group();
    this.scene.add(this.animPivot);

    for (const cubie of layerCubies) {
      const worldPos = new THREE.Vector3();
      cubie.getWorldPosition(worldPos);
      this.pivotGroup.remove(cubie);
      this.animPivot!.add(cubie);
      cubie.position.copy(this.animPivot!.worldToLocal(worldPos));
    }

    this.animAxis = info.vec;
    const angle = dir === 1 ? Math.PI / 2 : dir === -1 ? -Math.PI / 2 : Math.PI;
    this.animTargetAngle = angle;
    this.animStart = performance.now();
    this.animOnComplete = () => {
      cube.applyMove(face, dir);
      for (const cubie of layerCubies) {
        const worldPos = new THREE.Vector3();
        cubie.getWorldPosition(worldPos);
        this.animPivot!.remove(cubie);
        this.pivotGroup.add(cubie);
        cubie.position.copy(this.pivotGroup.worldToLocal(worldPos));
        cubie.rotation.set(0, 0, 0);
      }
      this.scene.remove(this.animPivot!);
      this.animPivot = null;
      this._isAnimating = false;
      this.animCubies = [];
      onComplete?.();
    };
  }

  render(): void {
    if (this._isAnimating && this.animPivot) {
      const elapsed = performance.now() - this.animStart;
      const t = Math.min(elapsed / this.animDuration, 1.0);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const angle = this.animTargetAngle * eased;

      this.animPivot.rotation.set(0, 0, 0);
      this.animPivot.rotateOnWorldAxis(this.animAxis, angle);

      if (t >= 1.0) {
        this.animPivot.rotation.set(0, 0, 0);
        this.animPivot.rotateOnWorldAxis(this.animAxis, this.animTargetAngle);
        const cb = this.animOnComplete;
        this.animOnComplete = null;
        cb?.();
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  private _onResize(container: HTMLElement): void {
    this.camera.aspect = container.clientWidth / container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(container.clientWidth, container.clientHeight);
  }
}
