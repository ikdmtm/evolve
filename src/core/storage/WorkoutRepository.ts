import { getDatabase } from './db';
import { Workout } from '../domain/models';

/**
 * Workout Repository
 */
export class WorkoutRepository {
  /**
   * Workoutを作成
   */
  async create(workout: Workout): Promise<void> {
    const db = getDatabase();

    await db.runAsync(
      `INSERT INTO workouts (id, date, type, title, note, created_at, strength_data, cardio_data, light_data)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        workout.id,
        workout.date,
        workout.type,
        workout.title ?? null,
        workout.note ?? null,
        workout.createdAt,
        workout.strength ? JSON.stringify(workout.strength) : null,
        workout.cardio ? JSON.stringify(workout.cardio) : null,
        workout.light ? JSON.stringify(workout.light) : null,
      ]
    );
  }

  /**
   * IDでWorkoutを取得
   */
  async getById(id: string): Promise<Workout | null> {
    const db = getDatabase();

    const row = await db.getFirstAsync<any>(
      'SELECT * FROM workouts WHERE id = ?',
      [id]
    );

    return row ? this.mapRowToWorkout(row) : null;
  }

  /**
   * 指定日のWorkoutを全て取得
   */
  async getByDate(date: string): Promise<Workout[]> {
    const db = getDatabase();

    const rows = await db.getAllAsync<any>(
      'SELECT * FROM workouts WHERE date = ? ORDER BY created_at DESC',
      [date]
    );

    return rows.map((row) => this.mapRowToWorkout(row));
  }

  /**
   * 期間内のWorkoutを取得
   */
  async getByDateRange(fromDate: string, toDate: string): Promise<Workout[]> {
    const db = getDatabase();

    const rows = await db.getAllAsync<any>(
      'SELECT * FROM workouts WHERE date >= ? AND date <= ? ORDER BY date ASC, created_at DESC',
      [fromDate, toDate]
    );

    return rows.map((row) => this.mapRowToWorkout(row));
  }

  /**
   * Workoutを更新
   */
  async update(workout: Workout): Promise<void> {
    const db = getDatabase();

    await db.runAsync(
      `UPDATE workouts
       SET date = ?, type = ?, title = ?, note = ?, strength_data = ?, cardio_data = ?, light_data = ?
       WHERE id = ?`,
      [
        workout.date,
        workout.type,
        workout.title ?? null,
        workout.note ?? null,
        workout.strength ? JSON.stringify(workout.strength) : null,
        workout.cardio ? JSON.stringify(workout.cardio) : null,
        workout.light ? JSON.stringify(workout.light) : null,
        workout.id,
      ]
    );
  }

  /**
   * Workoutを削除
   */
  async delete(id: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM workouts WHERE id = ?', [id]);
  }

  /**
   * 全Workoutを削除（テスト用）
   */
  async deleteAll(): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM workouts');
  }

  /**
   * DBの行をWorkoutオブジェクトにマップ
   */
  private mapRowToWorkout(row: any): Workout {
    const workout: Workout = {
      id: row.id,
      date: row.date,
      type: row.type,
      title: row.title,
      note: row.note,
      createdAt: row.created_at,
    };

    if (row.strength_data) {
      workout.strength = JSON.parse(row.strength_data);
    }
    if (row.cardio_data) {
      workout.cardio = JSON.parse(row.cardio_data);
    }
    if (row.light_data) {
      workout.light = JSON.parse(row.light_data);
    }

    return workout;
  }
}
