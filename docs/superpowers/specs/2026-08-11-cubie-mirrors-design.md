# 立体 Cubie + 三面镜面反射 设计

日期:2026-08-11
状态:已批准(用户确认原型 v8 效果)

## 背景与目标

参考 Roofpig:魔方由 26 个立体方块(cubie)组成,从任意视角能看到侧面/背面朝外的贴纸。
当前项目只有 54 个平面贴纸(薄片),没有方块实体。

用户确认的目标效果(原型 v8):
1. **立体 cubie** — 每个 cubie 是黑色不透明方块 + 彩色贴纸,贴纸方向正确
2. **三面镜子** — 左/后/下三面固定镜子,反射看不到的 L、B、D 三面贴纸,从默认视角可看到全部 6 面
3. **镜子固定不动,只有魔方可旋转** — 拖拽旋转魔方(非相机),镜子保持世界坐标
4. 镜面远离魔方(3.0)、足够大(10×10),视角中看不到镜面边缘,且不与魔方相交

## 架构

模型层(CubeState,54 贴纸状态)完全不变。只改渲染层与交互层。

```
CubeState (54 贴纸) ──sync()──▶ SquareRenderer
                                   ├─ 26 × CubieMesh (Group: BoxGeometry + 贴纸)
                                   └─ 3 × Reflector (固定镜子)
Rotator ──按 cubie 组挂 pivot──▶ 旋转动画
OrbitController ──rotateOnWorldAxis──▶ cubeGroup (不再转相机)
```

## 组件设计

### 1. CubieMesh(新,放 SquareRenderer.ts)

- `THREE.Group` 子类:黑色 BoxGeometry(0.97, MeshStandardMaterial 不透明) + 1~3 张贴纸
- 贴纸:圆角矩形(复用现有 ShapeGeometry 代码),双面渲染(DoubleSide),显式基向量定向:
  - 局部 +z = 面法线;局部 +y(上)= 世界 y;U/D 面贴纸的上方向指向 z(±)
- 贴纸→cubie 映射创建时静态固定(角 3 / 棱 2 / 心 1,共 54),转动时整组移动,映射不变
- 暴露 `syncFromState(state)`:cubie 位置 = 组内任意贴纸 pos − 0.5×normal;贴纸 pos/normal/color 逐项更新

### 2. SquareRenderer 改造

- 构建 26 个 CubieMesh 挂到 cubeGroup;保留 `squares: SquareMesh[]`(54 扁平引用)供射线检测
- `sync(state)` 委托给各 CubieMesh
- 新增 3 个 Reflector(`three/addons/objects/Reflector`):
  - 左镜 (−3,0,0),rotation.y = π/2,映 L 面
  - 后镜 (0,0,−3),无旋转,映 B 面
  - 下镜 (0,−3,0),rotation.x = −π/2,映 D 面
  - PlaneGeometry(10,10),textureWidth/Height 512,color 0x556677,opacity 0.7(transparent)
  - 固定在世界坐标,不挂 cubeGroup

### 3. Rotator 改造

- 操作对象从 `SquareMesh[]` 换成 `CubieMesh[]`
- 分层判定:cubie 组中心位置(组 position)的轴坐标 ∈ layers
- pivot 挂载/卸载逻辑不变(attach 保持世界变换)

### 4. OrbitController 改造

- 拖拽 → `cubeGroup.rotateOnWorldAxis(y, dx·k)` + `rotateOnWorldAxis(x, dy·k)`
- 点击(未拖动)仍触发层旋转(handleClick 不变)
- 重置 = cubeGroup.quaternion 归零;锁定 = 禁用拖拽
- 相机保持默认位置 (5, 4.5, 6) lookAt 原点,不再可拖

### 5. app.ts

- reset/lock 按钮:重置/锁定魔方姿态(替代原"重置镜头")
- 其余状态机、公式动画、Anki 模式逻辑不变

## 数据流

1. 初始化:26 CubieMesh(含 54 贴纸) + 3 镜子 → `renderer.sync(solvedState())`
2. 点击贴纸:raycaster → SquareMesh → normal → MoveBase → Rotator.startRotation(按 cubie 组)
3. 动画完成 → `applyMove(state)` → `renderer.sync(state)`(cubie 位置 + 贴纸更新)
4. 拖拽:cubeGroup 旋转,镜子固定,Reflector 自动更新反射内容

## 错误处理 / 边界

- 魔方任意旋转后角块最远 2.6 < 镜面 3.0,永不相交
- 贴纸分组断言:26 组,贴纸总数 54(角 8×3 + 棱 12×2 + 心 6×1)
- Raycaster 递归检测贴纸(贴纸是 cubie 子节点,`intersectObjects(squares, true)` 不变)

## 性能

- 3 面镜子 = 每帧 3 次额外场景渲染(512 纹理)。
- `ponytail:` 先按 512 实现;若 Android 卡顿,降 256 或每 N 帧更新一次反射(Reflector 的 onBeforeRender 加节流)。

## 测试

- CubeState 模型测试不变(模型未动)
- 新增渲染层分组断言测试:26 cubie、54 贴纸、每组贴纸数 ∈ {1,2,3}
- 手动验证:还原状态 6 面可见、层旋转动画正常、拖拽旋转魔方镜子固定、重置/锁定正常

## 涉及文件

- `src/cube/SquareRenderer.ts` — CubieMesh + 镜子 + sync(主要改动)
- `src/cube/Rotator.ts` — 操作对象换 cubie 组
- `src/interaction/OrbitController.ts` — 拖拽转魔方
- `src/app.ts` — reset/lock 语义调整
- 模型/数据文件不动
