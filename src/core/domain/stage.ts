export type Stage = number; // 0..9

export type DayInput = {
  date: string; // YYYY-MM-DD
  isRestDay: boolean;
  didActivity: boolean; // true if ANY workout exists on that day
};

export function clampStage(stage: number): Stage {
  if (stage < 0) return 0;
  if (stage > 9) return 9;
  return stage;
}

export function nextStage(prev: Stage, day: DayInput): Stage {
  if (day.isRestDay) return prev;
  if (day.didActivity) return clampStage(prev + 1);
  return clampStage(prev - 1);
}

/**
 * Recompute stage timeline from a start stage and ordered day inputs.
 * days must be chronological ascending.
 */
export function computeTimeline(
  startStage: Stage,
  days: DayInput[]
): { date: string; stage: Stage }[] {
  let current = clampStage(startStage);
  const out: { date: string; stage: Stage }[] = [];

  for (const d of days) {
    current = nextStage(current, d);
    out.push({ date: d.date, stage: current });
  }
  return out;
}
