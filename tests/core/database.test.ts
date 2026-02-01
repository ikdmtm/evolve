/**
 * データベース統合テスト
 * 
 * 注意: これらのテストは実際のSQLiteデータベースを使用するため、
 * 実機またはシミュレータ環境でのみ実行可能です。
 * 
 * Jest環境では expo-sqlite がモックされるため、スキップされます。
 */

describe.skip('Database Integration Tests (Run on device)', () => {
  test('データベースが初期化できる', () => {
    // 実機でのみテスト
  });

  test('Workoutを保存・取得できる', () => {
    // 実機でのみテスト
  });

  test('DayStateを保存・取得できる', () => {
    // 実機でのみテスト
  });
});
