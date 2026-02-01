import {
  recomputeStages,
  getLevelOnDate,
  getLatestLevel,
} from '../../src/core/services/recomputeService';

describe('recomputeService', () => {
  describe('recomputeStages', () => {
    test('過去日編集時にレベルを再計算できる', () => {
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
        startLevel: 2, // 1/2時点でのレベル
        fromDate: '2026-01-03',
        dayStates: modifiedStates,
      });

      // 1/3: 2->3, 1/4: 3->4, 1/5: 4->5
      expect(result.timeline).toEqual([
        { date: '2026-01-03', level: 3 },
        { date: '2026-01-04', level: 4 },
        { date: '2026-01-05', level: 5 },
      ]);
    });

    test('休息日変更時にレベルを再計算できる', () => {
      const dayStates = [
        { date: '2026-01-01', isRestDay: false, didActivity: true },  // 0->1
        { date: '2026-01-02', isRestDay: true, didActivity: false },  // 休息日に変更
        { date: '2026-01-03', isRestDay: false, didActivity: false }, // 1->0
      ];

      const result = recomputeStages({
        startLevel: 0,
        fromDate: '2026-01-01',
        dayStates,
      });

      expect(result.timeline).toEqual([
        { date: '2026-01-01', level: 1 },
        { date: '2026-01-02', level: 1 }, // 休息日なので維持
        { date: '2026-01-03', level: 0 }, // 活動なしで-1
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
        startLevel: 0,
        fromDate: '2026-01-01',
        toDate: '2026-01-07',
        dayStates,
      });

      expect(result.timeline.map((t) => t.level)).toEqual([1, 2, 3, 2, 2, 3, 4]);
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
        startLevel: 0,
        fromDate: '2026-01-01',
        toDate: '2026-01-02', // 1/2まで
        dayStates,
      });

      expect(result.timeline.length).toBe(2);
      expect(result.timeline).toEqual([
        { date: '2026-01-01', level: 1 },
        { date: '2026-01-02', level: 2 },
      ]);
    });
  });

  describe('getLevelOnDate', () => {
    test('特定の日付のレベルを取得できる', () => {
      const timeline = [
        { date: '2026-01-01', level: 1 },
        { date: '2026-01-02', level: 2 },
        { date: '2026-01-03', level: 3 },
      ];

      expect(getLevelOnDate(timeline, '2026-01-02')).toBe(2);
      expect(getLevelOnDate(timeline, '2026-01-03')).toBe(3);
    });

    test('存在しない日付の場合はundefinedを返す', () => {
      const timeline = [
        { date: '2026-01-01', level: 1 },
        { date: '2026-01-02', level: 2 },
      ];

      expect(getLevelOnDate(timeline, '2026-01-05')).toBeUndefined();
    });
  });

  describe('getLatestLevel', () => {
    test('最新のレベルを取得できる', () => {
      const timeline = [
        { date: '2026-01-01', level: 1 },
        { date: '2026-01-02', level: 2 },
        { date: '2026-01-03', level: 5 },
      ];

      expect(getLatestLevel(timeline)).toBe(5);
    });

    test('空のタイムラインの場合はundefinedを返す', () => {
      expect(getLatestLevel([])).toBeUndefined();
    });
  });
});
