# Milestones

## M0: Scaffold + Routing
- expo-router導入
- 4画面の空ページ（Home/Log/History/Settings）
- 共通UI（Button/Card）だけ作る
### Gate
- 実機で画面遷移できる
- クラッシュなし

## M1: Stage Engine (Pure) + Tests
- stage計算を純粋関数で実装（src/core/domain/stage.ts）
- 再計算（timeline）を実装
- Jestでテストを作る
### Gate
- `npm test` が通る
- 10日分入力で期待通り ±1 / 休息維持が成立

## M2: SQLite + Repos + Migrations
- テーブル作成（workouts / day_states）
- CRUD（追加/更新/削除/取得）
- 過去編集 → 再計算の起点だけ用意
### Gate
- 実機で記録が保存され、再起動後も残る

## M3: Log Screen（筋トレ/有酸素/軽めの入力）
- Workout作成/編集/削除
- Strengthは種目/セットを追加できる
- Cardio/Lightはminutesとラベル
### Gate
- 実機で作成/編集/削除できる
- その日ログが1件あるだけで didActivity=true になる

## M4: Home Screen（見た目変化）
- 今日のstage表示（画像差し替え）
- 今日が休息/活動/未活動を表示
- 日付切替（昨日/今日など簡易）
### Gate
- 1日でstageが上がる/下がるの挙動が視覚で確認できる

## M5: History + Calendar
- 日ごとの状態（+1/-1/休息）をカレンダー表示
- タップでその日のログ一覧へ
### Gate
- 直近30日が見える
- 過去編集でhistoryとstageが一致する

## M6: Settings (Rest day)
- 週の固定休息日 + 当日トグル
- 休息日は下がらないことの保証
### Gate
- 休息日にして何も記録しなくてもstageが下がらない

## M7: Release prep
- EAS設定
- TestFlightで配布できる状態
### Gate
- TestFlightインストールでクラッシュなし
