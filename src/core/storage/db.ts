import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

/**
 * データベースを初期化
 */
export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  db = await SQLite.openDatabaseAsync('continue.db');
  await runMigrations(db);
  return db;
}

/**
 * データベースインスタンスを取得
 */
export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

/**
 * マイグレーションを実行
 */
async function runMigrations(database: SQLite.SQLiteDatabase): Promise<void> {
  // マイグレーションバージョン管理テーブル
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS migrations (
      version INTEGER PRIMARY KEY,
      applied_at INTEGER NOT NULL
    );
  `);

  const currentVersion = await getCurrentVersion(database);

  // マイグレーション一覧
  const migrations = [
    { version: 1, fn: migration_v1 },
  ];

  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      console.log(`Running migration v${migration.version}...`);
      await migration.fn(database);
      await database.runAsync(
        'INSERT INTO migrations (version, applied_at) VALUES (?, ?)',
        [migration.version, Date.now()]
      );
      console.log(`Migration v${migration.version} completed.`);
    }
  }
}

/**
 * 現在のマイグレーションバージョンを取得
 */
async function getCurrentVersion(database: SQLite.SQLiteDatabase): Promise<number> {
  const result = await database.getFirstAsync<{ version: number }>(
    'SELECT MAX(version) as version FROM migrations'
  );
  return result?.version ?? 0;
}

/**
 * マイグレーション v1: 初期テーブル作成
 */
async function migration_v1(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    -- Workouts テーブル
    CREATE TABLE workouts (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('strength', 'cardio', 'light')),
      title TEXT,
      note TEXT,
      created_at INTEGER NOT NULL,
      strength_data TEXT,
      cardio_data TEXT,
      light_data TEXT
    );

    -- 日付でのインデックス
    CREATE INDEX idx_workouts_date ON workouts(date);

    -- Day States テーブル
    CREATE TABLE day_states (
      date TEXT PRIMARY KEY,
      is_rest_day INTEGER NOT NULL DEFAULT 0,
      stage INTEGER NOT NULL DEFAULT 0,
      CHECK(is_rest_day IN (0, 1)),
      CHECK(stage >= 0 AND stage <= 9)
    );
  `);
}
