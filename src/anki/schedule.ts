// Ebbinghaus fixed-interval schedule: 1/2/4/7/15/30 days.
// A card is "new" while absent from `cards`. Only a successful recall
// mutates the schedule (recordSuccess); failures only re-queue in-session.

export interface CardState {
  /** Ladder index 0..5 (intervals 1/2/4/7/15/30 days). */
  step: number;
  /** Due date, YYYY-MM-DD (local). Due when <= today. */
  due: string;
}

export interface Schedule {
  /** Daily workload cap (1..20). */
  daily: number;
  cards: Record<string, CardState>;
  /** Date (YYYY-MM-DD) when today's scheduled queue was completed; '' = not done today. */
  lastDone: string;
}


export const LADDER = [1, 2, 4, 7, 15, 30];
const MAX_STEP = LADDER.length - 1;
const STORAGE_KEY = 'rubik-anki-schedule';
const DEFAULT_DAILY = 5;

export function todayStr(d: Date = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return todayStr(new Date(y, m - 1, d + days));
}

export function loadSchedule(): Schedule {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { daily: DEFAULT_DAILY, cards: {}, lastDone: '' };
    const p = JSON.parse(raw);
    const daily = typeof p.daily === 'number' && p.daily >= 1 && p.daily <= 20 ? p.daily : DEFAULT_DAILY;
    const lastDone = typeof p.lastDone === 'string' ? p.lastDone : '';
    const cards: Record<string, CardState> = {};
    if (p.cards && typeof p.cards === 'object') {
      for (const [id, c] of Object.entries(p.cards)) {
        const card = c as CardState;
        if (typeof card?.step === 'number' && typeof card?.due === 'string') cards[id] = card;
      }
    }
    return { daily, cards, lastDone };
  } catch {
    return { daily: DEFAULT_DAILY, cards: {}, lastDone: '' };

  }
}

export function saveSchedule(s: Schedule): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

/** Advance one ladder step after a successful recall; new card starts at step 0 (due tomorrow). */
export function recordSuccess(cards: Record<string, CardState>, id: string, today: string = todayStr()): void {
  const cur = cards[id];
  const nextStep = cur ? Math.min(cur.step + 1, MAX_STEP) : 0;
  cards[id] = { step: nextStep, due: addDays(today, LADDER[nextStep]) };
}

/** Mark a formula successfully recalled: load, advance, persist. */
export function markLearned(id: string): void {
  const s = loadSchedule();
  recordSuccess(s.cards, id);
  saveSchedule(s);
}

/** Record that today's scheduled queue was completed. */
export function markDone(): void {
  const s = loadSchedule();
  s.lastDone = todayStr();
  saveSchedule(s);
}

export function setDaily(n: number): void {
  const s = loadSchedule();
  s.daily = Math.min(20, Math.max(1, Math.round(n)));
  saveSchedule(s);
}


/** Clear all memory state (formulas become "new" again); keep daily setting. */
export function resetSchedule(): void {
  const s = loadSchedule();
  s.cards = {};
  s.lastDone = '';
  saveSchedule(s);
}


/** Ids of cards due on or before `today`. */
export function dueCards(cards: Record<string, CardState>, today: string = todayStr()): string[] {
  return Object.entries(cards).filter(([, c]) => c.due <= today).map(([id]) => id);
}
