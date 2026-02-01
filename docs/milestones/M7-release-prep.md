# M7: Release Prep - TestFlightで配布できる状態

## 目標

- ✅ EAS設定
- ⏳ TestFlightで配布できる状態

## 実装内容

### 1. EAS設定 ✅

#### 1.1 `eas.json`の作成

**ビルドプロファイル:**
- **development**: 開発用ビルド（シミュレータ対応）
- **preview**: 内部テスト用ビルド（TestFlight前の確認）
- **production**: 本番ビルド（App Store用）

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "autoIncrement": true,
      "ios": {
        "simulator": false
      }
    }
  }
}
```

#### 1.2 `app.json`の更新

**追加項目:**
- `expo-dev-client`プラグインの追加
- `extra.eas.projectId`の設定（EASプロジェクトID）
- iOSの`infoPlist`設定

#### 1.3 `expo-dev-client`のインストール

```bash
npm install --save-dev expo-dev-client
```

### 2. TestFlightで配布できる状態 ⏳

#### 2.1 Apple Developer Account

**必要なもの:**
- [ ] Apple Developer Program（年間$99）への登録
- [ ] Apple ID
- [ ] App Store Connect へのアクセス

#### 2.2 EASプロジェクトの初期化

```bash
# EASにログイン
eas login

# EASプロジェクトを初期化
eas build:configure

# プロジェクトIDが自動生成され、app.jsonに追加される
```

#### 2.3 iOS証明書とプロビジョニングプロファイルの作成

```bash
# EASが自動で作成・管理してくれる
eas credentials
```

#### 2.4 ビルド実行

**開発ビルド（シミュレータ用）:**
```bash
eas build --platform ios --profile development
```

**プレビュービルド（実機用）:**
```bash
eas build --platform ios --profile preview
```

**本番ビルド（TestFlight用）:**
```bash
eas build --platform ios --profile production
```

#### 2.5 TestFlightへのアップロード

**App Store Connectの設定:**
1. App Store Connectにログイン
2. 「マイApp」から新規App作成
3. バンドルID: `com.fitmorph.app`
4. アプリ名: `FitMorph`

**自動アップロード:**
```bash
# ビルド後、自動でTestFlightにアップロード
eas submit --platform ios --latest
```

または手動で:
```bash
# App Store Connectに手動アップロード
# EASダッシュボードからIPAをダウンロード
# Transporter.appでアップロード
```

## ビルドプロファイルの使い分け

### development（開発用）

**用途:**
- 開発中の機能確認
- デバッグ作業
- シミュレータでのテスト

**特徴:**
- `developmentClient: true`（カスタムネイティブコード対応）
- シミュレータビルド可能
- 高速ビルド

### preview（プレビュー用）

**用途:**
- TestFlight前の最終確認
- 実機での動作確認
- 内部テスター向け配布

**特徴:**
- 実機専用
- 本番環境に近い設定
- 内部配布（Internal Distribution）

### production（本番用）

**用途:**
- TestFlight配布
- App Store審査提出
- 正式リリース

**特徴:**
- ビルド番号の自動インクリメント
- 本番環境
- App Store配布

## リリースフロー

```
┌──────────────┐
│ 開発・実装    │
└──────┬───────┘
       │
       ↓
┌──────────────┐
│ development  │ ← シミュレータで確認
│ ビルド        │
└──────┬───────┘
       │
       ↓
┌──────────────┐
│ preview      │ ← 実機で最終確認
│ ビルド        │
└──────┬───────┘
       │
       ↓
┌──────────────┐
│ production   │ ← TestFlightへ
│ ビルド        │
└──────┬───────┘
       │
       ↓
┌──────────────┐
│ TestFlight   │ ← 内部/外部テスター
│ 配布          │
└──────┬───────┘
       │
       ↓
┌──────────────┐
│ App Store    │ ← 審査・正式リリース
│ 提出          │
└──────────────┘
```

## 必要な情報

### Apple Developer Account

- **Apple ID**: `your-apple-id@example.com`
- **Team ID**: `eas.json`の`submit.production.ios.appleTeamId`
- **ASC App ID**: App Store ConnectでのアプリID

### Bundle Identifier

- **iOS**: `com.fitmorph.app`（`app.json`で設定済み）

### アプリ情報

- **アプリ名**: `FitMorph`
- **バージョン**: `0.1.0`
- **説明**: 筋トレ記録アプリ - キャラクターが成長する楽しい筋トレ管理

## セットアップ手順

### Step 1: Apple Developer Programへの登録

1. https://developer.apple.com/ にアクセス
2. Apple IDでログイン
3. 「Enroll」から登録（$99/年）
4. 登録完了まで数時間〜1日かかる

### Step 2: EASプロジェクトの初期化

```bash
# EASにログイン
eas login

# EASプロジェクトを初期化
eas build:configure

# プロジェクトIDが生成され、app.jsonに自動追加される
```

### Step 3: 最初のビルド

```bash
# developmentビルド（シミュレータ用）
eas build --platform ios --profile development

# ビルド完了後、ダウンロードしてシミュレータで実行
```

### Step 4: App Store Connectの設定

1. https://appstoreconnect.apple.com/ にアクセス
2. 「マイApp」→「+」→「新規App」
3. 以下を入力:
   - プラットフォーム: iOS
   - 名前: FitMorph
   - プライマリ言語: 日本語
   - バンドルID: com.fitmorph.app
   - SKU: fitmorph（一意の識別子）

### Step 5: TestFlightへの配布

```bash
# productionビルド
eas build --platform ios --profile production

# ビルド完了後、TestFlightにアップロード
eas submit --platform ios --latest
```

## Gate確認

### ✅ EAS設定完了

- [x] `eas.json`作成
- [x] `app.json`更新
- [x] `expo-dev-client`インストール

### ⏳ TestFlightで配布できる状態

- [ ] Apple Developer Programに登録
- [ ] EASプロジェクト初期化（`eas build:configure`）
- [ ] App Store Connectでアプリ作成
- [ ] 最初のビルド成功（`eas build --profile production`）
- [ ] TestFlightにアップロード（`eas submit`）

## 次のステップ

### Phase 1（今回）

- ✅ EAS設定ファイルの作成
- ⏳ Apple Developer Program登録（ユーザー側）
- ⏳ EASプロジェクト初期化
- ⏳ 最初のビルド

### Phase 2（将来）

- [ ] TestFlightでの内部テスト
- [ ] TestFlightでの外部テスト
- [ ] App Store審査提出
- [ ] 正式リリース

## 注意事項

### Apple Developer Programについて

- 年間$99の費用が必要
- 個人または組織アカウント
- 登録完了まで数時間〜1日かかる場合がある

### EASビルドについて

- ビルドはクラウドで実行される（Mac不要）
- 初回ビルドは時間がかかる（10〜30分）
- 無料プランでは月30ビルドまで

### TestFlightについて

- 内部テスター: 最大100人（即座にテスト可能）
- 外部テスター: 最大10,000人（App Reviewが必要）
- TestFlightビルドは90日間有効

## トラブルシューティング

### ビルドエラー

```bash
# キャッシュをクリアして再ビルド
eas build --platform ios --profile development --clear-cache
```

### 証明書エラー

```bash
# 証明書を再生成
eas credentials
```

### アップロードエラー

```bash
# 手動でアップロード
# 1. EASダッシュボードからIPAをダウンロード
# 2. Transporter.appでApp Store Connectにアップロード
```

## 参考資料

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [TestFlight Documentation](https://developer.apple.com/testflight/)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
