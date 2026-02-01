# M3: Log Screen - 活動記録画面

## 目標

Workout（筋トレ/有酸素/軽め）を作成・編集・削除できる画面を実装する。

## Gate条件

- ✅ 実機で作成/編集/削除できる
- ✅ その日ログが1件あるだけで didActivity=true になる

## 実装する機能

### 1. 記録タイプ選択画面
- 3つのタイプから選択
  - 💪 Strength（筋トレ）
  - 🏃 Cardio（有酸素運動）
  - 🧘 Light（軽め活動）

### 2. Strength（筋トレ）入力
- タイトル（オプション）
- 種目追加
  - 種目名
  - セット追加/削除
    - 回数（reps）
    - 重量（kg）
    - RPE（主観的運動強度）
    - メモ
- 全体メモ

### 3. Cardio（有酸素）入力
- タイトル（オプション）
- 時間（分）
- 強度（easy/medium/hard）
- メモ

### 4. Light（軽め）入力
- タイトル（オプション）
- ラベル（散歩/ストレッチ等）
- 時間（分、オプション）
- メモ

### 5. 今日の記録一覧
- 今日作成した記録を表示
- タップで編集
- 削除機能

## UIコンポーネント構成

```
LogScreen (メイン画面)
├── WorkoutTypeSelector (タイプ選択)
├── WorkoutList (記録一覧)
└── WorkoutForm (作成・編集フォーム)
    ├── StrengthForm
    │   └── ExerciseEditor
    │       └── SetEditor
    ├── CardioForm
    └── LightForm
```

## データフロー

1. ユーザーがタイプを選択
2. フォームを表示
3. 入力完了→保存ボタン
4. WorkoutRepository.create()でDB保存
5. 記録一覧に表示

## 実装手順

1. WorkoutTypeSelector実装
2. 各フォーム実装（Strength/Cardio/Light）
3. WorkoutList実装（一覧表示）
4. 編集・削除機能
5. 実機テスト

## 注意点

- 日付は今日（ローカル日付）固定
- ID生成は `crypto.randomUUID()` または `Date.now()` + random
- バリデーション: 必須項目チェック
- UX: 保存後に一覧に戻る
