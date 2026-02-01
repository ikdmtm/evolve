import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { colors, shadows, radius, spacing } from '../src/theme/colors';
import { DayStateRepository } from '../src/core/storage/DayStateRepository';
import { getTodayDate } from '../src/utils/date';

const WEEKDAYS = [
  { id: 0, label: '日曜日', short: '日' },
  { id: 1, label: '月曜日', short: '月' },
  { id: 2, label: '火曜日', short: '火' },
  { id: 3, label: '水曜日', short: '水' },
  { id: 4, label: '木曜日', short: '木' },
  { id: 5, label: '金曜日', short: '金' },
  { id: 6, label: '土曜日', short: '土' },
];

export default function SettingsScreen() {
  const [fixedRestDays, setFixedRestDays] = useState<number[]>([]);
  const [isTodayRestDay, setIsTodayRestDay] = useState(false);
  const [loading, setLoading] = useState(true);

  const today = getTodayDate();

  // 画面フォーカス時にデータを再読み込み
  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [])
  );

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      const dayStateRepo = new DayStateRepository();
      
      // 今日の休息日設定を取得
      const todayState = await dayStateRepo.getByDate(today);
      setIsTodayRestDay(todayState?.isRestDay ?? false);
      
      // TODO: 固定休息日の設定を取得（将来的にはSettingsRepositoryから）
      // 現在は空配列
      setFixedRestDays([]);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleTodayRestDay(value: boolean) {
    try {
      const dayStateRepo = new DayStateRepository();
      
      // 今日のDayStateを取得または作成
      const todayState = await dayStateRepo.getByDate(today);
      
      await dayStateRepo.upsert({
        date: today,
        isRestDay: value,
        level: todayState?.level ?? 0,
      });
      
      setIsTodayRestDay(value);
      Alert.alert(
        '設定完了',
        value ? '今日を休息日に設定しました' : '今日の休息日を解除しました'
      );
    } catch (error) {
      console.error('Failed to toggle rest day:', error);
      Alert.alert('エラー', '休息日の設定に失敗しました');
    }
  }

  function toggleFixedRestDay(dayId: number) {
    setFixedRestDays(prev => {
      if (prev.includes(dayId)) {
        return prev.filter(d => d !== dayId);
      } else {
        return [...prev, dayId].sort();
      }
    });
  }

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
        
        {/* 今日を休息日にする */}
        <View style={styles.card}>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>今日を休息日にする</Text>
              <Text style={styles.settingDescription}>
                {today} • 休息日は活動がなくてもレベルが下がりません
              </Text>
            </View>
            <Switch
              value={isTodayRestDay}
              onValueChange={toggleTodayRestDay}
              trackColor={{ false: colors.border, true: colors.primary + '60' }}
              thumbColor={isTodayRestDay ? colors.primary : colors.textMuted}
              disabled={loading}
            />
          </View>
        </View>

        {/* 固定休息日 */}
        <View style={[styles.card, { marginTop: spacing.md }]}>
          <View style={styles.settingItemColumn}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>固定休息日</Text>
              <Text style={styles.settingDescription}>毎週の休息日を設定（複数選択可）</Text>
            </View>
            <View style={styles.weekdayGrid}>
              {WEEKDAYS.map(day => (
                <TouchableOpacity
                  key={day.id}
                  style={[
                    styles.weekdayButton,
                    fixedRestDays.includes(day.id) && styles.weekdayButtonActive,
                  ]}
                  onPress={() => toggleFixedRestDay(day.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.weekdayButtonText,
                      fixedRestDays.includes(day.id) && styles.weekdayButtonTextActive,
                    ]}
                  >
                    {day.short}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {fixedRestDays.length > 0 && (
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>Coming Soon - 自動適用機能は未実装</Text>
              </View>
            )}
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
  settingItemColumn: {
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
    lineHeight: 18,
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
    marginTop: spacing.md,
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
  
  // 曜日グリッド
  weekdayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  weekdayButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  weekdayButtonActive: {
    backgroundColor: colors.primary + '30',
    borderColor: colors.primary,
  },
  weekdayButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  weekdayButtonTextActive: {
    color: colors.primary,
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
