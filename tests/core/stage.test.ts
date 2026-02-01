import { computeTimeline, nextStage } from "../../src/core/domain/stage";

describe("stage rules", () => {
  test("activity => +1", () => {
    expect(nextStage(0, { date: "2026-01-01", isRestDay: false, didActivity: true })).toBe(1);
  });

  test("no activity => -1", () => {
    expect(nextStage(3, { date: "2026-01-01", isRestDay: false, didActivity: false })).toBe(2);
  });

  test("rest day => no change (even if no activity)", () => {
    expect(nextStage(3, { date: "2026-01-01", isRestDay: true, didActivity: false })).toBe(3);
  });

  test("clamp 0..9", () => {
    expect(nextStage(9, { date: "2026-01-01", isRestDay: false, didActivity: true })).toBe(9);
    expect(nextStage(0, { date: "2026-01-01", isRestDay: false, didActivity: false })).toBe(0);
  });

  test("timeline recompute", () => {
    const days = [
      { date: "2026-01-01", isRestDay: false, didActivity: true },  // 0->1
      { date: "2026-01-02", isRestDay: false, didActivity: false }, // 1->0
      { date: "2026-01-03", isRestDay: true,  didActivity: false }, // 0->0
      { date: "2026-01-04", isRestDay: false, didActivity: true },  // 0->1
    ];
    const tl = computeTimeline(0, days);
    expect(tl.map(x => x.stage)).toEqual([1,0,0,1]);
  });
});
