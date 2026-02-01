import { getDatabase } from './db';
import { Level } from '../domain/stage';

export type DayStateRecord = {
  date: string;
  isRestDay: boolean;
  level: Level;
  /** @deprecated Use level instead */
  stage?: Level;
};

/**
 * DayState Repository
 */
export class DayStateRepository {
  /**
   * DayStateを保存または更新
   */
  async upsert(dayState: DayStateRecord): Promise<void> {
    const db = getDatabase();
    
    // 後方互換性: stageがあればそれを使用
    const level = dayState.level ?? dayState.stage ?? 0;

    await db.runAsync(
      `INSERT INTO day_states (date, is_rest_day, stage)
       VALUES (?, ?, ?)
       ON CONFLICT(date) DO UPDATE SET
         is_rest_day = excluded.is_rest_day,
         stage = excluded.stage`,
      [dayState.date, dayState.isRestDay ? 1 : 0, level]
    );
  }

  /**
   * 複数のDayStateを一括保存
   */
  async upsertMany(dayStates: DayStateRecord[]): Promise<void> {
    const db = getDatabase();

    await db.withTransactionAsync(async () => {
      for (const dayState of dayStates) {
        // 後方互換性: stageがあればそれを使用
        const level = dayState.level ?? dayState.stage ?? 0;
        
        await db.runAsync(
          `INSERT INTO day_states (date, is_rest_day, stage)
           VALUES (?, ?, ?)
           ON CONFLICT(date) DO UPDATE SET
             is_rest_day = excluded.is_rest_day,
             stage = excluded.stage`,
          [dayState.date, dayState.isRestDay ? 1 : 0, level]
        );
      }
    });
  }

  /**
   * 指定日のDayStateを取得
   */
  async getByDate(date: string): Promise<DayStateRecord | null> {
    const db = getDatabase();

    const row = await db.getFirstAsync<any>(
      'SELECT * FROM day_states WHERE date = ?',
      [date]
    );

    return row ? this.mapRowToDayState(row) : null;
  }

  /**
   * 期間内のDayStateを取得
   */
  async getByDateRange(
    fromDate: string,
    toDate: string
  ): Promise<DayStateRecord[]> {
    const db = getDatabase();

    const rows = await db.getAllAsync<any>(
      'SELECT * FROM day_states WHERE date >= ? AND date <= ? ORDER BY date ASC',
      [fromDate, toDate]
    );

    return rows.map((row) => this.mapRowToDayState(row));
  }

  /**
   * 指定日以降のDayStateを取得
   */
  async getFromDate(fromDate: string): Promise<DayStateRecord[]> {
    const db = getDatabase();

    const rows = await db.getAllAsync<any>(
      'SELECT * FROM day_states WHERE date >= ? ORDER BY date ASC',
      [fromDate]
    );

    return rows.map((row) => this.mapRowToDayState(row));
  }

  /**
   * 最新のDayStateを取得
   */
  async getLatest(): Promise<DayStateRecord | null> {
    const db = getDatabase();

    const row = await db.getFirstAsync<any>(
      'SELECT * FROM day_states ORDER BY date DESC LIMIT 1'
    );

    return row ? this.mapRowToDayState(row) : null;
  }

  /**
   * 休息日を設定/解除
   */
  async setRestDay(date: string, isRestDay: boolean): Promise<void> {
    const db = getDatabase();

    const existing = await this.getByDate(date);
    const level = existing?.level ?? 0;

    await this.upsert({ date, isRestDay, level });
  }

  /**
   * 全DayStateを削除（テスト用）
   */
  async deleteAll(): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM day_states');
  }

  /**
   * DBの行をDayStateRecordにマップ
   */
  private mapRowToDayState(row: any): DayStateRecord {
    return {
      date: row.date,
      isRestDay: row.is_rest_day === 1,
      level: row.stage, // DBカラム名はstageのまま（互換性のため）
    };
  }
}
