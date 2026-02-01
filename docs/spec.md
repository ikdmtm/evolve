# Spec: FitMorph (iOS first)

## 1. コンセプト
日々の活動（軽い運動も含む）を記録し、日次判定でキャラの見た目（stage）が変化する。
本人の体型とリンクは不要。キャラの意味付け（自分/相棒等）は明示しない。

## 2. ステージ
- stage: 0..9（10段階）
- 表示: stageごとに画像/モデルを差し替える（MVPは2D差分でOK）
- 変化演出: 0.3〜0.6秒のクロスフェード（MVP）

## 3. 日次判定（重要）
日付D（ローカル日付）に対して状態を持つ。

### 3.1 日次状態
- isRestDay: boolean（休息日）
- didActivity: boolean（その日に活動ログが1件でもある）

### 3.2 ステージ更新ルール（翌日へ）
前日のステージを stagePrev とする。

- isRestDay = true:
  - stageNext = stagePrev（維持）
- isRestDay = false かつ didActivity = true:
  - stageNext = min(9, stagePrev + 1)
- isRestDay = false かつ didActivity = false:
  - stageNext = max(0, stagePrev - 1)

※「軽めでもカウント」＝ didActivity の条件は **“活動ログが1件でも存在”**。

## 4. 活動ログ（記録）
### 4.1 記録の種類
- Strength（筋トレ）
- Cardio（有酸素）
- Light（軽め：ストレッチ、散歩、軽い自重など）

### 4.2 データモデル（MVP）
Workout (1回の記録)
- id
- date (YYYY-MM-DD)
- type: strength | cardio | light
- title (任意)
- note (任意)
- createdAt

Strength details:
- exercises[]: Exercise
  - name
  - sets[]: Set
    - reps? number
    - weightKg? number
    - rpe? number
    - note? string

Cardio details:
- minutes number
- intensity? (easy/medium/hard)

Light details:
- minutes? number
- label? string（散歩/ストレッチ等）

## 5. 過去編集と再計算（重要）
- 過去日のログ追加/削除/休息日の変更が起きたら、
  - その日以降の stage を当日から最終日まで再計算して保存/表示に反映する
- stageは“結果”として再計算可能であること（壊れないこと）

## 6. 画面（MVP）
- Home: 今日のstage表示 / 今日の状態（活動あり/なし/休息） / 今日のログ一覧
- Log: 記録の作成・編集（種目/セット等）
- History: カレンダーで日別の状態（+1/-1/休息）とログ参照
- Settings:
  - 週の休息日（固定）
  - その日だけ休息日トグル
  - 初期stage（デフォルト0）

## 7. 非機能（MVP）
- オフライン完結（ローカルDB）
- クラッシュしない
- 端末時刻変更/日付跨ぎで破綻しない（少なくとも再計算で復旧できる）
