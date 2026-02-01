# EAS Setup Guide - TestFlightで配布するまでの手順

このガイドでは、EAS（Expo Application Services）を使ってiOSアプリをビルドし、TestFlightで配布するまでの手順を説明します。

## 前提条件

### 必要なアカウント

1. **Apple Developer Program**
   - 費用: $99/年
   - 登録: https://developer.apple.com/programs/
   - 登録完了まで: 数時間〜1日

2. **Expo Account**
   - 無料アカウントで開始可能
   - 登録: https://expo.dev/signup

### 必要なツール

```bash
# EAS CLIがインストール済みか確認
eas --version

# インストールされていない場合
npm install -g eas-cli
```

## Step 1: Apple Developer Programへの登録

1. https://developer.apple.com/programs/ にアクセス
2. Apple IDでサインイン
3. 「Enroll」から登録（$99/年）
4. 登録完了まで待つ（数時間〜1日）

## Step 2: Expoアカウントにログイン

```bash
# Expoアカウントにログイン
eas login

# ログイン確認
eas whoami
```

## Step 3: EASプロジェクトの初期化

```bash
# プロジェクトルートで実行
cd /home/ikdmtm/app/evolve

# EASプロジェクトを初期化
eas build:configure

# プロジェクトIDが生成され、app.jsonに自動追加される
# 表示されたプロジェクトIDをメモしておく
```

**実行後:**
- `app.json`の`extra.eas.projectId`にプロジェクトIDが設定される
- EASダッシュボード（https://expo.dev）でプロジェクトが確認できる

## Step 4: App Store Connectでアプリを作成

1. https://appstoreconnect.apple.com/ にアクセス
2. Apple IDでサインイン
3. 「マイApp」→ 左上の「+」→「新規App」をクリック
4. 以下の情報を入力:
   - **プラットフォーム**: iOS
   - **名前**: FitMorph
   - **プライマリ言語**: 日本語
   - **バンドルID**: `com.fitmorph.app`（プルダウンから選択）
   - **SKU**: `fitmorph`（一意の識別子、変更不可）
   - **ユーザアクセス**: フルアクセス

5. 「作成」をクリック

**作成後:**
- アプリのApp IDが表示される（`eas.json`の`ascAppId`に使用）
- アプリの詳細ページが開く

## Step 5: `eas.json`の更新

`eas.json`の`submit.production.ios`セクションを更新:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCDE12345"
      }
    }
  }
}
```

**各項目の取得方法:**

### `appleId`
- Apple IDのメールアドレス

### `ascAppId`
- App Store Connectのアプリページで確認
- URL: `https://appstoreconnect.apple.com/apps/【この数字】/appstore`

### `appleTeamId`
- Apple Developer アカウントページで確認
- https://developer.apple.com/account → Membership → Team ID

## Step 6: 最初のビルド（development）

まずは開発用ビルドで動作確認:

```bash
# developmentビルド（シミュレータ用）
eas build --platform ios --profile development

# 初回ビルドは証明書作成のため質問される
# すべて「Yes」で進める（EASが自動管理）
```

**ビルド完了後:**
1. EASダッシュボードでビルド状況を確認
2. ビルド完了したらダウンロード
3. シミュレータで動作確認

```bash
# ダウンロードしたビルドをシミュレータにインストール
# （または、EAS CLIから直接インストール）
eas build:run --platform ios --profile development
```

## Step 7: 本番ビルド（production）

動作確認ができたら、本番ビルドを実行:

```bash
# productionビルド（TestFlight用）
eas build --platform ios --profile production

# ビルドには10〜30分かかる
# EASダッシュボードで進捗確認可能
```

**ビルド完了後:**
- IPAファイルがビルドされる
- EASダッシュボードからダウンロード可能

## Step 8: TestFlightへのアップロード

ビルドが完了したら、TestFlightにアップロード:

```bash
# 最新のビルドをTestFlightにアップロード
eas submit --platform ios --latest

# または、特定のビルドIDを指定
eas submit --platform ios --id YOUR_BUILD_ID
```

**アップロード完了後:**
1. App Store Connectの「TestFlight」タブを確認
2. ビルドが「処理中」→「テスト可能」になるまで待つ（5〜15分）
3. 内部テスターを追加
4. テスターにメール通知が送信される

## Step 9: 内部テスターの追加

1. App Store Connect → TestFlight → 内部テスト
2. 「テスター」の「+」をクリック
3. テスターのメールアドレスを入力
4. 「招待」をクリック

**テスター側:**
1. 招待メールを受信
2. TestFlightアプリをダウンロード（App Storeから）
3. 招待を承諾
4. アプリをインストールしてテスト

## コマンド一覧

### ログイン

```bash
# Expoアカウントにログイン
eas login

# ログイン状態確認
eas whoami
```

### プロジェクト管理

```bash
# EASプロジェクト初期化
eas build:configure

# プロジェクト情報確認
eas project:info
```

### ビルド

```bash
# developmentビルド（シミュレータ）
eas build --platform ios --profile development

# previewビルド（実機）
eas build --platform ios --profile preview

# productionビルド（TestFlight）
eas build --platform ios --profile production

# キャッシュをクリアしてビルド
eas build --platform ios --profile production --clear-cache

# ビルド一覧
eas build:list

# ビルドの詳細
eas build:view BUILD_ID
```

### アップロード

```bash
# 最新ビルドをTestFlightにアップロード
eas submit --platform ios --latest

# 特定のビルドをアップロード
eas submit --platform ios --id BUILD_ID
```

### 証明書管理

```bash
# 証明書の確認・管理
eas credentials

# 証明書の削除（再生成したい場合）
eas credentials --platform ios
```

## トラブルシューティング

### ビルドエラー: "Invalid Bundle Identifier"

**原因:**
- Bundle IDがApple Developer Portalに登録されていない

**解決方法:**
```bash
# EASが自動で登録するが、手動で確認する場合
# Apple Developer Portal → Certificates, Identifiers & Profiles → Identifiers
# com.fitmorph.app が存在するか確認
```

### ビルドエラー: "Provisioning Profile not found"

**原因:**
- 証明書またはプロビジョニングプロファイルが正しく設定されていない

**解決方法:**
```bash
# 証明書を再生成
eas credentials --platform ios

# "Remove Provisioning Profile" → "Set up new credentials"
```

### アップロードエラー: "Invalid IPA"

**原因:**
- ビルドプロファイルが間違っている（development/previewはアップロード不可）

**解決方法:**
```bash
# productionプロファイルでビルド
eas build --platform ios --profile production
```

### TestFlightでビルドが表示されない

**原因:**
- ビルドの処理中（5〜15分かかる）
- エラーが発生している

**解決方法:**
1. App Store Connect → TestFlight → ビルド
2. ステータスを確認
3. エラーがある場合は詳細を確認

### テスターが招待を受け取れない

**原因:**
- メールアドレスが間違っている
- スパムフォルダに入っている

**解決方法:**
1. メールアドレスを確認
2. スパムフォルダを確認
3. 再度招待を送信

## ビルドプロファイルの選び方

### development
- **用途**: 開発中の機能確認、デバッグ
- **特徴**: シミュレータ対応、高速ビルド
- **配布**: 不可

### preview
- **用途**: 実機での動作確認、内部テスト
- **特徴**: 実機専用、内部配布
- **配布**: Ad-Hoc（UDIDが必要）

### production
- **用途**: TestFlight配布、App Store提出
- **特徴**: 本番環境、ビルド番号自動インクリメント
- **配布**: TestFlight、App Store

## 料金について

### Apple Developer Program
- **費用**: $99/年
- **支払い**: クレジットカード
- **更新**: 自動更新（解約可能）

### EAS
- **無料プラン**: 月30ビルドまで
- **Productionプラン**: $29/月（無制限ビルド、優先サポート）
- **Enterpriseプラン**: $99/月（複数プロジェクト、チーム機能）

## 次のステップ

1. ✅ EASプロジェクト初期化
2. ✅ 最初のビルド成功
3. ✅ TestFlightにアップロード
4. ⏳ 内部テスト（5〜10人）
5. ⏳ 外部テスト（10〜100人）
6. ⏳ App Store審査提出
7. ⏳ 正式リリース

## 参考リンク

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [TestFlight Documentation](https://developer.apple.com/testflight/)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [Apple Developer Portal](https://developer.apple.com/account)
