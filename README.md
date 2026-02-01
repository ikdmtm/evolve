# Continue (開発コード: FitMorph)

記録（筋トレ/有酸素/軽め活動）を付けると、日次判定でキャラのステージが変化するモチベーション型アプリ。

**アプリ名**: Continue  
**開発コード名**: FitMorph  
**プラットフォーム**: iOS first

> 詳細は [`docs/app-name.md`](docs/app-name.md) を参照

## Core Rules
- stage: 0..9（10段階）
- 休息日: stageが下がらない（維持）
- 休息日以外:
  - その日に何か1つでも活動ログがあれば stage +1（最大9）
  - 活動ログがなければ stage -1（最小0）
- 過去日の編集が入ったら、その日以降のstageは再計算する

## Run
```bash
npx expo start
