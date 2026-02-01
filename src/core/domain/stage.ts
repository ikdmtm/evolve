export type Level = number; // 0..10

export type DayInput = {
  date: string; // YYYY-MM-DD
  isRestDay: boolean;
  didActivity: boolean; // true if ANY workout exists on that day
};

export function clampLevel(level: number): Level {
  if (level < 0) return 0;
  if (level > 10) return 10;
  return level;
}

export function nextLevel(prev: Level, day: DayInput): Level {
  if (day.isRestDay) return prev;
  if (day.didActivity) return clampLevel(prev + 1);
  return clampLevel(prev - 1);
}

/**
 * Recompute level timeline from a start level and ordered day inputs.
 * days must be chronological ascending.
 */
export function computeTimeline(
  startLevel: Level,
  days: DayInput[]
): { date: string; level: Level }[] {
  let current = clampLevel(startLevel);
  const out: { date: string; level: Level }[] = [];

  for (const d of days) {
    current = nextLevel(current, d);
    out.push({ date: d.date, level: current });
  }
  return out;
}

// 後方互換性のためのエイリアス（非推奨）
/** @deprecated Use Level instead */
export type Stage = Level;
/** @deprecated Use clampLevel instead */
export const clampStage = clampLevel;
/** @deprecated Use nextLevel instead */
export const nextStage = nextLevel;
