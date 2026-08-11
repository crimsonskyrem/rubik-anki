# 立体 Cubie + 三面镜面反射 实现计划

> **面向 AI 代理的工作者:** 必需子技能:使用 superpowers:subagent-driven-development(推荐)或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框(`- [ ]`)语法来跟踪进度。

**目标:** 把魔方从 54 个平面贴纸改为 26 个立体 cubie(黑色方块 + 贴纸),并在左/后/下三面加固定镜面反射,使看不到的三面(L/B/D)贴纸始终可见;拖拽改为旋转魔方而非相机。

**架构:** 模型层(CubeState 54 贴纸状态)完全不动。渲染层重构为 CubieMesh(THREE.Group = 黑色 BoxGeometry + 静态布局贴纸),`sync()` 时用 `setFromUnitVectors` 从模型法线重建每组变换;三个 Reflector 固定在世界坐标;OrbitController 改为 `rotateOnWorldAxis` 旋转 cubeGroup。

**技术栈:** TypeScript, Three.js 0.185(`three/addons/objects/Reflector.js`), Vite, Vitest(node 环境,测试不需要 WebGL)。

---

## 文件结构

| 文件 | 职责 | 动作 |
|---|---|---|
| `src/cube/SquareData.ts` | 新增 `CubieGroup` 接口 + `groupStickersIntoCubies()` 纯函数 | 修改 |
| `src/cube/SquareData.test.ts` | 分组函数测试 | 创建 |
| `src/cube/StickerMesh.ts` | 贴纸(原 SquareMesh 改造):静态局部布局 + 双面 + `stickerQuaternion()` | 创建 |
| `src/cube/StickerMesh.test.ts` | 定向函数测试 | 创建 |
| `src/cube/CubieMesh.ts` | cubie 组:body + 贴纸 + `syncFromState()` | 创建 |
| `src/cube/CubieMesh.test.ts` | 变换一致性测试(渲染 == 模型) | 创建 |
| `src/cube/SquareRenderer.ts` | 集成:26 CubieMesh + 3 面镜子 + sync 委托 | 修改 |
| `src/cube/Rotator.ts` | 操作对象从 SquareMesh 换成 CubieMesh | 修改 |
| `src/interaction/OrbitController.ts` | 拖拽旋转 cubeGroup(非相机)+ wheel 缩放 | 修改 |
| `src/app.ts` | Rotator/Controller 构造参数、reset 文案 | 修改 |
| `src/cube/CubeState.ts`、`src/cube/algorithm.ts`、`src/cfop/*`、`src/ui/*`、`src/anki/*` | 不动 | — |

> 说明:设计文档中 CubieMesh 原定放 SquareRenderer.ts,改为独立文件 `CubieMesh.ts`——因为变换一致性需要可单测的单元,且避免 SquareRenderer 过大。

---

### 任务 1:贴纸 → cubie 分组纯函数

**文件:**
- 修改:`src/cube/SquareData.ts`(文件末尾追加)
- 测试:`src/cube/SquareData.test.ts`(新建)

- [ ] **步骤 1:编写失败的测试**

```ts
// src/cube/SquareData.test.ts
import { describe, it, expect } from 'vitest';
import { createStickerElements, groupStickersIntoCubies } from './SquareData';

describe('groupStickersIntoCubies', () => {
  it('groups 54 stickers into 26 cubies', () => {
    const groups = groupStickersIntoCubies(createStickerElements());
    expect(groups.length).toBe(26);
    expect(groups.reduce((n, g) => n + g.stickerIndices.length, 0)).toBe(54);
  });

  it('cubie sticker counts match piece type (corner 3 / edge 2 / center 1)', () => {
    const groups = groupStickersIntoCubies(createStickerElements());
    for (const g of groups) {
      const abs = Math.abs(g.center.x) + Math.abs(g.center.y) + Math.abs(g.center.z);
      expect(g.stickerIndices.length).toBe(abs === 3 ? 3 : abs === 1 ? 1 : 2);
    }
  });

  it('never produces the invisible center (0,0,0) group', () => {
    const groups = groupStickersIntoCubies(createStickerElements());
    expect(groups.some((g) => g.center.x === 0 && g.center.y === 0 && g.center.z === 0)).toBe(false);
  });
});
```

- [ ] **步骤 2:运行测试验证失败**

运行:`npx vitest run src/cube/SquareData.test.ts`
预期:FAIL,报 "groupStickersIntoCubies is not exported" / "not a function"

- [ ] **步骤 3:编写最少实现代码**

```ts
// src/cube/SquareData.ts 末尾追加
/** A cubie: its integer center and the sticker indices belonging to it. */
export interface CubieGroup {
  center: { x: number; y: number; z: number };
  stickerIndices: number[];
}

/**
 * Partition the 54 stickers into 26 cubies by their cubie center
 * (sticker pos − 0.5 × normal, rounded). Same rule as CubeState.applyMove.
 */
export function groupStickersIntoCubies(elements: StickerElement[]): CubieGroup[] {
  const byKey = new Map<string, CubieGroup>();
  elements.forEach((el, i) => {
    const cx = Math.round(el.pos.x - 0.5 * el.normal.x);
    const cy = Math.round(el.pos.y - 0.5 * el.normal.y);
    const cz = Math.round(el.pos.z - 0.5 * el.normal.z);
    const key = `${cx},${cy},${cz}`;
    let g = byKey.get(key);
    if (!g) {
      g = { center: { x: cx, y: cy, z: cz }, stickerIndices: [] };
      byKey.set(key, g);
    }
    g.stickerIndices.push(i);
  });
  return [...byKey.values()];
}
```

- [ ] **步骤 4:运行测试验证通过**

运行:`npx vitest run src/cube/SquareData.test.ts`
预期:PASS(3 个用例)

- [ ] **步骤 5:Commit**

```bash
git add src/cube/SquareData.ts src/cube/SquareData.test.ts
git commit -m "feat: 贴纸到 cubie 分组纯函数"
```

---

### 任务 2:StickerMesh — 静态布局贴纸

**文件:**
- 创建:`src/cube/StickerMesh.ts`
- 测试:`src/cube/StickerMesh.test.ts`(新建)

贴纸改为"静态布局":位置/朝向是相对 cubie 中心的固定值,创建时设置一次,之后只更新颜色。材质双面、无黑背衬(黑色由 cubie body 提供)。

- [ ] **步骤 1:编写失败的测试**

```ts
// src/cube/StickerMesh.test.ts
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
```

- [ ] **步骤 2:运行测试验证失败**

运行:`npx vitest run src/cube/StickerMesh.test.ts`
预期:FAIL,模块不存在

- [ ] **步骤 3:编写最少实现代码**

```ts
// src/cube/StickerMesh.ts
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
```

- [ ] **步骤 4:运行测试验证通过**

运行:`npx vitest run src/cube/StickerMesh.test.ts`
预期:PASS(3 个用例)

- [ ] **步骤 5:Commit**

```bash
git add src/cube/StickerMesh.ts src/cube/StickerMesh.test.ts
git commit -m "feat: 静态布局贴纸 StickerMesh"
```

---

### 任务 3:CubieMesh — 立体方块组 + 模型同步

**文件:**
- 创建:`src/cube/CubieMesh.ts`
- 测试:`src/cube/CubieMesh.test.ts`(新建)

核心设计:`syncFromState` 完全从模型重建组变换——组位置 = 贴纸模型中心,组朝向 = `setFromUnitVectors(局部法线, 模型法线)`。贴纸局部布局创建时固定,永不重算。

- [ ] **步骤 1:编写失败的测试**

```ts
// src/cube/CubieMesh.test.ts
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
```

- [ ] **步骤 2:运行测试验证失败**

运行:`npx vitest run src/cube/CubieMesh.test.ts`
预期:FAIL,模块不存在

- [ ] **步骤 3:编写最少实现代码**

```ts
// src/cube/CubieMesh.ts
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
    const s0 = state[this.indices[0]];
    this.position.set(
      s0.pos.x - 0.5 * s0.normal.x,
      s0.pos.y - 0.5 * s0.normal.y,
      s0.pos.z - 0.5 * s0.normal.z,
    );
    this.quaternion.setFromUnitVectors(
      this.localNormals[0],
      new THREE.Vector3(s0.normal.x, s0.normal.y, s0.normal.z),
    );
    for (let k = 0; k < this.indices.length; k++) {
      const s = state[this.indices[k]];
      this.stickers[k].normal.set(s.normal.x, s.normal.y, s.normal.z);
      this.stickers[k].setColor(s.color);
    }
  }
}
```

- [ ] **步骤 4:运行测试验证通过**

运行:`npx vitest run src/cube/CubieMesh.test.ts`
预期:PASS(2 个用例)

- [ ] **步骤 5:Commit**

```bash
git add src/cube/CubieMesh.ts src/cube/CubieMesh.test.ts
git commit -m "feat: CubieMesh 立体方块组与模型同步"
```

---

### 任务 4:SquareRenderer 集成 — 26 cubie + 3 面镜子

**文件:**
- 修改:`src/cube/SquareRenderer.ts`(整文件重写,保留 scene/camera/renderer/灯光/raycaster/resize 骨架)

- [ ] **步骤 1:重写 SquareRenderer.ts**

```ts
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
      mirror.material.transparent = true;
      mirror.material.opacity = 0.7;
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
```

- [ ] **步骤 2:编译检查**

运行:`npx tsc --noEmit`
预期:无错误(`three/addons/objects/Reflector.js` 类型由 @types/three 提供)

- [ ] **步骤 3:手动验证渲染**

运行:`npm run dev`,浏览器打开 http://localhost:3000
预期:还原状态魔方为立体方块;默认视角下 U/F/R 三面彩色贴纸 + 左/后/下三面镜子中映出 L(橙)、B(绿)、D(白)贴纸;贴纸方向正确(顶面贴纸不横置);点击贴纸转层正常。

- [ ] **步骤 4:Commit**

```bash
git add src/cube/SquareRenderer.ts
git commit -m "feat: SquareRenderer 集成立体 cubie 与三面镜面反射"
```

---

### 任务 5:Rotator — 按 cubie 组旋转

**文件:**
- 修改:`src/cube/Rotator.ts`

- [ ] **步骤 1:重写 Rotator.ts**

```ts
// src/cube/Rotator.ts
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
    const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    const angle = this._targetAngle * eased;

    this._pivot.quaternion.identity();
    this._pivot.rotateOnWorldAxis(this._axis, angle);

    if (t >= 1.0) {
      this._pivot.quaternion.identity();
      this._pivot.rotateOnWorldAxis(this._axis, this._targetAngle);
      this._finish();
      return false;
    }
    return true;
  }

  private _finish(): void {
    for (const c of this._activeCubies) {
      this.parentGroup.attach(c);
    }
    this.parentGroup.remove(this._pivot!);
    this._pivot = null;
    this._activeCubies = [];
    this._rotating = false;
    this._onComplete?.();
    this._onComplete = null;
  }
}

export function hitToFace(sticker: { normal: THREE.Vector3 }): { normal: THREE.Vector3; dir: 1 | -1 } {
  return { normal: sticker.normal.clone(), dir: 1 };
}
```

- [ ] **步骤 2:编译检查**

运行:`npx tsc --noEmit`
预期:无错误

- [ ] **步骤 3:手动验证层旋转**

运行:`npm run dev`,点击任意面贴纸
预期:该层 9 个 cubie 整体旋转 90°,动画后位置精确(无漂移);镜面中反射同步更新;快速连点(队列)正常。

- [ ] **步骤 4:Commit**

```bash
git add src/cube/Rotator.ts
git commit -m "feat: Rotator 按 cubie 组旋转"
```

---

### 任务 6:OrbitController + app.ts — 拖拽转魔方

**文件:**
- 修改:`src/interaction/OrbitController.ts`
- 修改:`src/app.ts`

- [ ] **步骤 1:重写 OrbitController.ts**

```ts
// src/interaction/OrbitController.ts
import * as THREE from 'three';

const BASE_DIR = new THREE.Vector3(5, 4.5, 6).normalize();
const BASE_RADIUS = new THREE.Vector3(5, 4.5, 6).length(); // ≈ 8.9

/**
 * Drag rotates the CUBE (not the camera); mirrors stay fixed in world space.
 * Scroll zooms the camera along its fixed view direction.
 * Distinguishes click from drag via movement threshold.
 */
export class OrbitController {
  private cubeGroup: THREE.Group;
  private camera: THREE.PerspectiveCamera;
  private isDragging = false;
  private isClick = false;
  private startX = 0;
  private startY = 0;
  private lastX = 0;
  private lastY = 0;
  private radius = BASE_RADIUS;
  private onClickCallback: ((e: MouseEvent) => void) | null = null;
  private _enabled = true;

  private static readonly CLICK_THRESHOLD = 3; // px — max movement to count as click
  private static readonly Y_AXIS = new THREE.Vector3(0, 1, 0);
  private static readonly X_AXIS = new THREE.Vector3(1, 0, 0);

  constructor(cubeGroup: THREE.Group, camera: THREE.PerspectiveCamera) {
    this.cubeGroup = cubeGroup;
    this.camera = camera;
  }

  /** Wire input listeners to the renderer's canvas (called once by the app). */
  bindCanvas(canvas: HTMLElement): void {
    this._bindCanvas(canvas);
  }

  private _bindCanvas(canvas: HTMLElement | null): void {
    if (!canvas) return;
    canvas.addEventListener('mousedown', (e: MouseEvent) => this._onPointerDown(e));
    canvas.addEventListener('mousemove', (e: MouseEvent) => this._onPointerMove(e));
    canvas.addEventListener('mouseup', (e: MouseEvent) => this._onPointerUp(e));
    canvas.addEventListener('mouseleave', () => this._onCancel());

    canvas.addEventListener('touchstart', (e: TouchEvent) => {
      if (e.touches.length === 1) this._onPointerDown(e.touches[0]);
    }, { passive: false });
    canvas.addEventListener('touchmove', (e: TouchEvent) => {
      if (e.touches.length === 1) this._onPointerMove(e.touches[0]);
    });
    canvas.addEventListener('touchend', () => {
      const fakeEvent = { clientX: this.lastX, clientY: this.lastY } as MouseEvent;
      this._onPointerUp(fakeEvent);
    });

    canvas.addEventListener('wheel', (e: WheelEvent) => {
      if (!this._enabled) return;
      e.preventDefault();
      this.radius = Math.max(4, Math.min(20, this.radius + e.deltaY * 0.01));
      this._updateCamera();
    }, { passive: false });
  }

  /** Register a callback for clicks (not drags) on the canvas */
  onClick(cb: (e: MouseEvent) => void): void {
    this.onClickCallback = cb;
  }

  /** Reset the cube orientation (mirrors untouched). */
  reset(): void {
    this.cubeGroup.quaternion.identity();
  }

  setEnabled(enabled: boolean): void {
    this._enabled = enabled;
  }

  get enabled(): boolean {
    return this._enabled;
  }

  private _onPointerDown(e: MouseEvent | Touch): void {
    if (!this._enabled) return;
    this.isDragging = true;
    this.isClick = true;
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
  }

  private _onPointerMove(e: MouseEvent | Touch): void {
    if (!this.isDragging) return;
    const dx = e.clientX - this.lastX;
    const dy = e.clientY - this.lastY;
    this.lastX = e.clientX;
    this.lastY = e.clientY;

    const totalDx = e.clientX - this.startX;
    const totalDy = e.clientY - this.startY;
    if (Math.abs(totalDx) > OrbitController.CLICK_THRESHOLD ||
        Math.abs(totalDy) > OrbitController.CLICK_THRESHOLD) {
      this.isClick = false;
    }

    // Rotate the cube around world axes; mirrors and camera stay put.
    this.cubeGroup.rotateOnWorldAxis(OrbitController.Y_AXIS, dx * 0.005);
    this.cubeGroup.rotateOnWorldAxis(OrbitController.X_AXIS, dy * 0.005);
  }

  private _onPointerUp(e: MouseEvent): void {
    if (this.isClick && this.onClickCallback) {
      this.onClickCallback(e);
    }
    this.isDragging = false;
    this.isClick = false;
  }

  private _onCancel(): void {
    this.isDragging = false;
    this.isClick = false;
  }

  private _updateCamera(): void {
    this.camera.position.copy(BASE_DIR.clone().multiplyScalar(this.radius));
    this.camera.lookAt(0, 0, 0);
  }
}
```

- [ ] **步骤 2:修改 app.ts 适配新接口**

在 `src/app.ts` 的 `initApp()` 中替换:

```ts
  const controller = new OrbitController(renderer);
  controller.onClick((e: MouseEvent) => handleClick(e));
```

为:

```ts
  const controller = new OrbitController(renderer.cubeGroup, renderer.camera);
  controller.bindCanvas(renderer.renderer.domElement);
  controller.onClick((e: MouseEvent) => handleClick(e));
```

并把:

```ts
  rotator = new Rotator(renderer.squares);
```

为:

```ts
  rotator = new Rotator(renderer.cubies);
```

把重置按钮标题"点击重置镜头,再次点击锁定"改为"点击重置魔方,再次点击锁定"(两处标题字符串),行为不变(controller.reset() 现在重置魔方姿态)。

- [ ] **步骤 3:编译检查**

运行:`npx tsc --noEmit`
预期:无错误

- [ ] **步骤 4:手动验证全部交互**

运行:`npm run dev`
预期:
- 拖拽旋转**魔方**,镜子固定不动、反射内容实时更新
- 单击贴纸仍可转层(拖拽与点击区分正常)
- 滚轮缩放相机
- 重置按钮:魔方姿态归零,镜子不变
- 锁定按钮:拖拽禁用,点击转层不受影响(原逻辑)
- 公式播放 / Anki 模式动画正常(层旋转 + 每次 sync 后魔方姿态与模型一致)

- [ ] **步骤 5:全量测试 + Commit**

运行:`npm test`
预期:全部 PASS(现有 CubeState 测试 + 新增 3 个测试文件)

```bash
git add src/interaction/OrbitController.ts src/app.ts
git commit -m "feat: 拖拽旋转魔方,镜面固定"
```

---

## 自检记录

- **规格覆盖度:**
  - 立体 cubie(黑色方块 + 贴纸)→ 任务 2、3 ✓
  - 贴纸方向正确(显式基向量)→ 任务 2(stickerQuaternion)✓
  - 三面镜子反射 L/B/D → 任务 4 ✓
  - 镜子固定、不随魔方移动/旋转、不与魔方相交(3.0 > 2.6)→ 任务 4 注释 + 任务 6 ✓
  - 拖拽转魔方(非相机)→ 任务 6 ✓
  - 层旋转动画按 cubie 组 → 任务 5 ✓
  - 点击转层保留 → 任务 4(getIntersection)+ 任务 5(hitToFace)✓
  - 重置/锁定 → 任务 6 ✓
  - 性能 ponytail 备注(512 纹理,卡顿再降)→ 任务 4 注释 ✓
- **占位符扫描:** 无 TODO/待定;每步有真实代码 ✓
- **类型一致性:** `CubieMesh.indices`/`stickers`/`syncFromState(state)`、`StickerMesh.normal`/`layout`/`setColor`、`SquareRenderer.cubies`/`squares`/`cubeGroup`、`Rotator(cubies)`、`OrbitController(cubeGroup, camera)` + `bindCanvas`——任务间签名一致 ✓

## 已知简化(ponytail)

- 镜面纹理固定 512;若 Android 卡顿,降 256 或对 Reflector 的 onBeforeRender 做帧节流。
- OrbitController 的 wheel 缩放仅沿固定视角方向(非自由 orbit),与"拖拽转魔方"交互一致。
