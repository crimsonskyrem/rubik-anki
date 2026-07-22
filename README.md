# Rubik Anki

3D 魔方 CFOP 公式训练工具 — Web + Android 双平台，Three.js 渲染，支持点击旋转和公式动画。

## 功能

- **3D 魔方** — Three.js 渲染 26 个 cubie，拖拽旋转视角，点击面层旋转
- **CFOP 公式库** — 122 条公式（Cross 3 / F2L 41 / OLL 57 / PLL 21），点击逐步动画播放
- **双平台** — Web 浏览器直接运行，Android 通过 Capacitor 打包 APK

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器 (http://localhost:3000)
npm run dev
```

## 项目结构

```
rubik-anki/
├── index.html                  # 入口 HTML
├── src/
│   ├── main.ts                 # 入口
│   ├── app.ts                  # 应用初始化、点击交互、公式动画
│   ├── cube/
│   │   ├── algorithm.ts        # 算法解析（面/宽/中层/立方体旋转）
│   │   ├── CubeState.ts        # 54 贴纸状态模型（纯、不可变）
│   │   ├── SquareData.ts       # 贴纸几何数据
│   │   ├── SquareRenderer.ts   # Three.js 渲染器 + 射线检测
│   │   └── Rotator.ts          # 面层转动动画（泛化任意层集）
│   ├── interaction/
│   │   └── OrbitController.ts  # 拖拽旋转、滚轮缩放、点击检测
│   ├── cfop/
│   │   ├── types.ts            # Formula 类型定义
│   │   ├── data.ts             # 122 条 CFOP 公式
│   │   └── patterns.ts         # 图案生成工具
│   └── ui/
│       ├── FormulaPanel.ts     # 公式面板 UI
│       └── styles.css          # 响应式布局
├── android/                    # Capacitor Android 项目
├── .github/workflows/          # CI/CD
├── capacitor.config.json       # Capacitor 配置
├── vite.config.ts              # Vite 构建配置
└── tsconfig.json               # TypeScript 配置
```

## 构建与打包

### Web

```bash
npm run build    # 输出到 dist/
npm run preview  # 本地预览生产构建
```

### Android APK（本地）

前置条件：[Android Studio](https://developer.android.com/studio) + SDK。

```bash
npm run build
npx cap sync
npx cap open android
```

Android Studio 中：**Build → Build Bundle(s) / APK(s) → Build APK(s)**。

APK 输出：`android/app/build/outputs/apk/debug/app-debug.apk`（debug）或 `.../release/app-release.apk`（需 keystore）。

### Android APK（CI / GitHub Actions）

推送 tag 自动构建签名 release APK。

**触发**：推送 `v*` 格式的 tag（如 `v1.2.3`），版本号自动从 tag 提取（`versionName = 1.2.3`，`versionCode = 123`）。

**前置步骤**（一次性配置）：
1. 生成 keystore：`keytool -genkey -v -keystore rubik-anki.keystore -alias rubikanki -keyalg RSA -keysize 2048 -validity 10000`
2. 编码：`base64 rubik-anki.keystore > rubik-anki.keystore.b64`
3. 在 GitHub 仓库 `Settings → Secrets and variables → Actions` 添加 4 个 secrets：

| Secret | 值 |
|---|---|
| `KEYSTORE_BASE64` | `rubik-anki.keystore.b64` 的全部内容 |
| `KEYSTORE_PASSWORD` | keystore 密码 |
| `KEY_ALIAS` | `rubikanki` |
| `KEY_PASSWORD` | key 密码 |

**发布**：
```bash
git tag v1.2.3
git push origin v1.2.3
```
Action 跑完后在 Actions 页的 Artifacts 区下载 `app-release` APK。

### 测试

```bash
npm test         # 单次运行（vitest）
npm run test:watch  # 监听模式
```

### 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动 Web 开发服务器 |
| `npm run build` | tsc + vite 生产构建 |
| `npm test` | 运行测试 |
| `npm run cap:sync` | 同步 Web 资源到 Android |
| `npm run cap:open` | 在 Android Studio 打开项目 |

## 技术栈

- **3D 渲染** — [Three.js](https://threejs.org/)
- **构建工具** — [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **移动端打包** — [Capacitor](https://capacitorjs.com/)

## License

ISC
