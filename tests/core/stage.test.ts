import { computeTimeline, nextLevel } from "../../src/core/domain/stage";

describe("level rules", () => {
  test("activity => +1", () => {
    expect(nextLevel(0, { date: "2026-01-01", isRestDay: false, didActivity: true })).toBe(1);
  });

  test("no activity => -1", () => {
    expect(nextLevel(3, { date: "2026-01-01", isRestDay: false, didActivity: false })).toBe(2);
  });

  test("rest day => no change (even if no activity)", () => {
    expect(nextLevel(3, { date: "2026-01-01", isRestDay: true, didActivity: false })).toBe(3);
  });

  test("clamp 0..10", () => {
    expect(nextLevel(10, { date: "2026-01-01", isRestDay: false, didActivity: true })).toBe(10);
    expect(nextLevel(0, { date: "2026-01-01", isRestDay: false, didActivity: false })).toBe(0);
  });

  test("timeline recompute", () => {
    const days = [
      { date: "2026-01-01", isRestDay: false, didActivity: true },  // 0->1
      { date: "2026-01-02", isRestDay: false, didActivity: false }, // 1->0
      { date: "2026-01-03", isRestDay: true,  didActivity: false }, // 0->0
      { date: "2026-01-04", isRestDay: false, didActivity: true },  // 0->1
    ];
    const tl = computeTimeline(0, days);
    expect(tl.map(x => x.level)).toEqual([1,0,0,1]);
  });
});
