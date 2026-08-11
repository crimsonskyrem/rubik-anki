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
