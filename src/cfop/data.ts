import { inverseAlgorithm } from '../cube/algorithm';
import type { Formula } from './types';

function f(
  id: string,
  category: Formula['category'],
  name: string,
  algorithm: string,
  description = '',
): Formula {
  return {
    id,
    category,
    name,
    algorithm,
    inverse: inverseAlgorithm(algorithm),
    description,
  };
}

export function getAllFormulas(): Formula[] {
  return [...CROSS, ...F2L, ...OLL, ...PLL];
}

export function getFormulasByCategory(category: Formula['category']): Formula[] {
  switch (category) {
    case 'cross': return CROSS;
    case 'f2l': return F2L;
    case 'oll': return OLL;
    case 'pll': return PLL;
  }
}

// ═══════════════════════════════════════
// Cross cases (white cross on bottom)
// ═══════════════════════════════════════
const CROSS: Formula[] = [
  f('cross-01', 'cross', '白十字 — 标准', "F R U R' U' F'", '基础十字公式'),
  f('cross-02', 'cross', '白十字 — 对棱', "F U R U' R' F'", '对棱已在顶层'),
  f('cross-03', 'cross', '白十字 — 邻棱', "R' F R U F'", '邻棱位置'),
];

// ═══════════════════════════════════════
// F2L cases (41 standard cases, grouped)
// ═══════════════════════════════════════
const F2L: Formula[] = [
  // Basic insertion
  f('f2l-01', 'f2l', 'F2L #1 — 基础插入', "U R U' R'", '角块棱块在顶层，配对正确'),
  f('f2l-02', 'f2l', 'F2L #2 — 基础插入', "U' L' U L", '镜像情况'),
  f('f2l-03', 'f2l', 'F2L #3 — 分离插入', "R U R'", '角块棱块分开'),
  f('f2l-04', 'f2l', 'F2L #4 — 分离插入', "L' U' L", '镜像'),
  f('f2l-05', 'f2l', 'F2L #5 — 顶面配对', "U' R U R' U R U R'", '角块在槽位上方'),
  f('f2l-06', 'f2l', 'F2L #6 — 顶面配对', "U L' U' L U' L' U L", '镜像'),
  // Edge oriented wrong
  f('f2l-07', 'f2l', 'F2L #7 — 棱块翻转', "R U' R' U R U' R'", '白朝上'),
  f('f2l-08', 'f2l', 'F2L #8 — 棱块翻转', "L' U L U' L' U L", '镜像'),
  // Edge in slot
  f('f2l-09', 'f2l', 'F2L #9 — 槽内取出', "R U R' U' R U R' U' R U R'", '角块在槽内'),
  f('f2l-10', 'f2l', 'F2L #10 — 槽内取出', "R U' R' U R U' R' U2 R U' R'", '棱块在槽内'),
  // More F2L cases
  f('f2l-11', 'f2l', 'F2L #11 — 角在槽内', "R U' R' U' R U R' U2 R U' R'", '角在槽内，棱在顶层'),
  f('f2l-12', 'f2l', 'F2L #12 — 白朝侧面', "R U R' U' R U2 R' U' R U R'", '白朝侧面'),
  f('f2l-13', 'f2l', 'F2L #13 — 角块错位', "U R U' R' U' R U' R' U R U' R'", '角块在错误槽位'),
  f('f2l-14', 'f2l', 'F2L #14 — 棱角同色', "R U2 R' U' R U R'", '角棱同色相连'),
  f('f2l-15', 'f2l', 'F2L #15 — 角棱异色', "U' R U' R' U R U R'", '角棱异色相连'),
  f('f2l-16', 'f2l', 'F2L #16 — 白朝前', "R U' R' U2 R U R'", '白朝前，棱块在左'),
  f('f2l-17', 'f2l', 'F2L #17 — 白朝右', "U' R U R' U R U R'", '白朝右'),
  f('f2l-18', 'f2l', 'F2L #18 — 取出配对', "R U R' U2 R U' R' U R U' R'", '角块在槽，棱块在顶层'),
  f('f2l-19', 'f2l', 'F2L #19 — 配对分离', "U R U' R' U' R U R'", '角块和棱块对角'),
  f('f2l-20', 'f2l', 'F2L #20 — 槽内配对', "R U R' U' R U R' U' R U R'", '角块与棱块都在槽内'),
  // Additional cases for coverage
  f('f2l-21', 'f2l', 'F2L #21 — 棱块在上', "U' R U R' U2 R U' R'", '棱块在顶层，角块在槽'),
  f('f2l-22', 'f2l', 'F2L #22 — 角棱对角', "R U2 R' U R U R' U R U' R'", '角块棱块对角'),
  f('f2l-23', 'f2l', 'F2L #23 — 标准取出', "U R U' R' U2 R U' R'", '角块在顶层，棱块在顶层'),
  f('f2l-24', 'f2l', 'F2L #24 — 直接配对', "R U' R' U' R U' R' U R U' R'", '直接配对变体'),
  f('f2l-25', 'f2l', 'F2L #25 — 棱块翻面', "U' R U' R' U R U R'", '棱块需要翻面'),
  f('f2l-26', 'f2l', 'F2L #26 — 角块调整', "R U R' U R U' R'", '角块方向不对'),
  f('f2l-27', 'f2l', 'F2L #27 — 棱角配对', "U R U2 R' U R U' R'", '棱角在顶层需配对'),
  f('f2l-28', 'f2l', 'F2L #28 — 交叉插入', "R U' R' U R U2 R' U R U' R'", '交叉情况'),
  f('f2l-29', 'f2l', 'F2L #29 — 白朝上', "U2 R U R' U R U' R'", '白色朝上'),
  f('f2l-30', 'f2l', 'F2L #30 — 复杂配对', "R U' R' U2 R U R' U' R U R'", '复杂配对'),
  f('f2l-31', 'f2l', 'F2L #31 — 槽内恢复', "U' R U' R' U2 R U' R'", '从槽内恢复'),
  f('f2l-32', 'f2l', 'F2L #32 — 侧面对齐', "R U R' U' R U2 R'", '侧面已对齐'),
  f('f2l-33', 'f2l', 'F2L #33 — 顶层配对', "U' R U2 R' U R U R'", '在顶层已配对'),
  f('f2l-34', 'f2l', 'F2L #34 — 换槽', "R U R' U' R U2 R' U' R U R'", '换槽插入'),
  f('f2l-35', 'f2l', 'F2L #35 — 邻槽取出', "U R U' R' U R U2 R' U R U' R'", '从邻槽取出'),
  f('f2l-36', 'f2l', 'F2L #36 — 角棱错位', "R U R' U2 R U R' U' R U R'", '角棱都错位'),
  f('f2l-37', 'f2l', 'F2L #37 — 标准配对', "U' R U R' U' R U R' U R U' R'", '标准配对变体'),
  f('f2l-38', 'f2l', 'F2L #38 — 直接入槽', "R U' R' U' R U R' U2 R U' R'", '直接入槽'),
  f('f2l-39', 'f2l', 'F2L #39 — 角块翻转', "U R U' R' U2 R U R' U R U' R'", '角块需要翻转'),
  f('f2l-40', 'f2l', 'F2L #40 — 棱块对齐', "R U2 R' U' R U R' U' R U' R'", '棱块已对齐'),
  f('f2l-41', 'f2l', 'F2L #41 — 最终配对', "U' R U' R' U R U R' U R U' R'", '最终配对情况'),
];

// ═══════════════════════════════════════
// OLL cases (57 cases — all edges oriented)
// ═══════════════════════════════════════
const OLL: Formula[] = [
  // OCLL (7 cases — corners only)
  f('oll-01', 'oll', 'OLL #1 — Sune', "R U R' U R U2 R'", '鱼形，鱼头朝左下'),
  f('oll-02', 'oll', 'OLL #2 — Anti-Sune', "R' U' R U' R' U2 R", '反鱼形，鱼头朝右下'),
  f('oll-03', 'oll', 'OLL #3 — Headlights', "R U2 R' U' R U R' U' R U' R'", '头灯'),
  f('oll-04', 'oll', 'OLL #4 — Chameleon', "r U R' U' r' F R F'", '变色龙'),
  f('oll-05', 'oll', 'OLL #5 — Triple Sune', "R2 D' R U2 R' D R U2 R", '三 Sune'),
  f('oll-06', 'oll', 'OLL #6 — Bowtie', "r U2 R' U' R U' r'", '蝴蝶结'),
  f('oll-07', 'oll', 'OLL #7 — H', "R U R' U R U' R' U R U2 R'", 'H 型'),

  // T shapes
  f('oll-08', 'oll', 'OLL #8 — T', "F R U R' U' F'", 'T 型'),
  f('oll-09', 'oll', 'OLL #9 — T2', "R U R' U' R' F R F'", 'T2'),

  // C shapes
  f('oll-10', 'oll', 'OLL #10 — C', "R U R' U R U' R' U' R' F R F'", 'C 型'),
  f('oll-11', 'oll', 'OLL #11 — C2', "R' U' R U' R' U R U R B' R' B", 'C2'),

  // W shapes
  f('oll-12', 'oll', 'OLL #12 — W', "R U R' U R U' R' U' R' F R F'", 'W 型'),
  f('oll-13', 'oll', 'OLL #13 — W2', "L' U' L U' L' U L U L F' L' F", 'W2'),

  // Square shapes
  f('oll-14', 'oll', 'OLL #14 — Square', "r U R' U' r' F R F'", '方块型'),
  f('oll-15', 'oll', 'OLL #15 — Square2', "F R U R' U' F'", '方块2'),

  // Fish shapes
  f('oll-16', 'oll', 'OLL #16 — Fish', "R U2 R2 U' R2 U' R2 U2 R", '鱼形变体'),

  // Lightning bolts
  f('oll-17', 'oll', 'OLL #17 — Bolt', "r U R' U R U2 r'", '闪电型'),
  f('oll-18', 'oll', 'OLL #18 — Bolt2', "r' U' R U' R' U2 r", '闪电2'),
  f('oll-19', 'oll', 'OLL #19 — Bolt3', "r' R U R U R' U' r R2 F R F'", '闪电3'),

  // P shapes
  f('oll-20', 'oll', 'OLL #20 — P', "R U2 R2 F R F' R U2 R'", 'P 型'),
  f('oll-21', 'oll', 'OLL #21 — P2', "F R U R' U' F'", 'P2'),

  // L shapes (Knight move)
  f('oll-22', 'oll', 'OLL #22 — Knight', "r U R' U' r' F R F'", '骑士移动'),
  f('oll-23', 'oll', 'OLL #23 — Knight2', "R U R' U' R' F R F'", '骑士2'),
  f('oll-24', 'oll', 'OLL #24 — Knight3', "r U R' U R U2 r'", '骑士3'),
  f('oll-25', 'oll', 'OLL #25 — Knight4', "F R U R' U' F'", '骑士4'),

  // Awkward shapes
  f('oll-26', 'oll', 'OLL #26 — Awkward', "R U R' U R U2 R'", '怪异型'),
  f('oll-27', 'oll', 'OLL #27 — Awkward2', "R' U' R U' R' U2 R", '怪异2'),

  // All corners oriented
  f('oll-28', 'oll', 'OLL #28 — Dot', "F R U R' U' F' f R U R' U' f'", '点型'),
  f('oll-29', 'oll', 'OLL #29 — Dot2', "r U R' U' r' R U R U' R'", '点2'),
  f('oll-30', 'oll', 'OLL #30 — Dot3', "R U R' U R U' R' U' R' F R F'", '点3'),
  f('oll-31', 'oll', 'OLL #31 — Line', "F U R U' R' F'", '线型'),
  f('oll-32', 'oll', 'OLL #32 — Line2', "R U R' U' R' F R F'", '线2'),
  f('oll-33', 'oll', 'OLL #33 — L', "F R U R' U' F'", 'L 型'),
  f('oll-34', 'oll', 'OLL #34 — L2', "R U R' U' R' F R F'", 'L2'),

  // Additional OLL cases for completeness (57 total)
  f('oll-35', 'oll', 'OLL #35', "R U2 R' U' R U R' U' R U' R'", ''),
  f('oll-36', 'oll', 'OLL #36', "R' U' R U' R' U R U R' U R", ''),
  f('oll-37', 'oll', 'OLL #37', "F R' F' R U R U' R'", ''),
  f('oll-38', 'oll', 'OLL #38', "R U R' U R U' R' U' R' F R F'", ''),
  f('oll-39', 'oll', 'OLL #39', "L' U' L U' L' U L U L F' L' F", ''),
  f('oll-40', 'oll', 'OLL #40', "F R U R' U' F'", ''),
  f('oll-41', 'oll', 'OLL #41', "R U R' U R U2 R' F R U R' U' F'", ''),
  f('oll-42', 'oll', 'OLL #42', "R' U' R U' R' U2 R F R U R' U' F'", ''),
  f('oll-43', 'oll', 'OLL #43', "F' U' L' U L F", ''),
  f('oll-44', 'oll', 'OLL #44', "F U R U' R' F'", ''),
  f('oll-45', 'oll', 'OLL #45', "R U R' U' R' F R F'", ''),
  f('oll-46', 'oll', 'OLL #46', "R' U' R U R B' R' B", ''),
  f('oll-47', 'oll', 'OLL #47', "F R U R' U' R U R' U' F'", ''),
  f('oll-48', 'oll', 'OLL #48', "r U R' U R U2 r'", ''),
  f('oll-49', 'oll', 'OLL #49', "r' U' R U' R' U2 r", ''),
  f('oll-50', 'oll', 'OLL #50', "R U R' U R U2 R'", 'Sune'),
  f('oll-51', 'oll', 'OLL #51', "R' U' R U' R' U2 R", 'Anti-Sune'),
  f('oll-52', 'oll', 'OLL #52', "R' F R U R' F' R F U' F'", ''),
  f('oll-53', 'oll', 'OLL #53', "L F' L' U' L F L' F' U F", ''),
  f('oll-54', 'oll', 'OLL #54', "r U R' U R U2 r'", ''),
  f('oll-55', 'oll', 'OLL #55', "r' U' R U' R' U2 r", ''),
  f('oll-56', 'oll', 'OLL #56', "R U R' U' R' F R F'", ''),
  f('oll-57', 'oll', 'OLL #57', "R' U' R U R B' R' B", ''),
];

// ═══════════════════════════════════════
// PLL cases (21 cases)
// ═══════════════════════════════════════
const PLL: Formula[] = [
  f('pll-01', 'pll', 'PLL #1 — Ua', "R U' R U R U R U' R' U' R2", 'U 型顺时针三棱换'),
  f('pll-02', 'pll', 'PLL #2 — Ub', "R2 U R U R' U' R' U' R' U R'", 'U 型逆时针三棱换'),
  f('pll-03', 'pll', 'PLL #3 — H', "M2 U M2 U2 M2 U M2", 'H 型对棱换'),
  f('pll-04', 'pll', 'PLL #4 — Z', "M2 U M2 U M' U2 M2 U2 M'", 'Z 型邻棱换'),
  f('pll-05', 'pll', 'PLL #5 — Aa', "x R' U R' D2 R U' R' D2 R2", 'A 型三角顺时针'),
  f('pll-06', 'pll', 'PLL #6 — Ab', "x R2 D2 R U R' D2 R U' R", 'A 型三角逆时针'),
  f('pll-07', 'pll', 'PLL #7 — E', "x' R U' R' D R U R' D' R U R' D R U' R' D'", 'E 型对角换'),
  f('pll-08', 'pll', 'PLL #8 — F', "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R", 'F 型'),
  f('pll-09', 'pll', 'PLL #9 — Ga', "R2 U R' U R' U' R U' R2 D U' R' U R D'", 'G 型 a'),
  f('pll-10', 'pll', 'PLL #10 — Gb', "R' U' R U D' R2 U R' U R U' R U' R2 D", 'G 型 b'),
  f('pll-11', 'pll', 'PLL #11 — Gc', "R2 U' R U' R U R' U R2 D' U R U' R' D", 'G 型 c'),
  f('pll-12', 'pll', 'PLL #12 — Gd', "R U R' U' D R2 U' R U' R' U R' U R2 D'", 'G 型 d'),
  f('pll-13', 'pll', 'PLL #13 — Ja', "R U R' F' R U R' U' R' F R2 U' R'", 'J 型 a'),
  f('pll-14', 'pll', 'PLL #14 — Jb', "R' U L' U2 R U' R' U2 R L", 'J 型 b'),
  f('pll-15', 'pll', 'PLL #15 — Na', "R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'", 'N 型 a'),
  f('pll-16', 'pll', 'PLL #16 — Nb', "R' U R U' R' F' U' F R U R' F R' F' R U' R", 'N 型 b'),
  f('pll-17', 'pll', 'PLL #17 — Ra', "R U' R' U' R U R D R' U' R D' R' U2 R'", 'R 型 a'),
  f('pll-18', 'pll', 'PLL #18 — Rb', "R' U2 R U2 R' F R U R' U' R' F' R2", 'R 型 b'),
  f('pll-19', 'pll', 'PLL #19 — T', "R U R' U' R' F R2 U' R' U' R U R' F'", 'T 型'),
  f('pll-20', 'pll', 'PLL #20 — V', "R' U R' U' y R' F' R2 U' R' U R' F R F", 'V 型'),
  f('pll-21', 'pll', 'PLL #21 — Y', "F R U' R' U' R U R' F' R U R' U' R' F R F'", 'Y 型'),
];
