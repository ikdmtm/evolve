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

## Development

### Run Local
```bash
# Start development server
npx expo start

# Run on iOS simulator
npx expo start --ios

# Run on Android emulator
npx expo start --android
```

### Test
```bash
# Run unit tests
npm test

# Run type check
npm run type-check
```

## Release

### EAS Build

```bash
# Login to Expo
eas login

# Development build (Simulator)
eas build --platform ios --profile development

# Preview build (Real device)
eas build --platform ios --profile preview

# Production build (TestFlight)
eas build --platform ios --profile production
```

### TestFlight Submission

```bash
# Submit latest build to TestFlight
eas submit --platform ios --latest

# Submit specific build
eas submit --platform ios --id BUILD_ID
```

### Setup Guide

詳細なセットアップ手順は [`docs/setup/EAS_SETUP.md`](docs/setup/EAS_SETUP.md) を参照してください。

## Milestones

- ✅ [M1: Core Data Model](docs/milestones/M1-completed.md)
- ✅ [M2: Recomputation Logic](docs/milestones/M2-completed.md)
- ✅ [M3: Log Screen](docs/milestones/M3-completed.md)
- ✅ [M4: Home Screen](docs/milestones/M4-completed.md)
- ✅ [M5: History + Calendar](docs/milestones/M5-completed.md)
- ✅ [M6: Settings (Rest Day)](docs/milestones/M6-completed.md)
- 🚧 [M7: Release Prep](docs/milestones/M7-release-prep.md)
