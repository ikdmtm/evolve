# M2: SQLite + Repos + Migrations - 完了

## 実装内容

### ✅ 完了した項目

1. **データベース初期化** (`src/core/storage/db.ts`)
   - SQLiteのセットアップ
   - マイグレーションシステム（バージョン管理）
   - 自動マイグレーション実行

2. **テーブル定義**
   - `workouts` テーブル: 活動記録を保存
   - `day_states` テーブル: 日次状態（休息日、ステージ）を保存
   - インデックス: 日付での高速検索

3. **Repository層**
   - `WorkoutRepository`: Workout CRUD操作
     - create, getById, getByDate, getByDateRange
     - update, delete, deleteAll
   - `DayStateRepository`: DayState CRUD操作
     - upsert, upsertMany, getByDate, getByDateRange
     - getFromDate, getLatest, setRestDay

4. **アプリ統合**
   - `app/_layout.tsx`: 起動時にデータベース初期化
   - `app/home.tsx`: データベーステスト機能追加

### テーブル構造

**workouts**
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
CREATE INDEX idx_workouts_date ON workouts(date);
```

**day_states**
```sql
CREATE TABLE day_states (
  date TEXT PRIMARY KEY,
  is_rest_day INTEGER NOT NULL DEFAULT 0,
  stage INTEGER NOT NULL DEFAULT 0,
  CHECK(stage >= 0 AND stage <= 9)
);
```

## 実機確認手順

1. アプリを起動
2. ホーム画面で「データベーステスト実行」ボタンをタップ
3. 成功メッセージが表示されることを確認
4. **アプリを完全に終了**（タスクキルまたは再起動）
5. アプリを再度起動
6. 保存されたWorkoutが表示されることを確認

### Gate条件

- ✅ 型チェック: エラーなし
- ✅ テスト: 13テスト合格
- ⏳ 実機確認: データが保存され、再起動後も残る（要確認）

## 次のステップ

**M3: Log Screen（記録画面）**

実際にWorkoutを作成・編集・削除するUIを実装します。
