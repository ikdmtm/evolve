# M1: Stage Engine (Pure) + Tests - 完了

## 実装内容

### ✅ 完了した項目

1. **ステージ計算ロジック** (`src/core/domain/stage.ts`)
   - `clampStage()` - ステージを0〜9にクリップ
   - `nextStage()` - 前日のステージと日次状態から次のステージを計算
   - `computeTimeline()` - タイムライン全体のステージを再計算

2. **再計算サービス** (`src/core/services/recomputeService.ts`)
   - `recomputeStages()` - 指定期間のステージを再計算
   - `getStageOnDate()` - 特定日のステージを取得
   - `getLatestStage()` - 最新のステージを取得

3. **ユニットテスト**
   - `tests/core/stage.test.ts` - ステージ計算ロジックのテスト（5テスト）
   - `tests/core/recompute.test.ts` - 再計算サービスのテスト（8テスト）
   - **合計: 13テスト全て合格** ✅

### テスト結果

```bash
npm test
```

```
Test Suites: 2 passed, 2 total
Tests:       13 passed, 13 total
```

### 型チェック

```bash
npm run type-check
```

型エラー無し ✅

## Gate条件

- ✅ `npm test` が通る
- ✅ 10日分入力で期待通り ±1 / 休息維持が成立
- ✅ 過去日編集時の再計算が正しく動作

## 次のステップ

**M2: SQLite + Repos + Migrations** に進む

M1で実装した純粋なロジックをデータベース層と統合します。
