# M5: History + Calendar - 完了

## 実装内容

### 1. カレンダー表示 ✅

月単位のカレンダーで日別の記録を確認できる：

- **月ナビゲーション**: 前月/翌月ボタンで月を切り替え
- **今月ボタン**: 他の月を見ている時に今月へ素早く戻れる
- **曜日ヘッダー**: 日～土の曜日表示（日曜は赤、土曜は青）
- **6週間グリッド**: 前月・当月・翌月の日付を含む42日分を表示

### 2. 日別の状態表示 ✅

各日に以下の情報を表示：

- **日付番号**: 当月は黒、他月は薄いグレー
- **状態ドット**: 色で状態を識別
  - 🔵 青: 活動済み
  - 🟢 緑: 休息日
  - 🟠 オレンジ: 未活動
- **絵文字**: 一目で状態がわかる
  - 💪: 活動済み
  - 🛌: 休息日
  - —: 未活動
- **レベル表示**: `Lv0` ～ `Lv10` で現在のレベルを表示
- **今日のハイライト**: 今日の日付を黄色の枠で強調

### 3. 日付タップでワークアウト一覧 ✅

日付をタップすると、その日のワークアウト一覧をモーダルで表示：

- **日付表示**: `2026年2月1日` 形式
- **ワークアウトカード**: 各記録をカード形式で表示
  - **種目タイプ**: 筋トレ/有酸素/軽めの運動
  - **タイトル**: ワークアウトのタイトル
  - **詳細情報**:
    - 筋トレ: 種目名とセット数
    - 有酸素: 時間と強度
    - 軽めの運動: ラベルと時間
  - **メモ**: 記録に追加されたメモ
- **空の状態**: 記録がない日は「記録がありません」と表示
- **閉じるボタン**: ✕ボタンでモーダルを閉じる

### 4. レベル履歴の一致 ✅

DayStateRepositoryから各日のレベルを取得して表示するため、過去編集でレベルが再計算されても正しく反映される：

- **レベル取得**: `dayStateRepo.getByDate(date)` で各日のレベルを取得
- **活動状態**: `workoutRepo.getByDate(date)` で記録の有無を確認
- **休息日**: DayStateから休息日フラグを取得

## 技術的な実装

### カレンダー日付生成

```typescript
function generateCalendarDates(year: number, month: number) {
  const firstDay = new Date(year, month - 1, 1);
  const startDayOfWeek = firstDay.getDay(); // 月初の曜日
  
  // 前月の日付も含めて開始日を計算
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - startDayOfWeek);
  
  // 6週間分（42日）の日付を生成
  const dates = [];
  for (let i = 0; i < 42; i++) {
    const current = new Date(startDate);
    current.setDate(current.getDate() + i);
    
    const dateStr = `${current.getFullYear()}-${...}`;
    const isCurrentMonth = current.getMonth() + 1 === month;
    
    dates.push({ date: dateStr, isCurrentMonth });
  }
  
  return dates;
}
```

### 各日の情報取得

```typescript
const infos = await Promise.all(
  dates.map(async ({ date, isCurrentMonth }) => {
    const dayState = await dayStateRepo.getByDate(date);
    const workouts = await workoutRepo.getByDate(date);
    
    return {
      date,
      level: dayState?.level ?? 0,
      isRestDay: dayState?.isRestDay ?? false,
      hasActivity: workouts.length > 0,
      isCurrentMonth,
    };
  })
);
```

### 状態の色分け

```typescript
function getDayStatusColor(day: DayInfo): string {
  if (!day.isCurrentMonth) return '#f0f0f0'; // 他月
  if (day.isRestDay) return '#34C759';       // 休息日（緑）
  if (day.hasActivity) return '#007AFF';     // 活動済み（青）
  return '#FF9500';                          // 未活動（オレンジ）
}
```

## UI/UX

### レイアウト

- **ヘッダー**: 月ナビゲーションと月表示
- **カレンダーグリッド**: 7列×6行の日付グリッド
- **凡例**: カレンダー下部に状態の色説明
- **モーダル**: 画面下部から上にスライド表示

### カラースキーム

- 🔵 活動済み: `#007AFF` (iOS Blue)
- 🟢 休息日: `#34C759` (iOS Green)
- 🟠 未活動: `#FF9500` (iOS Orange)
- ⭐ 今日: `#FFF9E6` 背景、`#FFD700` 枠線
- 🔴 日曜日: `#FF3B30` (iOS Red)
- 🔵 土曜日: `#007AFF` (iOS Blue)

### アクセシビリティ

- **タッチターゲット**: 各日のセルは十分な大きさ
- **視覚的フィードバック**: タップ時の状態変化
- **他月の日付**: タップ無効、視覚的に区別

## Gate確認

✅ **直近30日が見える**
- 月単位で表示、前月/翌月ボタンで自由に移動
- 今月ボタンで素早く現在に戻れる

✅ **過去編集でhistoryとlevelが一致する**
- DayStateRepositoryから各日のレベルを取得
- ワークアウト記録の有無も確認
- 再計算された結果が正しく反映される

## 次のステップ

**M6: Settings (Rest day)**
- 週の固定休息日設定
- 当日の休息日トグル
- 休息日にレベルが下がらない保証
