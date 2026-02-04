# Decisions

## Tech
- Expo + React Native + TypeScript
- expo-router for navigation
- SQLite (expo-sqlite)
- Jest for unit tests (domain logic first)

## Domain decisions
- "軽めでもカウント" => didActivity is true if ANY workout exists on that day.
- Level is recomputed from a timeline to avoid inconsistency when editing past days.
- Day boundary uses local date (YYYY-MM-DD). (Future: allow configurable cutoff time)
- Level system: 0-10 (11 levels total)

## User Goal & Character System (2026-02-01)

### 2つの目標・2つのキャラクター成長パターン

アプリは2つの利用目的をサポート：

**🏃 ダイエットモード (diet)**
- 目標: 痩せる、体を引き締める
- キャラ成長: デブ（Level 0） → スリム（Level 10）
- 各レベルで明確な見た目の変化

**💪 筋トレモード (muscle)**
- 目標: 筋肉をつける、体を大きくする
- キャラ成長: がりがり（Level 0） → ムキムキ（Level 10）
- 各レベルで明確な見た目の変化

### 重要な設計方針

1. **記録内容は共通**: 筋トレ・有酸素・軽め活動は両モード共通
2. **ビジュアルが異なる**: 同じLevelでもdiet/muscleで別のキャラ画像
3. **初回起動時に選択**: オンボーディングで目標を選択
4. **設定でいつでも変更可能**: ユーザーは後から目標を変更できる
5. **全11レベルで明確な変化**: Level 0→1→2...→10 それぞれ見た目が変わる

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

## Level Visualization (2026-02-03)

### 現状: 共通・画像に頼らない表現

チープに見えないよう、**レベル別キャラ画像は使わず**共通のUIで表現する方針にした。

- **LevelDisplay コンポーネント** (`src/ui/components/LevelDisplay.tsx`)
  - リング状の11セグメント（Level 0〜10に対応）が進捗で色づく
  - 中央に大きなレベル数字 + "LEVEL" ラベル
  - テーマのレベル色（low/mid/high）をそのまま利用
- 絵文字（🐣→🐱→🐕→🦁）は廃止

### 今後の拡張オプション

1. **レベル別画像を再度導入する場合**
   - diet / muscle それぞれに、Level 0〜10 用の画像を用意（計22枚、または4段階×2で8枚など）
   - `LevelDisplay` の中央部分を「画像 or 数字」で切り替え可能にしておくと差し替えしやすい
2. **共通のまま差し上げる場合**
   - リング + 数字のまま、フォント・色・アニメーションだけで差別化（例: レベルUP時だけ光るなど）