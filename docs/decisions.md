# Decisions

## Tech
- Expo + React Native + TypeScript
- expo-router for navigation
- SQLite (expo-sqlite)
- Jest for unit tests (domain logic first)

## Domain decisions
- "軽めでもカウント" => didActivity is true if ANY workout exists on that day.
- Stage is recomputed from a timeline to avoid inconsistency when editing past days.
- Day boundary uses local date (YYYY-MM-DD). (Future: allow configurable cutoff time)

## User Goal & Character System (2026-02-01)

### 2つの目標・2つのキャラクター成長パターン

アプリは2つの利用目的をサポート：

**🏃 ダイエットモード (diet)**
- 目標: 痩せる、体を引き締める
- キャラ成長: デブ（stage 0） → スリム（stage 9）
- 各ステージで明確な見た目の変化

**💪 筋トレモード (muscle)**
- 目標: 筋肉をつける、体を大きくする
- キャラ成長: がりがり（stage 0） → ムキムキ（stage 9）
- 各ステージで明確な見た目の変化

### 重要な設計方針

1. **記録内容は共通**: 筋トレ・有酸素・軽め活動は両モード共通
2. **ビジュアルが異なる**: 同じstageでもdiet/muscleで別のキャラ画像
3. **初回起動時に選択**: オンボーディングで目標を選択
4. **設定でいつでも変更可能**: ユーザーは後から目標を変更できる
5. **全10ステージで明確な変化**: stage 0→1→2...→9 それぞれ見た目が変わる

### データ構造

```typescript
type UserGoal = 'diet' | 'muscle';

// settings テーブル（M6で実装予定）
{
  goal: UserGoal;
  canChangeGoal: true; // いつでも変更可能
}
```

### 実装タイミング
- M4: キャラ表示システム（暫定1種類）
- M5: オンボーディング（目標選択UI）
- M6: 設定画面（目標変更機能）
- 後日: 2種類のキャラ画像セット実装
