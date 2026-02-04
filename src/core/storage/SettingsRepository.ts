import * as SQLite from 'expo-sqlite';

/**
 * アプリの設定を保存するリポジトリ
 * 
 * 保存する設定:
 * - fixedRestDays: 固定休息日（曜日の配列: 0=日曜, 1=月曜, ..., 6=土曜）
 * - theme: テーマ（'light' | 'dark'）
 */

export type Theme = 'light' | 'dark';
export type CharacterType = 'simple' | 'muscle' | 'diet';
export type CharacterGender = 'male' | 'female';

export interface Settings {
  fixedRestDays: number[]; // 0=日曜, 1=月曜, ..., 6=土曜
  theme: Theme;
  characterType: CharacterType; // キャラクタータイプ: simple(シンプル), muscle(筋トレ), diet(ダイエット)
  characterGender: CharacterGender; // キャラクターの性別: male(男性), female(女性)
}

export class SettingsRepository {
  private db: SQLite.SQLiteDatabase;

  constructor() {
    this.db = SQLite.openDatabaseSync('continue.db');
  }

  /**
   * settingsテーブルを初期化
   */
  async init(): Promise<void> {
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        fixed_rest_days TEXT NOT NULL DEFAULT '[]',
        theme TEXT NOT NULL DEFAULT 'light',
        character_type TEXT NOT NULL DEFAULT 'muscle',
        character_gender TEXT NOT NULL DEFAULT 'male'
      );
    `);

    // デフォルト設定を挿入（存在しない場合のみ）
    await this.db.execAsync(`
      INSERT OR IGNORE INTO settings (id, fixed_rest_days, theme, character_type, character_gender)
      VALUES (1, '[]', 'light', 'muscle', 'male');
    `);
  }

  /**
   * 設定を取得
   */
  async get(): Promise<Settings> {
    try {
      const result = await this.db.getFirstAsync<{ 
        fixed_rest_days: string; 
        theme?: string;
        character_type?: string;
        character_gender?: string;
      }>(
        'SELECT fixed_rest_days, theme, character_type, character_gender FROM settings WHERE id = 1'
      );

      if (!result) {
        // デフォルト設定を返す
        return { 
          fixedRestDays: [], 
          theme: 'light',
          characterType: 'muscle',
          characterGender: 'male'
        };
      }

      return {
        fixedRestDays: JSON.parse(result.fixed_rest_days),
        theme: (result.theme || 'light') as Theme,
        characterType: (result.character_type || 'muscle') as CharacterType,
        characterGender: (result.character_gender || 'male') as CharacterGender,
      };
    } catch (error) {
      // カラムが存在しない場合など、エラーをキャッチしてデフォルト値を返す
      console.warn('Failed to get settings, using defaults:', error);
      return { 
        fixedRestDays: [], 
        theme: 'light',
        characterType: 'muscle',
        characterGender: 'male'
      };
    }
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

  /**
   * テーマを保存
   */
  async setTheme(theme: Theme): Promise<void> {
    try {
      await this.db.runAsync(
        'UPDATE settings SET theme = ? WHERE id = 1',
        [theme]
      );
    } catch (error) {
      // themeカラムが存在しない場合など、エラーをキャッチ
      // マイグレーション完了後に再度試行される
      console.warn('Failed to set theme (column may not exist yet):', error);
    }
  }

  /**
   * テーマを取得
   */
  async getTheme(): Promise<Theme> {
    try {
      const settings = await this.get();
      return settings.theme;
    } catch (error) {
      console.warn('Failed to get theme, using default:', error);
      return 'light';
    }
  }

  /**
   * キャラクタータイプを保存
   */
  async setCharacterType(characterType: CharacterType): Promise<void> {
    try {
      await this.db.runAsync(
        'UPDATE settings SET character_type = ? WHERE id = 1',
        [characterType]
      );
    } catch (error) {
      console.warn('Failed to set character type:', error);
    }
  }

  /**
   * キャラクタータイプを取得
   */
  async getCharacterType(): Promise<CharacterType> {
    try {
      const settings = await this.get();
      return settings.characterType;
    } catch (error) {
      console.warn('Failed to get character type, using default:', error);
      return 'muscle';
    }
  }

  /**
   * キャラクターの性別を保存
   */
  async setCharacterGender(characterGender: CharacterGender): Promise<void> {
    try {
      await this.db.runAsync(
        'UPDATE settings SET character_gender = ? WHERE id = 1',
        [characterGender]
      );
    } catch (error) {
      console.warn('Failed to set character gender:', error);
    }
  }

  /**
   * キャラクターの性別を取得
   */
  async getCharacterGender(): Promise<CharacterGender> {
    try {
      const settings = await this.get();
      return settings.characterGender;
    } catch (error) {
      console.warn('Failed to get character gender, using default:', error);
      return 'male';
    }
  }
}
