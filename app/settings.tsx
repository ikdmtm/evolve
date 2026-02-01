import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, shadows, radius, spacing } from '../src/theme/colors';

export default function SettingsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.title}>設定</Text>
        <Text style={styles.subtitle}>アプリの設定をカスタマイズ</Text>
      </View>

      {/* 休息日設定セクション */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>休息日設定</Text>
        <View style={styles.card}>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>固定休息日</Text>
              <Text style={styles.settingDescription}>毎週の休息日を設定</Text>
            </View>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Coming Soon</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>今日を休息日にする</Text>
              <Text style={styles.settingDescription}>一時的な休息日設定</Text>
            </View>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Coming Soon</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 表示設定セクション */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>表示設定</Text>
        <View style={styles.card}>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>テーマ</Text>
              <Text style={styles.settingDescription}>ダークモード</Text>
            </View>
            <View style={styles.currentValue}>
              <Text style={styles.currentValueText}>ON</Text>
            </View>
          </View>
        </View>
      </View>

      {/* データ管理セクション */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>データ管理</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>データをエクスポート</Text>
              <Text style={styles.settingDescription}>記録をファイルに保存</Text>
            </View>
            <Text style={styles.chevron}>▶</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.danger }]}>データを初期化</Text>
              <Text style={styles.settingDescription}>すべての記録を削除</Text>
            </View>
            <Text style={styles.chevron}>▶</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* アプリ情報セクション */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>アプリ情報</Text>
        <View style={styles.card}>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>バージョン</Text>
            </View>
            <Text style={styles.versionText}>0.1.0</Text>
          </View>
        </View>
      </View>

      {/* フッター */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Evolve - 成長を可視化するアプリ</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  
  // ヘッダー
  header: {
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    backgroundColor: colors.backgroundLight,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  
  // セクション
  section: {
    padding: spacing.lg,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    paddingLeft: spacing.xs,
  },
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    ...shadows.small,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  comingSoonBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.backgroundLight,
    borderRadius: radius.xs,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  currentValue: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.primary + '30',
    borderRadius: radius.xs,
  },
  currentValueText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  chevron: {
    fontSize: 12,
    color: colors.textMuted,
  },
  versionText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  
  // フッター
  footer: {
    marginTop: spacing.xxl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
