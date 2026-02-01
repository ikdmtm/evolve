# M6: Settings (Rest day) - 完了

## 実装内容

### 1. 今日を休息日にするトグル ✅

**機能:**
- スイッチで今日を休息日に設定/解除
- DayStateRepositoryに保存
- 休息日は活動がなくてもレベルが下がらない

**UI:**
- Switchコンポーネントを使用
- プライマリカラーでアクティブ状態を表示
- 今日の日付と説明文を表示

**実装:**
```typescript
async function toggleTodayRestDay(value: boolean) {
  const dayStateRepo = new DayStateRepository();
  const todayState = await dayStateRepo.getByDate(today);
  
  await dayStateRepo.upsert({
    date: today,
    isRestDay: value,
    level: todayState?.level ?? 0,
  });
  
  setIsTodayRestDay(value);
  Alert.alert(
    '設定完了',
    value ? '今日を休息日に設定しました' : '今日の休息日を解除しました'
  );
}
```

### 2. 固定休息日の設定（UI） ✅

**機能:**
- 毎週の休息日を曜日ボタンで選択（複数選択可）
- 日～土の7つのボタン
- 選択状態を視覚的に表示

**UI:**
- 円形ボタングリッド
- アクティブ時：プライマリカラーの背景とボーダー
- 非アクティブ時：グレーの背景

**注意:**
- 自動適用機能は未実装（Coming Soon表示）
- 将来的にはSettingsRepositoryに保存して、毎日自動で適用する予定

### 3. 休息日のレベル保証 ✅

**仕組み:**
- `log.tsx`の`updateDayLevel`関数で休息日を考慮
- 休息日の場合、活動がなくてもレベルは維持される

**既存のロジック:**
```typescript
// レベルを計算
let newLevel = prevLevel;
if (isRestDay) {
  newLevel = prevLevel;  // 休息日はレベル維持
} else if (hasActivity) {
  newLevel = Math.min(prevLevel + 1, 10);  // +1
} else {
  newLevel = Math.max(prevLevel - 1, 0);   // -1
}
```

## UI設計

### 休息日設定カード

```
┌─────────────────────────────────────┐
│ 今日を休息日にする                    │
│ 2026-02-01 • 休息日は活動がなく...   │
│                              [Switch]│
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 固定休息日                            │
│ 毎週の休息日を設定（複数選択可）        │
│                                      │
│ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐│
│ │日│ │月│ │火│ │水│ │木│ │金│ │土││
│ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘│
│                                      │
│ [Coming Soon - 自動適用機能は未実装]  │
└─────────────────────────────────────┘
```

### カラースキーム

- **スイッチ（OFF）**: グレーの背景、ミュートカラーのつまみ
- **スイッチ（ON）**: プライマリカラーの背景、プライマリカラーのつまみ
- **曜日ボタン（非選択）**: 薄いグレーの背景、グレーのボーダー
- **曜日ボタン（選択）**: プライマリカラーの背景、プライマリカラーのボーダー

## 動作フロー

### 今日を休息日にする

1. **スイッチON**
   - `toggleTodayRestDay(true)`が呼ばれる
   - DayStateRepositoryで`isRestDay: true`を保存
   - アラート表示：「今日を休息日に設定しました」

2. **効果**
   - ホーム画面のステータスが「休息日」になる
   - 今日が終わってもレベルが下がらない

3. **スイッチOFF**
   - `toggleTodayRestDay(false)`が呼ばれる
   - DayStateRepositoryで`isRestDay: false`を保存
   - アラート表示：「今日の休息日を解除しました」

### 固定休息日（将来実装）

1. **曜日を選択**
   - 曜日ボタンをタップ
   - `fixedRestDays`配列に追加/削除
   - SettingsRepositoryに保存（未実装）

2. **自動適用（未実装）**
   - 毎日0時に該当曜日をチェック
   - 該当する場合、自動で`isRestDay: true`を設定
   - レベル計算で考慮される

## テスト結果

```bash
npm test
```

- ✅ ユニットテスト: 13テスト合格
- ✅ 既存のレベル計算ロジックは変更なし

## Gate確認

### ✅ 休息日にして何も記録しなくてもlevelが下がらない

**検証手順:**
1. 設定画面で「今日を休息日にする」をON
2. 何も記録しない
3. 翌日確認

**期待結果:**
- 休息日に設定した日はレベルが維持される
- `updateDayLevel`関数で`isRestDay === true`の場合、`newLevel = prevLevel`

**実装:**
- `log.tsx`の`updateDayLevel`関数で既に実装済み
- DayStateRepositoryから休息日フラグを取得
- 休息日の場合はレベル維持

## 今後の改善

### Phase 1（今回実装）
- ✅ 今日を休息日にするトグル
- ✅ 固定休息日のUI
- ✅ 休息日のレベル保証

### Phase 2（将来実装）
- [ ] SettingsRepositoryの作成
- [ ] 固定休息日の保存と読み込み
- [ ] 毎日0時の自動適用処理
- [ ] バックグラウンドタスクでの自動設定

### Phase 3（将来実装）
- [ ] カレンダーから過去の日付を休息日に設定
- [ ] 休息日の統計表示
- [ ] 休息日の履歴

## 次のステップ

**M7: Release prep**
- EAS設定
- TestFlightで配布できる状態
