import { describe, expect, test } from 'vitest';
import { recordSuccess, dueCards, addDays, todayStr } from './schedule';

describe('schedule', () => {
  test('new card first success starts at step 0, due tomorrow', () => {
    const cards: Record<string, any> = {};
    recordSuccess(cards, 'f2l-1', '2026-08-01');
    expect(cards['f2l-1']).toEqual({ step: 0, due: '2026-08-02' });
  });

  test('review success advances ladder: 1 -> 2 -> 4 days', () => {
    const cards = { a: { step: 0, due: '2026-08-02' } };
    recordSuccess(cards, 'a', '2026-08-02');
    expect(cards.a).toEqual({ step: 1, due: '2026-08-04' });
    recordSuccess(cards, 'a', '2026-08-04');
    expect(cards.a).toEqual({ step: 2, due: '2026-08-08' });
  });

  test('step caps at 30-day interval', () => {
    const cards = { a: { step: 5, due: '2026-01-01' } };
    recordSuccess(cards, 'a', '2026-08-05');
    expect(cards.a).toEqual({ step: 5, due: '2026-09-04' });
  });

  test('dueCards returns ids due on or before today', () => {
    const cards = {
      a: { step: 0, due: '2026-08-01' },
      b: { step: 1, due: '2026-08-03' },
      c: { step: 2, due: '2026-08-04' },
    };
    expect(dueCards(cards, '2026-08-03').sort()).toEqual(['a', 'b']);
  });

  test('addDays crosses month boundary', () => {
    expect(addDays('2026-01-30', 2)).toBe('2026-02-01');
  });

  test('todayStr pads month/day', () => {
    expect(todayStr(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
