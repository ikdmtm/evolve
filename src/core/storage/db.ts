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
    { version: 2, fn: migration_v2 },
    { version: 3, fn: migration_v3 },
    { version: 4, fn: migration_v4 },
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

/**
 * マイグレーション v2: Settings テーブル作成
 */
async function migration_v2(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    -- Settings テーブル
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      fixed_rest_days TEXT NOT NULL DEFAULT '[]'
    );

    -- デフォルト設定を挿入
    INSERT OR IGNORE INTO settings (id, fixed_rest_days)
    VALUES (1, '[]');
  `);
}

/**
 * マイグレーション v3: Settings テーブルにthemeカラムを追加
 */
async function migration_v3(database: SQLite.SQLiteDatabase): Promise<void> {
  // themeカラムが存在するかチェック
  const tableInfo = await database.getAllAsync<{ name: string }>(
    "PRAGMA table_info(settings)"
  );
  
  const hasThemeColumn = tableInfo.some(col => col.name === 'theme');
  
  if (!hasThemeColumn) {
    await database.execAsync(`
      -- themeカラムを追加
      ALTER TABLE settings ADD COLUMN theme TEXT NOT NULL DEFAULT 'dark';
    `);
    console.log('Added theme column to settings table');
  }
}

/**
 * マイグレーション v4: Settings テーブルにcharacter_typeとcharacter_genderカラムを追加
 */
async function migration_v4(database: SQLite.SQLiteDatabase): Promise<void> {
  const tableInfo = await database.getAllAsync<{ name: string }>(
    "PRAGMA table_info(settings)"
  );
  
  const hasCharacterTypeColumn = tableInfo.some(col => col.name === 'character_type');
  const hasCharacterGenderColumn = tableInfo.some(col => col.name === 'character_gender');
  
  if (!hasCharacterTypeColumn) {
    await database.execAsync(`
      ALTER TABLE settings ADD COLUMN character_type TEXT NOT NULL DEFAULT 'simple';
    `);
    console.log('Added character_type column to settings table');
  }
  
  if (!hasCharacterGenderColumn) {
    await database.execAsync(`
      ALTER TABLE settings ADD COLUMN character_gender TEXT NOT NULL DEFAULT 'male';
    `);
    console.log('Added character_gender column to settings table');
  }
}
