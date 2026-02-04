# 開発運用ルール（RUNBOOK）

## 1. ブランチ戦略とワークフロー

### 基本ルール
- **1マイルストーン = 1ブランチ = 1 PR**
- mainブランチへの直接プッシュは禁止
- 全ての変更はPR経由でマージ

### ワークフロー

1. **フィーチャーブランチを作成**
   ```bash
   git checkout -b feature/m[N]-[description]
   ```
   例: `feature/m3-log-screen`

2. **こまめにコミット**
   ```bash
   git add .
   git commit -m "feat: 機能の説明"
   ```

3. **リモートにプッシュ**
   ```bash
   git push -u origin feature/m[N]-[description]
   ```

4. **PRを作成**
   ```bash
   gh pr create --title "タイトル" --body "説明"
   ```

5. **CIの確認**
   ```bash
   gh pr checks [PR番号]
   ```
   - 全テストが通ることを確認
   - 失敗した場合は修正してpush

6. **マージ**
   ```bash
   gh pr merge [PR番号] --squash --delete-branch
   ```

7. **mainに戻る**
   ```bash
   git checkout main
   git pull
   ```

## 2. コミットメッセージ規約

### フォーマット
```
<type>: <subject>

<body>（オプション）
```

### Type
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント変更
- `test`: テスト追加・修正
- `refactor`: リファクタリング
- `ci`: CI/CD設定変更
- `chore`: その他の変更

### 例
```
feat: M3 Log Screen実装

- Workout作成画面
- 種目・セット入力UI
- データベース保存機能
```

## 3. マイルストーン開発ルール

### 実装前
1. `docs/milestones/M[N]-plan.md` を作成（計画）
2. 仕様書（`docs/spec.md`）に反する実装は禁止
3. 必要に応じて設計メモを作成

### 実装中
1. ユニットテスト必須（特にステージ計算・再計算）
2. 型チェック（`npm run type-check`）を通す
3. こまめにコミット・プッシュ

### 実装後
1. `docs/milestones/M[N]-completed.md` を作成（完了報告）
2. Gate条件を満たすことを確認
3. 実機で動作確認
4. PR作成→CI確認→マージ

## 4. テスト戦略

### ローカルでのテスト
```bash
# ユニットテスト
npm test

# 型チェック
npm run type-check

# 両方実行
npm run type-check && npm test
```

### CI/CD
- GitHub Actionsで自動実行
- PRマージ前に必ず通すこと
- 失敗時は修正してpush

## 5. コード品質

### 必須チェック
- [ ] TypeScriptの型エラーなし
- [ ] 全テストが通る
- [ ] 実機で動作確認済み
- [ ] Gate条件達成

### 推奨
- コードレビュー（AI含む）
- リファクタリング
- コメント追加（複雑なロジック）

## 6. データベースマイグレーション

### 新しいマイグレーション追加
1. `src/core/storage/db.ts` の `migrations` 配列に追加
2. バージョン番号をインクリメント
3. マイグレーション関数を実装
4. テスト確認

### 注意点
- 既存のマイグレーションは変更しない
- 後方互換性を保つ
- データ損失に注意

## 7. トラブルシューティング

### CI失敗時
```bash
# ログ確認
gh run view [RUN_ID] --log-failed

# ローカルで再現
npm ci
npm test
```

### 依存関係の問題
- `.npmrc` に `legacy-peer-deps=true` を設定済み
- `npm install --legacy-peer-deps` で解決

### データベースエラー
- アプリを完全に削除して再インストール
- データベーステスト機能で確認

## 8. 実機確認手順

### WSL2 で QR が無効になる場合

WSL2 では Expo が表示するアドレスが WSL 内の IP になり、スマホから届かないことがあります。**トンネルモード**で起動すると、公開URL経由で接続できます。

### 「使用可能なデータがありません」と出る場合

このプロジェクトには **expo-dev-client** が入っています。そのため通常の `expo start --tunnel` では **開発クライアント用**の QR が表示され、**Expo Go では読めません**。Expo Go で接続する場合は **`--go`** を付けて起動してください。

```bash
npm run start:tunnel:go
# または
npx expo start --tunnel --go
```

- 起動後、**「Tunnel ready」や exp://xxx.ngrok.io のような URL** が表示されたら、その QR コードを **Expo Go** でスキャンする
- トンネルが立ち上がるまで数十秒かかることがある
- QR が読めない場合は、ターミナルに表示された **exp://…** の URL を Expo Go の「URLを入力」欄にコピペしても接続できる

### 通常の実機確認

1. Expoサーバー起動
   ```bash
   npm start
   ```
   （WSL2 + Expo Go の場合は `npm run start:tunnel:go` を推奨）

2. Expo Goアプリでスキャン（トンネル起動時はトンネル用の QR をスキャン）

3. 動作確認
   - 各画面の表示
   - データ保存・取得
   - アプリ再起動後の永続化

4. 問題があれば修正→push

## 9. リリースフロー（M7以降）

1. EAS設定
2. TestFlight配布
3. QAチェックリスト実行
4. バージョンタグ作成
5. リリースノート作成

---

**重要**: このルールは `docs/spec.md` の仕様に基づきます。仕様に反する実装は禁止です。
