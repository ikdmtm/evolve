# M4: Home Screen - 完了

## 実装内容

### 1. ホーム画面の基本機能 ✅

**実装ファイル:** `app/home.tsx`

#### 主な機能
1. **今日のレベル表示**
   - 0-10の11段階のレベルを視覚的に表示
   - プログレスバーで現在のレベルを表示

2. **状態表示**
   - 休息日（緑色）
   - 活動済み（青色）
   - 未活動（オレンジ色）

3. **日付ナビゲーション**
   - 前日/翌日ボタンで日付切り替え
   - 「今日」ボタンで今日に戻る
   - 未来の日付には進めない

4. **キャラクター表示エリア**
   - プレースホルダー（円形）
   - レベル番号を表示
   - 状態に応じて枠の色が変化

### 2. データ取得

- `DayStateRepository`から指定日のレベルと休息日情報を取得
- `WorkoutRepository`から指定日の活動記録を取得
- `hasActivity`は記録の有無で判定（`workouts.length > 0`）

### 3. UI/UX

#### 日付ナビゲーション
```
← 前日  |  2026年02月01日  [今日]  |  翌日 →
```

#### レベル表示
- 11個のセグメントで構成
- 現在のレベルまで青色で塗りつぶし
- 0と10のラベル付き

#### 状態カード
- 左側に色付きボーダー
- 大きなテキストで状態を表示

## Gate確認

- ✅ 1日でlevelが上がる/下がるの挙動が視覚で確認できる
  - レベル表示が実装されている
  - 日付切り替えでレベルの変化を確認できる

## 実装されていない部分（今後の実装予定）

### M4では暫定実装
- キャラクター画像は円形のプレースホルダー
- 実際の画像は後日実装予定

### M5以降で実装予定
- オンボーディング（目標選択）
- 2種類のキャラクター画像（diet/muscle）
- 画像の切り替えアニメーション

## 技術的な詳細

### 使用している主要な機能
- `useState`, `useEffect` for state management
- `getTodayDate()` for date handling
- `formatDateJP()` for Japanese date formatting
- Repository pattern for data access

### 日付の扱い
```typescript
function navigateDate(offset: number) {
  const date = new Date(currentDate);
  date.setDate(date.getDate() + offset);
  const newDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  setCurrentDate(newDate);
}
```

### 状態の色分け
```typescript
function getStatusColor() {
  if (isRestDay) return '#34C759';    // 緑: 休息日
  if (hasActivity) return '#007AFF';   // 青: 活動済み
  return '#FF9500';                    // オレンジ: 未活動
}
```

### レベルシステム
- **範囲**: 0-10 (11段階)
- **初日の動作**: 記録をするとその日のうちにLevel 0 → Level 1に上がる
- **翌日**: レベルは前日の状態を引き継ぐ
- **活動**: +1レベル
- **未活動**: -1レベル
- **休息日**: レベル維持

## テスト

```bash
npm run type-check  # ✅ 型チェック: エラーなし
npm test            # ✅ ユニットテスト: 13テスト合格
```

## 実機確認項目

- [ ] ホーム画面が表示される
- [ ] レベルが正しく表示される（0-10）
- [ ] 日付の前日/翌日ナビゲーションが動く
- [ ] 今日ボタンで今日に戻る
- [ ] 未来の日付には進めない
- [ ] 状態（休息日/活動済み/未活動）が正しく表示される
- [ ] 状態に応じて色が変わる

## 次のステップ

M5: History + Calendar
- カレンダー表示
- 過去の記録を見られるようにする
