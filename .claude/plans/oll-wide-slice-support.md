# Plan: OLL 初始状态用提供的逆公式 + 宽/中层转动支持

## 目标
用用户提供的 57 条 OLL「逆公式 A⁻¹」生成初始图案。要求 parser/模型/动画都支持
`r` `l`（宽转动）、`M`（中层），并替换占位 OLL 数据。

## 关键事实（已核实）
- 当前 `data.ts` OLL 段是占位假数据（重复、分组乱、和表对不上）-> 必须**整体替换**为表里的 57 条。
- `inverseAlgorithm` 是纯语法（倒序 + 每步取逆）。只要 parser 把 `r/l/M` 当独立 base，自动算出的逆公式 = 用户表里的 A⁻¹（#1/#2/#3/#22 已验证）。
- OLL 主公式 A 也含 `r/l/M` -> 动画（`Rotator`）也必须支持，否则求解动画会把 `r` 播成 `R`、丢 `M`，半坏。
- 表里只有 faces + `r/l/M` + 括号。无 `f/b/u/d` 宽、无 `x/y`、无 `E/S`。
- PLL 有 `x/y/f/M`，**本次不动**（超出 OLL 范围，列为后续）。

## 改动（6 文件）

### 1. `src/cube/algorithm.ts` - parser 扩展
- `MoveBase = 'U'|'D'|'R'|'L'|'F'|'B'|'r'|'l'|'M'`（大小写敏感，`r`≠`R`）。
- `Move = { base: MoveBase; dir: 1|-1|2 }`。
- `parseAlgorithm`：先剥掉 `(` `)`（分组括号），再按空白拆分；正则 `/^([URFDLBrlM])(['']|2)?$/`。
- `inverseAlgorithm`：不变（base 保持，dir 翻转：1↔-1，2->2）。`r` 的逆是 `r'`，不是 `R'`。

### 2. `src/cube/CubeState.ts` - 模型扩展（单一 MoveDef 表）
新增 `MOVE_DEF: Record<MoveBase, {axis: Vec3; axisIdx:'x'|'y'|'z'; layers:number[]}>`：
```
U: axis(0,1,0)  y [1]      D: axis(0,1,0)  y [-1]
R: axis(-1,0,0) x [1]      L: axis(1,0,0)  x [-1]
F: axis(0,0,-1) z [1]      B: axis(0,0,1)  z [-1]
r: axis(-1,0,0) x [0,1]    # R + M'，R 方向，两层
l: axis(1,0,0)  x [-1,0]   # L + M，L 方向，两层
M: axis(1,0,0)  x [0]      # 中层，L 方向
```
face 的 axis/layers 与现有 `FACE_INFO` 完全一致（手向性测试不破）。
- `applyMove(state, move)`：查 `MOVE_DEF[move.base]`，选 `round(center[axisIdx]) ∈ layers` 的贴纸，绕 axis 转 `turns` 次（dir:1->1, -1->3, 2->2）。`rotate90`/`norm` 复用。
- 删旧 `FACE_INFO`，导出 `getMoveDef(base)` 供 app.ts 用。

### 3. `src/cube/Rotator.ts` - 动画泛化
- `startRotation(axis: THREE.Vector3, layers: number[], dir: 1|-1, onComplete?)`。
  - axisIdx 从 axis 推；选 `round(temPos[axisIdx]) ∈ layers` 的贴纸进 pivot；绕 axis 转 `dir*90°`。
- 删 `FACE_AXES`/`getRotationParams`（旋向已由传入的 axis 携带）。
- 删 `activeSquares.length !== 21` 断言（宽=33、中层=12，不再恒为 21）。
- `_finish` 仍只 reparent + `onComplete`（真值由 app.ts `applyMove+sync` 提交）。

### 4. `src/app.ts` - 队列接线
- `QueuedMove = { move: Move; axis: THREE.Vector3; layers: number[] }`。
- `enqueueMove(move)`：`getMoveDef(move.base)` -> 转 THREE.Vector3 axis；dir 2 拆两个 dir 1。
- `playNextMove`：`rotator.startRotation(axis, layers, dir, () => { state = applyMove(state, move); renderer.sync(state); ... })`。
- `applyFormulaNow` 不变（`applyAlgorithm(solved, inverse)` + 入队 algorithm）。
- `handleClick` 用 `getMoveDef` 拿 axis/layers（free play 仍只 6 面）。
- 删 `MOVE_TO_NORMAL`/`faceFromNormal`，改用 `getMoveDef` + 反查 base。

### 5. `src/cfop/data.ts` - 替换 OLL
- `f()` 增可选 `inverseOverride?: string`（`inverse: inverseOverride ?? inverseAlgorithm(algorithm)`）。
- OLL 数组替换为 57 条：`algorithm` = 主公式 A（剥括号后），`inverse` = 逆公式 A⁻¹（显式传入），`name` = `OLL #<n>`，`description` = 分组。
- CROSS/F2L/PLL 不动。

### 6. `src/cube/CubeState.test.ts` - 测试
- 现有 136 个测试：face 手向性/往返/属性仍过（face 约定不变）。
- 新增 `r/l/M` 手向性已知答案（钉旋向，往返抓不到）：
  - `r`：UFR 角块 R 贴纸 (1.5,1,1) -> (1.5,1,-1)；UF 中棱 (0,1,1)->(0,1,-1)。
  - `M`：UF 中棱 (0,1,1) -> (0,-1,1)（L 方向）。
  - `l`：镜像。
- 新增 OLL 逆公式交叉校验：每条 OLL `expect(f.inverse).toBe(inverseAlgorithm(f.algorithm))`，抓录入笔误。
- 往返测试自动覆盖全部 57 条新 OLL（含 r/l/M）。

## 旋向约定（已与现有 face 对齐）
`r = R + M'`（R 方向，layer {0,1}）；`l = L + M`（L 方向，layer {-1,0}）；`M` = L 方向 layer {0}。
turns: dir 1->+90°×1, -1->+90°×3, 2->+90°×2（绕 axis）。Rotator 按 dir×90° 绕同一 axis 转，与模型一致。

## 不在范围
- PLL 的 `x/y/f`（需整体旋转 + 宽 F）--后续任务。
- `f/b/u/d` 宽、`E/S` 中层--YAGNI，OLL 不需要。

## 验收
- `npm test` 全绿（含新 r/l/M 手向性 + OLL 逆公式交叉校验 + 全 57 OLL 往返）。
- `npm run build`（strict tsc）通过。
- `npm run dev` 眼看：含 r/M 的 OLL 初始图案正确、解法动画正确解到复原。
