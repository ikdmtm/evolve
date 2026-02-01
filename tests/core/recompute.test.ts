import {
  recomputeStages,
  getStageOnDate,
  getLatestStage,
} from '../../src/core/services/recomputeService';

describe('recomputeService', () => {
  describe('recomputeStages', () => {
    test('過去日編集時にステージを再計算できる', () => {
      // 1/1から1/5までのデータがある
      const dayStates = [
        { date: '2026-01-01', isRestDay: false, didActivity: true },  // 0->1
        { date: '2026-01-02', isRestDay: false, didActivity: true },  // 1->2
        { date: '2026-01-03', isRestDay: false, didActivity: false }, // 2->1
        { date: '2026-01-04', isRestDay: false, didActivity: true },  // 1->2
        { date: '2026-01-05', isRestDay: false, didActivity: true },  // 2->3
      ];

      // 1/3以降を再計算（1/3の活動がfalse→trueに変更されたと仮定）
      const modifiedStates = [
        { date: '2026-01-03', isRestDay: false, didActivity: true },  // 編集: false->true
        { date: '2026-01-04', isRestDay: false, didActivity: true },
        { date: '2026-01-05', isRestDay: false, didActivity: true },
      ];

      const result = recomputeStages({
        startStage: 2, // 1/2時点でのステージ
        fromDate: '2026-01-03',
        dayStates: modifiedStates,
      });

      // 1/3: 2->3, 1/4: 3->4, 1/5: 4->5
      expect(result.timeline).toEqual([
        { date: '2026-01-03', stage: 3 },
        { date: '2026-01-04', stage: 4 },
        { date: '2026-01-05', stage: 5 },
      ]);
    });

    test('休息日変更時にステージを再計算できる', () => {
      const dayStates = [
        { date: '2026-01-01', isRestDay: false, didActivity: true },  // 0->1
        { date: '2026-01-02', isRestDay: true, didActivity: false },  // 休息日に変更
        { date: '2026-01-03', isRestDay: false, didActivity: false }, // 1->0
      ];

      const result = recomputeStages({
        startStage: 0,
        fromDate: '2026-01-01',
        dayStates,
      });

      expect(result.timeline).toEqual([
        { date: '2026-01-01', stage: 1 },
        { date: '2026-01-02', stage: 1 }, // 休息日なので維持
        { date: '2026-01-03', stage: 0 }, // 活動なしで-1
      ]);
    });

    test('複数日にわたる再計算が正しく動作する', () => {
      const dayStates = [
        { date: '2026-01-01', isRestDay: false, didActivity: true },  // 0->1
        { date: '2026-01-02', isRestDay: false, didActivity: true },  // 1->2
        { date: '2026-01-03', isRestDay: false, didActivity: true },  // 2->3
        { date: '2026-01-04', isRestDay: false, didActivity: false }, // 3->2
        { date: '2026-01-05', isRestDay: true, didActivity: false },  // 2->2
        { date: '2026-01-06', isRestDay: false, didActivity: true },  // 2->3
        { date: '2026-01-07', isRestDay: false, didActivity: true },  // 3->4
      ];

      const result = recomputeStages({
        startStage: 0,
        fromDate: '2026-01-01',
        toDate: '2026-01-07',
        dayStates,
      });

      expect(result.timeline.map((t) => t.stage)).toEqual([1, 2, 3, 2, 2, 3, 4]);
      expect(result.timeline.length).toBe(7);
    });

    test('toDateでフィルタリングが正しく動作する', () => {
      const dayStates = [
        { date: '2026-01-01', isRestDay: false, didActivity: true },
        { date: '2026-01-02', isRestDay: false, didActivity: true },
        { date: '2026-01-03', isRestDay: false, didActivity: true },
        { date: '2026-01-04', isRestDay: false, didActivity: true },
      ];

      const result = recomputeStages({
        startStage: 0,
        fromDate: '2026-01-01',
        toDate: '2026-01-02', // 1/2まで
        dayStates,
      });

      expect(result.timeline.length).toBe(2);
      expect(result.timeline).toEqual([
        { date: '2026-01-01', stage: 1 },
        { date: '2026-01-02', stage: 2 },
      ]);
    });
  });

  describe('getStageOnDate', () => {
    test('特定の日付のステージを取得できる', () => {
      const timeline = [
        { date: '2026-01-01', stage: 1 },
        { date: '2026-01-02', stage: 2 },
        { date: '2026-01-03', stage: 3 },
      ];

      expect(getStageOnDate(timeline, '2026-01-02')).toBe(2);
      expect(getStageOnDate(timeline, '2026-01-03')).toBe(3);
    });

    test('存在しない日付の場合はundefinedを返す', () => {
      const timeline = [
        { date: '2026-01-01', stage: 1 },
        { date: '2026-01-02', stage: 2 },
      ];

      expect(getStageOnDate(timeline, '2026-01-05')).toBeUndefined();
    });
  });

  describe('getLatestStage', () => {
    test('最新のステージを取得できる', () => {
      const timeline = [
        { date: '2026-01-01', stage: 1 },
        { date: '2026-01-02', stage: 2 },
        { date: '2026-01-03', stage: 5 },
      ];

      expect(getLatestStage(timeline)).toBe(5);
    });

    test('空のタイムラインの場合はundefinedを返す', () => {
      expect(getLatestStage([])).toBeUndefined();
    });
  });
});
