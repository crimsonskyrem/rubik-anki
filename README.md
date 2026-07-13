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
│   │   ├── constants.ts        # 面颜色、索引、旋转轴常量
│   │   ├── Cube.ts             # 54 贴纸状态模型 + 算法解析
│   │   └── renderer.ts         # Three.js 渲染器 + 射线检测 + 转动动画
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
├── capacitor.config.json       # Capacitor 配置
├── vite.config.ts              # Vite 构建配置
└── tsconfig.json               # TypeScript 配置
```

## 构建与打包

### Web 生产构建

```bash
npm run build     # 输出到 dist/
npm run preview   # 本地预览生产构建
```

### Android APK

前置条件：安装 [Android Studio](https://developer.android.com/studio) 并配置好 SDK。

```bash
# 1. 构建 Web 资源
npm run build

# 2. 同步到 Android 项目
npx cap sync

# 3. 打开 Android Studio 编译 APK
npx cap open android
```

在 Android Studio 中：**Build → Build Bundle(s) / APK(s) → Build APK(s)**。

APK 输出路径：`android/app/build/outputs/apk/debug/app-debug.apk`

### 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动 Web 开发服务器 |
| `npm run build` | TypeScript 编译 + Vite 生产构建 |
| `npm run preview` | 本地预览生产构建 |
| `npm run cap:sync` | 同步 Web 资源到 Android 项目 |
| `npm run cap:open` | 在 Android Studio 中打开项目 |

## 技术栈

- **3D 渲染** — [Three.js](https://threejs.org/)
- **构建工具** — [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **移动端打包** — [Capacitor](https://capacitorjs.com/)

## License

ISC
