# M2: SQLite + Repos + Migrations

## 目標

- テーブル作成（workouts / day_states）
- CRUD（追加/更新/削除/取得）
- 過去編集 → 再計算の起点を用意

## Gate条件

- 実機で記録が保存され、再起動後も残る

## 実装する機能

### 1. データベース初期化
- SQLiteのセットアップ
- マイグレーションシステム

### 2. テーブル定義

**workouts テーブル**
```sql
CREATE TABLE workouts (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT,
  note TEXT,
  created_at INTEGER NOT NULL,
  strength_data TEXT,
  cardio_data TEXT,
  light_data TEXT
);
```

**day_states テーブル**
```sql
CREATE TABLE day_states (
  date TEXT PRIMARY KEY,
  is_rest_day INTEGER NOT NULL DEFAULT 0,
  stage INTEGER NOT NULL DEFAULT 0
);
```

### 3. Repository層
- `WorkoutRepository`: Workout CRUD
- `DayStateRepository`: DayState CRUD
- 過去日編集時の再計算トリガー

## 実装手順

1. DB初期化とマイグレーション
2. Repository実装
3. 簡単な統合テスト（保存→取得）
4. 実機確認
