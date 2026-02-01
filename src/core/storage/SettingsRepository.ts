import * as SQLite from 'expo-sqlite';

/**
 * アプリの設定を保存するリポジトリ
 * 
 * 保存する設定:
 * - fixedRestDays: 固定休息日（曜日の配列: 0=日曜, 1=月曜, ..., 6=土曜）
 */

export interface Settings {
  fixedRestDays: number[]; // 0=日曜, 1=月曜, ..., 6=土曜
}

export class SettingsRepository {
  private db: SQLite.SQLiteDatabase;

  constructor() {
    this.db = SQLite.openDatabaseSync('fitmorph.db');
  }

  /**
   * settingsテーブルを初期化
   */
  async init(): Promise<void> {
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        fixed_rest_days TEXT NOT NULL DEFAULT '[]'
      );
    `);

    // デフォルト設定を挿入（存在しない場合のみ）
    await this.db.execAsync(`
      INSERT OR IGNORE INTO settings (id, fixed_rest_days)
      VALUES (1, '[]');
    `);
  }

  /**
   * 設定を取得
   */
  async get(): Promise<Settings> {
    const result = await this.db.getFirstAsync<{ fixed_rest_days: string }>(
      'SELECT fixed_rest_days FROM settings WHERE id = 1'
    );

    if (!result) {
      // デフォルト設定を返す
      return { fixedRestDays: [] };
    }

    return {
      fixedRestDays: JSON.parse(result.fixed_rest_days),
    };
  }

  /**
   * 固定休息日を保存
   */
  async setFixedRestDays(days: number[]): Promise<void> {
    await this.db.runAsync(
      'UPDATE settings SET fixed_rest_days = ? WHERE id = 1',
      [JSON.stringify(days)]
    );
  }

  /**
   * 固定休息日を取得
   */
  async getFixedRestDays(): Promise<number[]> {
    const settings = await this.get();
    return settings.fixedRestDays;
  }

  /**
   * 指定した日付が固定休息日かどうかを判定
   * @param date YYYY-MM-DD形式の日付
   * @returns 固定休息日の場合true
   */
  async isFixedRestDay(date: string): Promise<boolean> {
    const fixedRestDays = await this.getFixedRestDays();
    const dayOfWeek = new Date(date).getDay(); // 0=日曜, 1=月曜, ..., 6=土曜
    return fixedRestDays.includes(dayOfWeek);
  }
}
