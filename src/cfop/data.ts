import { inverseAlgorithm } from '../cube/algorithm';
import type { Formula } from './types';

function f(
  id: string,
  category: Formula['category'],
  name: string,
  algorithm: string,
  description = '',
  inverseOverride?: string,
): Formula {
  return {
    id,
    category,
    name,
    algorithm,
    inverse: inverseOverride ?? inverseAlgorithm(algorithm),
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
  f('cross-01', 'cross', '白十字 - 标准', "F R U R' U' F'", '基础十字公式'),
  f('cross-02', 'cross', '白十字 - 对棱', "F U R U' R' F'", '对棱已在顶层'),
  f('cross-03', 'cross', '白十字 - 邻棱', "R' F R U F'", '邻棱位置'),
];

// ═══════════════════════════════════════
// F2L cases (41 standard cases, grouped)
// ═══════════════════════════════════════
const F2L: Formula[] = [
  // Basic insertion
  f('f2l-01', 'f2l', 'F2L #1 - 基础插入', "U R U' R'", '角块棱块在顶层，配对正确'),
  f('f2l-02', 'f2l', 'F2L #2 - 基础插入', "U' L' U L", '镜像情况'),
  f('f2l-03', 'f2l', 'F2L #3 - 分离插入', "R U R'", '角块棱块分开'),
  f('f2l-04', 'f2l', 'F2L #4 - 分离插入', "L' U' L", '镜像'),
  f('f2l-05', 'f2l', 'F2L #5 - 顶面配对', "U' R U R' U R U R'", '角块在槽位上方'),
  f('f2l-06', 'f2l', 'F2L #6 - 顶面配对', "U L' U' L U' L' U L", '镜像'),
  // Edge oriented wrong
  f('f2l-07', 'f2l', 'F2L #7 - 棱块翻转', "R U' R' U R U' R'", '白朝上'),
  f('f2l-08', 'f2l', 'F2L #8 - 棱块翻转', "L' U L U' L' U L", '镜像'),
  // Edge in slot
  f('f2l-09', 'f2l', 'F2L #9 - 槽内取出', "R U R' U' R U R' U' R U R'", '角块在槽内'),
  f('f2l-10', 'f2l', 'F2L #10 - 槽内取出', "R U' R' U R U' R' U2 R U' R'", '棱块在槽内'),
  // More F2L cases
  f('f2l-11', 'f2l', 'F2L #11 - 角在槽内', "R U' R' U' R U R' U2 R U' R'", '角在槽内，棱在顶层'),
  f('f2l-12', 'f2l', 'F2L #12 - 白朝侧面', "R U R' U' R U2 R' U' R U R'", '白朝侧面'),
  f('f2l-13', 'f2l', 'F2L #13 - 角块错位', "U R U' R' U' R U' R' U R U' R'", '角块在错误槽位'),
  f('f2l-14', 'f2l', 'F2L #14 - 棱角同色', "R U2 R' U' R U R'", '角棱同色相连'),
  f('f2l-15', 'f2l', 'F2L #15 - 角棱异色', "U' R U' R' U R U R'", '角棱异色相连'),
  f('f2l-16', 'f2l', 'F2L #16 - 白朝前', "R U' R' U2 R U R'", '白朝前，棱块在左'),
  f('f2l-17', 'f2l', 'F2L #17 - 白朝右', "U' R U R' U R U R'", '白朝右'),
  f('f2l-18', 'f2l', 'F2L #18 - 取出配对', "R U R' U2 R U' R' U R U' R'", '角块在槽，棱块在顶层'),
  f('f2l-19', 'f2l', 'F2L #19 - 配对分离', "U R U' R' U' R U R'", '角块和棱块对角'),
  f('f2l-20', 'f2l', 'F2L #20 - 槽内配对', "R U R' U' R U R' U' R U R'", '角块与棱块都在槽内'),
  // Additional cases for coverage
  f('f2l-21', 'f2l', 'F2L #21 - 棱块在上', "U' R U R' U2 R U' R'", '棱块在顶层，角块在槽'),
  f('f2l-22', 'f2l', 'F2L #22 - 角棱对角', "R U2 R' U R U R' U R U' R'", '角块棱块对角'),
  f('f2l-23', 'f2l', 'F2L #23 - 标准取出', "U R U' R' U2 R U' R'", '角块在顶层，棱块在顶层'),
  f('f2l-24', 'f2l', 'F2L #24 - 直接配对', "R U' R' U' R U' R' U R U' R'", '直接配对变体'),
  f('f2l-25', 'f2l', 'F2L #25 - 棱块翻面', "U' R U' R' U R U R'", '棱块需要翻面'),
  f('f2l-26', 'f2l', 'F2L #26 - 角块调整', "R U R' U R U' R'", '角块方向不对'),
  f('f2l-27', 'f2l', 'F2L #27 - 棱角配对', "U R U2 R' U R U' R'", '棱角在顶层需配对'),
  f('f2l-28', 'f2l', 'F2L #28 - 交叉插入', "R U' R' U R U2 R' U R U' R'", '交叉情况'),
  f('f2l-29', 'f2l', 'F2L #29 - 白朝上', "U2 R U R' U R U' R'", '白色朝上'),
  f('f2l-30', 'f2l', 'F2L #30 - 复杂配对', "R U' R' U2 R U R' U' R U R'", '复杂配对'),
  f('f2l-31', 'f2l', 'F2L #31 - 槽内恢复', "U' R U' R' U2 R U' R'", '从槽内恢复'),
  f('f2l-32', 'f2l', 'F2L #32 - 侧面对齐', "R U R' U' R U2 R'", '侧面已对齐'),
  f('f2l-33', 'f2l', 'F2L #33 - 顶层配对', "U' R U2 R' U R U R'", '在顶层已配对'),
  f('f2l-34', 'f2l', 'F2L #34 - 换槽', "R U R' U' R U2 R' U' R U R'", '换槽插入'),
  f('f2l-35', 'f2l', 'F2L #35 - 邻槽取出', "U R U' R' U R U2 R' U R U' R'", '从邻槽取出'),
  f('f2l-36', 'f2l', 'F2L #36 - 角棱错位', "R U R' U2 R U R' U' R U R'", '角棱都错位'),
  f('f2l-37', 'f2l', 'F2L #37 - 标准配对', "U' R U R' U' R U R' U R U' R'", '标准配对变体'),
  f('f2l-38', 'f2l', 'F2L #38 - 直接入槽', "R U' R' U' R U R' U2 R U' R'", '直接入槽'),
  f('f2l-39', 'f2l', 'F2L #39 - 角块翻转', "U R U' R' U2 R U R' U R U' R'", '角块需要翻转'),
  f('f2l-40', 'f2l', 'F2L #40 - 棱块对齐', "R U2 R' U' R U R' U' R U' R'", '棱块已对齐'),
  f('f2l-41', 'f2l', 'F2L #41 - 最终配对', "U' R U' R' U R U R' U R U' R'", '最终配对情况'),
];

// ═══════════════════════════════════════
// OLL cases (57) - authoritative algorithms + inverses.
// algorithm = 主公式 A; inverse = 逆公式 A⁻¹ (cross-checked by test).
// Parentheses are display-only; parseAlgorithm strips them.
// ═══════════════════════════════════════
const OLL: Formula[] = [
  f('oll-01', 'oll', 'OLL #1', "R U2 R' R' F R F' U2 R' F R F'", '点形 Dot', "F R' F' R U2 F R' F' R R U2 R'"),
  f('oll-02', 'oll', 'OLL #2', "r U r' U2 r U2 R' U2 R U' r'", '点形 Dot', "r U R' U2 R U2 r' U2 r U' r'"),
  f('oll-03', 'oll', 'OLL #3', "r' R2 U R' U r U2 r' U M'", '点形 Dot', "M U' r U2 r' U' R U' R2 r"),
  f('oll-04', 'oll', 'OLL #4', "M U' r U2 r' U' R U' R' M'", '点形 Dot', "M R U R' U r U2 r' U M'"),
  f('oll-05', 'oll', 'OLL #5', "l' U2 L U L' U l", '方形 Square', "l' U' L U' L' U2 l"),
  f('oll-06', 'oll', 'OLL #6', "r U2 R' U' R U' r'", '方形 Square', "r U R' U R U2 r'"),
  f('oll-07', 'oll', 'OLL #7', "r U R' U R U2 r'", '小闪电形', "r U2 R' U' R U' r'"),
  f('oll-08', 'oll', 'OLL #8', "l' U' L U' L' U2 l", '小闪电形', "l' U2 L U L' U l"),
  f('oll-09', 'oll', 'OLL #9', "R U R' U' R' F R2 U R' U' F'", '鱼形 Fish', "F U R U' R2 F' R U R U' R'"),
  f('oll-10', 'oll', 'OLL #10', "R U R' U R' F R F' R U2 R'", '鱼形 Fish', "R U2 R' F R' F' R U' R U' R'"),
  f('oll-11', 'oll', 'OLL #11', "r U R' U R' F R F' R U2 r'", '小闪电形', "r U2 R' F R' F' R U' R U' r'"),
  f('oll-12', 'oll', 'OLL #12', "M' R' U' R U' R' U2 R U' R r'", '小闪电形', "r R' U R' U2 R U R' U R M"),
  f('oll-13', 'oll', 'OLL #13', "F U R U' R2 F' R U R U' R'", '马步形 Knight', "R U R' U' R' F R2 U R' U' F'"),
  f('oll-14', 'oll', 'OLL #14', "R' F R U R' F' R F U' F'", '马步形 Knight', "F U F' R' F R U' R' F' R"),
  f('oll-15', 'oll', 'OLL #15', "l' U' l L' U' L U l' U l", '马步形 Knight', "l' U' l U' L' U L l' U l"),
  f('oll-16', 'oll', 'OLL #16', "r U r' R U R' U' r U' r'", '马步形 Knight', "r U r' U R U' R' r U' r'"),
  f('oll-17', 'oll', 'OLL #17', "F R' F' R2 r' U R U' R' U' M'", '点形 Dot', "M U R U R' U' r R2 F R F'"),
  f('oll-18', 'oll', 'OLL #18', "r U R' U R U2 r' r' U' R U' R' U2 r", '点形 Dot', "r' U2 R U R' U r r U2 R' U' R U' r'"),
  f('oll-19', 'oll', 'OLL #19', "r' R U R U R' U' M' R' F R F'", '点形 Dot', "F R' F' R M U R U' R' U' R' r"),
  f('oll-20', 'oll', 'OLL #20', "r U R' U' M2 U R U' R' U' M'", '点形 Dot', "M U R U R' U' M2 U R U' r'"),
  f('oll-21', 'oll', 'OLL #21', "R U2 R' U' R U R' U' R U' R'", '十字形 Cross', "R U R' U R U' R' U R U2 R'"),
  f('oll-22', 'oll', 'OLL #22', "R U2 (R2 U' R2 U' R2) U2 R", '十字形 Cross', "R' U2 R2 U R2 U R2 U2 R'"),
  f('oll-23', 'oll', 'OLL #23', "R2 D' R U2 R' D R U2 R", '十字形 Cross', "R' U2 R' D' R U2 R' D R2"),
  f('oll-24', 'oll', 'OLL #24', "r U R' U' r' F R F'", '十字形 Cross', "F R' F' r U R U' r'"),
  f('oll-25', 'oll', 'OLL #25', "F' r U R' U' r' F R", '十字形 Cross', "R' F' r U R U' r' F"),
  f('oll-26', 'oll', 'OLL #26', "(R U2 R') U' R U' R'", '十字形 Cross', "R U R' U R U2 R'"),
  f('oll-27', 'oll', 'OLL #27', "R U R' U R U2 R'", '十字形 Cross', "R U2 R' U' R U' R'"),
  f('oll-28', 'oll', 'OLL #28', "r U R' U' r' R U R U' R'", '角块已定向', "R U R' U' R' r U R U' r'"),
  f('oll-29', 'oll', 'OLL #29', "R U R' U' R U' R' F' U' F R U R'", '别扭形 Awkward', "R U' R' F' U F R U R' U R U' R'"),
  f('oll-30', 'oll', 'OLL #30', "F R' F R2 U' R' U' R U R' F2", '别扭形 Awkward', "F2 R U' R' U R U R2 F' R F'"),
  f('oll-31', 'oll', 'OLL #31', "R' U' F U R U' R' F' R", 'P 形', "R' F R U R' U' F' U R"),
  f('oll-32', 'oll', 'OLL #32', "L U F' U' L' U L F L'", 'P 形', "L F' L' U' L U F U' L'"),
  f('oll-33', 'oll', 'OLL #33', "R U R' U' R' F R F'", 'T 形', "F R' F' R U R U' R'"),
  f('oll-34', 'oll', 'OLL #34', "R U R2 U' R' F R U R U' F'", 'C 形', "F U R' U' R' F' R U R2 U' R'"),
  f('oll-35', 'oll', 'OLL #35', "R U2 R' R' F R F' R U2 R'", '鱼形 Fish', "R U2 R' F R' F' R R U2 R'"),
  f('oll-36', 'oll', 'OLL #36', "L' U' L U' L' U L U L F' L' F", 'W 形', "F' L F L' U' L' U' L U L' U L"),
  f('oll-37', 'oll', 'OLL #37', "F R' F' R U R U' R'", '鱼形 Fish', "R U R' U' R' F R F'"),
  f('oll-38', 'oll', 'OLL #38', "R U R' U R U' R' U' R' F R F'", 'W 形', "F R' F' R U R U R' U' R U' R'"),
  f('oll-39', 'oll', 'OLL #39', "L F' L' U' L U F U' L'", '大闪电形', "L U F' U' L' U L F L'"),
  f('oll-40', 'oll', 'OLL #40', "R' F R U R' U' F' U R", '大闪电形', "R' U' F U R U' R' F' R"),
  f('oll-41', 'oll', 'OLL #41', "R U R' U R U2 R' F R U R' U' F'", '别扭形 Awkward', "F U R U' R' F' R U2 R' U' R U' R'"),
  f('oll-42', 'oll', 'OLL #42', "R' U' R U' R' U2 R F R U R' U' F'", '别扭形 Awkward', "F U R U' R' F' R' U2 R U R' U R"),
  f('oll-43', 'oll', 'OLL #43', "F' U' L' U L F", 'P 形', "F' L' U' L U F"),
  f('oll-44', 'oll', 'OLL #44', "F U R U' R' F'", 'P 形', "F R U R' U' F'"),
  f('oll-45', 'oll', 'OLL #45', "F R U R' U' F'", 'T 形', "F U R U' R' F'"),
  f('oll-46', 'oll', 'OLL #46', "R' U' R' F R F' U R", 'C 形', "R' U' F R' F' R U R"),
  f('oll-47', 'oll', 'OLL #47', "R' U' R' F R F' R' F R F' U R", '小 L 形', "R' U' F R' F' R F R' F' R U R"),
  f('oll-48', 'oll', 'OLL #48', "F R U R' U' R U R' U' F'", '小 L 形', "F U R U' R' U R U' R' F'"),
  f('oll-49', 'oll', 'OLL #49', "r U' r2 U r2 U r2 U' r", '小 L 形', "r' U r2 U' r2 U' r2 U r'"),
  f('oll-50', 'oll', 'OLL #50', "r' U r2 U' r2 U' r2 U r'", '小 L 形', "r U' r2 U r2 U r2 U' r"),
  f('oll-51', 'oll', 'OLL #51', "F U R U' R' U R U' R' F'", 'I 形', "F R U R' U' R U R' U' F'"),
  f('oll-52', 'oll', 'OLL #52', "R U R' U R U' B U' B' R'", 'I 形', "R B U B' U R' U' R U' R'"),
  f('oll-53', 'oll', 'OLL #53', "l' U2 L U L' U' L U L' U l", '小 L 形', "l' U' L U' L' U L U' L' U2 l"),
  f('oll-54', 'oll', 'OLL #54', "(r U2 R' U') R U R' U' R U' r'", '小 L 形', "r U R' U R U' R' U R U2 r'"),
  f('oll-55', 'oll', 'OLL #55', "R' F R U R U' R2 F' R2 U' R' U R U R'", 'I 形', "R U' R' U' R U R2 F R2 U R' U' R' F' R"),
  f('oll-56', 'oll', 'OLL #56', "(r' U' r) U' R' U R U' R' U R r' U r", 'I 形', "r' U' r R' U' R U R' U' R U r' U r"),
  f('oll-57', 'oll', 'OLL #57', "R U R' U' M' U R U' r'", '角块已定向', "r U R' U' M U R U' R'"),
];

// ═══════════════════════════════════════
// PLL cases (21 cases)
// ═══════════════════════════════════════
const PLL: Formula[] = [
  f('pll-01', 'pll', 'PLL #1 - Ua', "R U' R U R U R U' R' U' R2", 'U 型顺时针三棱换'),
  f('pll-02', 'pll', 'PLL #2 - Ub', "R2 U R U R' U' R' U' R' U R'", 'U 型逆时针三棱换'),
  f('pll-03', 'pll', 'PLL #3 - H', "M2 U M2 U2 M2 U M2", 'H 型对棱换'),
  f('pll-04', 'pll', 'PLL #4 - Z', "M2 U M2 U M' U2 M2 U2 M'", 'Z 型邻棱换'),
  f('pll-05', 'pll', 'PLL #5 - Aa', "R' F R' B2 R F' R' B2 R2", 'A 型三角顺时针'),
  f('pll-06', 'pll', 'PLL #6 - Ab', "R2 B2 R F R' B2 R F' R", 'A 型三角逆时针'),
  f('pll-07', 'pll', 'PLL #7 - E', "R' U' R' D' R U' R' D R U R' D' R U R' D R2", 'E 型对角换'),
  f('pll-08', 'pll', 'PLL #8 - F', "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R", 'F 型'),
  f('pll-09', 'pll', 'PLL #9 - Ga', "R2 U R' U R' U' R U' R2 D U' R' U R D'", 'G 型 a'),
  f('pll-10', 'pll', 'PLL #10 - Gb', "R' U' R U D' R2 U R' U R U' R U' R2 D", 'G 型 b'),
  f('pll-11', 'pll', 'PLL #11 - Gc', "R2 U' R U' R U R' U R2 D' U R U' R' D", 'G 型 c'),
  f('pll-12', 'pll', 'PLL #12 - Gd', "R U R' U' D R2 U' R U' R' U R' U R2 D'", 'G 型 d'),
  f('pll-13', 'pll', 'PLL #13 - Ja', "R U R' F' R U R' U' R' F R2 U' R'", 'J 型 a'),
  f('pll-14', 'pll', 'PLL #14 - Jb', "R' U L' U2 R U' R' U2 R L", 'J 型 b'),
  f('pll-15', 'pll', 'PLL #15 - Na', "R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'", 'N 型 a'),
  f('pll-16', 'pll', 'PLL #16 - Nb', "R' U R U' R' F' U' F R U R' F R' F' R U' R", 'N 型 b'),
  f('pll-17', 'pll', 'PLL #17 - Ra', "R U' R' U' R U R D R' U' R D' R' U2 R'", 'R 型 a'),
  f('pll-18', 'pll', 'PLL #18 - Rb', "R' U2 R U2 R' F R U R' U' R' F' R2", 'R 型 b'),
  f('pll-19', 'pll', 'PLL #19 - T', "R U R' U' R' F R2 U' R' U' R U R' F'", 'T 型'),
  f('pll-20', 'pll', 'PLL #20 - V', "R' U R' U' R D' R' D R' U D' R2 U' R2 D R2", 'V 型'),
  f('pll-21', 'pll', 'PLL #21 - Y', "F R U' R' U' R U R' F' R U R' U' R' F R F'", 'Y 型'),
];
