
---

## RUNBOOK.md（“品質担保運用”を固定化）
```md
# Runbook (Single Agent + Quality Gate)

## 開発ルール（絶対）
1. 1マイルストーン = 1ブランチ
2. 仕様(docs/spec.md)に反する実装は禁止。変えるなら先にdocs/decisions.mdに追記
3. 実装前に「設計メモ（変更点/影響/テスト）」を書く
4. ユニットテスト（stage計算・再計算）を必ず付ける
5. 実機確認OK → 次のマイルストーンへ

## ブランチ運用
- main: 常に動く
- feat/m1-stage-engine のように切る
- マイルストーン完了時に main へマージ

## マイルストーン手順
- docs/milestones.md の該当項目を読む
- 実装 → `npm test` → `npx expo start` で実機確認
- docs/qa-checklist.md を埋めて “OK” なら次へ

## 実機確認の最低条件
- クラッシュしない
- データが保存される
- 日付を跨いだ/過去編集した時に stage が破綻しない
