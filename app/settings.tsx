import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Linking } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { shadows, radius, spacing, darkColors } from '../src/theme/colors';
import { useTheme } from '../src/context/ThemeContext';
import { DayStateRepository } from '../src/core/storage/DayStateRepository';
import { SettingsRepository, CharacterType, CharacterGender } from '../src/core/storage/SettingsRepository';
import { getTodayDate } from '../src/utils/date';

// StyleSheet用の静的カラー（後方互換性）
const colors = darkColors;

const WEEKDAYS = [
  { id: 0, label: '日曜日', short: '日' },
  { id: 1, label: '月曜日', short: '月' },
  { id: 2, label: '火曜日', short: '火' },
  { id: 3, label: '水曜日', short: '水' },
  { id: 4, label: '木曜日', short: '木' },
  { id: 5, label: '金曜日', short: '金' },
  { id: 6, label: '土曜日', short: '土' },
];

const MAX_TOTAL_REST_DAYS = 6; // 固定休息日 + 手動休息日の合計が週6日まで
const MAX_MANUAL_REST_DAYS_PER_WEEK = 2; // 手動休息日は最大2日/週

export default function SettingsScreen() {
  const { theme, colors, toggleTheme } = useTheme();
  const [fixedRestDays, setFixedRestDays] = useState<number[]>([]);
  const [isTodayRestDay, setIsTodayRestDay] = useState(false);
  const [canSetRestDay, setCanSetRestDay] = useState(true);
  const [restrictionReason, setRestrictionReason] = useState<string>('');
  const [manualRestDaysCount, setManualRestDaysCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [characterType, setCharacterType] = useState<CharacterType>('simple');
  const [characterGender, setCharacterGender] = useState<CharacterGender>('male');

  const today = getTodayDate();

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
      const settingsRepo = new SettingsRepository();
      
      // 今日の休息日設定を取得
      const todayState = await dayStateRepo.getByDate(today);
      setIsTodayRestDay(todayState?.isRestDay ?? false);
      
      // 固定休息日の設定を取得
      const fixedDays = await settingsRepo.getFixedRestDays();
      setFixedRestDays(fixedDays);
      
      // キャラクター設定を取得
      const charType = await settingsRepo.getCharacterType();
      const charGender = await settingsRepo.getCharacterGender();
      setCharacterType(charType);
      setCharacterGender(charGender);
      
      // 休息日設定可否をチェック
      await checkCanSetRestDay(fixedDays);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function checkCanSetRestDay(currentFixedRestDays?: number[]) {
    try {
      const dayStateRepo = new DayStateRepository();
      const settingsRepo = new SettingsRepository();
      const fixedDays = currentFixedRestDays ?? await settingsRepo.getFixedRestDays();
      
      // 1. 前日が休息日かチェック
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
      const yesterdayState = await dayStateRepo.getByDate(yesterdayStr);
      
      if (yesterdayState?.isRestDay) {
        setCanSetRestDay(false);
        setRestrictionReason('前日が休息日のため、連続で設定できません');
        return;
      }
      
      // 2. 直近7日間の手動休息日カウント（固定休息日を除く）
      let manualRestCount = 0;
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        
        const dayState = await dayStateRepo.getByDate(dateStr);
        // 固定休息日でない休息日をカウント
        const dayOfWeek = date.getDay();
        const isFixedRestDay = fixedDays.includes(dayOfWeek);
        
        if (dayState?.isRestDay && dateStr !== today && !isFixedRestDay) {
          manualRestCount++;
        }
      }
      
      setManualRestDaysCount(manualRestCount);
      
      // 固定休息日を考慮した上限チェック
      // 手動休息日は最大2日/週、かつ合計6日以内
      const maxManualRestDays = Math.min(
        MAX_MANUAL_REST_DAYS_PER_WEEK,
        MAX_TOTAL_REST_DAYS - fixedDays.length
      );
      if (manualRestCount >= maxManualRestDays) {
        setCanSetRestDay(false);
        if (manualRestCount >= MAX_MANUAL_REST_DAYS_PER_WEEK) {
          setRestrictionReason(`手動休息日は週${MAX_MANUAL_REST_DAYS_PER_WEEK}日までです（現在${manualRestCount}日使用中）`);
        } else {
          setRestrictionReason(`週の上限に達しています（固定休息日${fixedDays.length}日 + 手動${manualRestCount}日 = ${fixedDays.length + manualRestCount}日/週）`);
        }
        return;
      }
      
      setCanSetRestDay(true);
      setRestrictionReason('');
    } catch (error) {
      console.error('Failed to check rest day availability:', error);
    }
  }

  async function toggleTodayRestDay(value: boolean) {
    if (value && !canSetRestDay) {
      Alert.alert('設定できません', restrictionReason);
      return;
    }
    
    try {
      const dayStateRepo = new DayStateRepository();
      const todayState = await dayStateRepo.getByDate(today);
      
      await dayStateRepo.upsert({
        date: today,
        isRestDay: value,
        level: todayState?.level ?? 0,
      });
      
      setIsTodayRestDay(value);
      
      if (value) {
        const maxManualRestDays = Math.min(
          MAX_MANUAL_REST_DAYS_PER_WEEK,
          MAX_TOTAL_REST_DAYS - fixedRestDays.length
        );
        Alert.alert(
          '設定完了',
          `今日を休息日に設定しました\n\n残り使用可能回数: ${maxManualRestDays - manualRestDaysCount - 1}回/週`
        );
      } else {
        Alert.alert('設定解除', '今日の休息日を解除しました');
      }
      
      // 再チェック
      await checkCanSetRestDay();
    } catch (error) {
      console.error('Failed to toggle rest day:', error);
      Alert.alert('エラー', '休息日の設定に失敗しました');
    }
  }

  async function toggleFixedRestDay(dayId: number) {
    try {
      const settingsRepo = new SettingsRepository();
      let newFixedRestDays: number[];
      
      if (fixedRestDays.includes(dayId)) {
        newFixedRestDays = fixedRestDays.filter(d => d !== dayId);
      } else {
        // 最大6日までの制限
        if (fixedRestDays.length >= MAX_TOTAL_REST_DAYS) {
          Alert.alert(
            '選択できません',
            `固定休息日は最大${MAX_TOTAL_REST_DAYS}日までです。\n最低週1日は活動する日が必要です。`
          );
          return;
        }
        newFixedRestDays = [...fixedRestDays, dayId].sort();
      }
      
      // データベースに保存
      await settingsRepo.setFixedRestDays(newFixedRestDays);
      setFixedRestDays(newFixedRestDays);
      
      // 休息日設定可否を再チェック
      await checkCanSetRestDay(newFixedRestDays);
    } catch (error) {
      console.error('Failed to toggle fixed rest day:', error);
      Alert.alert('エラー', '固定休息日の設定に失敗しました');
    }
  }

  async function updateCharacterType(type: CharacterType) {
    try {
      const settingsRepo = new SettingsRepository();
      await settingsRepo.setCharacterType(type);
      setCharacterType(type);
    } catch (error) {
      console.error('Failed to update character type:', error);
      Alert.alert('エラー', 'キャラクタータイプの設定に失敗しました');
    }
  }

  async function updateCharacterGender(gender: CharacterGender) {
    try {
      const settingsRepo = new SettingsRepository();
      await settingsRepo.setCharacterGender(gender);
      setCharacterGender(gender);
    } catch (error) {
      console.error('Failed to update character gender:', error);
      Alert.alert('エラー', '性別の設定に失敗しました');
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* ヘッダー */}
      <View style={[styles.header, { backgroundColor: colors.backgroundLight }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>設定</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>アプリの設定をカスタマイズ</Text>
      </View>

      {/* 休息日設定セクション */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>休息日設定</Text>
        
        {/* 今日を休息日にする */}
        <View style={[styles.card, { backgroundColor: colors.backgroundCard }]}>
          <View style={styles.settingItemColumn}>
            <View style={styles.settingHeader}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>今日を休息日にする</Text>
                <Text style={[styles.settingDescription, { color: colors.textMuted }]}>
                  急な用事で運動できない時に使用
                </Text>
              </View>
              <Switch
                value={isTodayRestDay}
                onValueChange={toggleTodayRestDay}
                trackColor={{ false: colors.border, true: colors.primary + '60' }}
                thumbColor={isTodayRestDay ? colors.primary : colors.textMuted}
                disabled={loading || (!isTodayRestDay && !canSetRestDay)}
              />
            </View>
            
            {/* 制限情報 */}
            <View style={styles.restrictionInfo}>
              {!canSetRestDay && !isTodayRestDay ? (
                <View style={[styles.restrictionBadge, { backgroundColor: colors.danger + '20', borderLeftColor: colors.danger }]}>
                  <Text style={[styles.restrictionText, { color: colors.danger }]}>{restrictionReason}</Text>
                </View>
              ) : (
                <View style={[styles.usageInfo, { backgroundColor: colors.backgroundLight, borderLeftColor: colors.primary }]}>
                  <Text style={[styles.usageText, { color: colors.textPrimary }]}>
                    使用状況: {manualRestDaysCount}/{Math.min(MAX_MANUAL_REST_DAYS_PER_WEEK, MAX_TOTAL_REST_DAYS - fixedRestDays.length)}回/週
                  </Text>
                  <Text style={[styles.usageSubtext, { color: colors.textMuted }]}>
                    • 連続使用: 不可{'\n'}
                    • 手動休息日: 最大{MAX_MANUAL_REST_DAYS_PER_WEEK}日/週{'\n'}
                    • 固定休息日: {fixedRestDays.length}日{'\n'}
                    • 合計上限: {MAX_TOTAL_REST_DAYS}日/週
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* 固定休息日 */}
        <View style={[styles.card, { marginTop: spacing.md, backgroundColor: colors.backgroundCard }]}>
          <View style={styles.settingItemColumn}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>固定休息日</Text>
              <Text style={[styles.settingDescription, { color: colors.textMuted }]}>
                毎週の休息日を設定（最大{MAX_TOTAL_REST_DAYS}日）
              </Text>
            </View>
            <View style={styles.weekdayGrid}>
              {WEEKDAYS.map(day => (
                <TouchableOpacity
                  key={day.id}
                  style={[
                    styles.weekdayButton,
                    { backgroundColor: colors.backgroundLight, borderColor: colors.border },
                    fixedRestDays.includes(day.id) && { backgroundColor: colors.primary + '30', borderColor: colors.primary },
                  ]}
                  onPress={() => toggleFixedRestDay(day.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.weekdayButtonText,
                      { color: colors.textSecondary },
                      fixedRestDays.includes(day.id) && { color: colors.primary },
                    ]}
                  >
                    {day.short}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.fixedRestInfo}>
              <Text style={[styles.fixedRestText, { color: colors.textSecondary }]}>
                選択中: {fixedRestDays.length}/{MAX_TOTAL_REST_DAYS}日 • 残り活動日: {7 - fixedRestDays.length}日/週
              </Text>
            </View>
            {fixedRestDays.length > 0 && (
              <View style={[styles.activeBadge, { backgroundColor: colors.success + '20' }]}>
                <Text style={[styles.activeText, { color: colors.success }]}>✓ 設定保存済み</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* 表示設定セクション */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>表示設定</Text>
        
        {/* キャラクター設定 */}
        <View style={[styles.card, { backgroundColor: colors.backgroundCard, marginBottom: spacing.md }]}>
          <View style={styles.settingItemColumn}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>キャラクタータイプ</Text>
              <Text style={[styles.settingDescription, { color: colors.textMuted }]}>
                表示するキャラクターを選択
              </Text>
            </View>
            <View style={styles.optionGrid}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  { backgroundColor: colors.backgroundLight, borderColor: colors.border },
                  characterType === 'simple' && { backgroundColor: colors.primary + '30', borderColor: colors.primary },
                ]}
                onPress={() => updateCharacterType('simple')}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.optionButtonText,
                  { color: colors.textSecondary },
                  characterType === 'simple' && { color: colors.primary, fontWeight: '700' },
                ]}>
                  シンプル
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  { backgroundColor: colors.backgroundLight, borderColor: colors.border },
                  characterType === 'muscle' && { backgroundColor: colors.primary + '30', borderColor: colors.primary },
                ]}
                onPress={() => updateCharacterType('muscle')}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.optionButtonText,
                  { color: colors.textSecondary },
                  characterType === 'muscle' && { color: colors.primary, fontWeight: '700' },
                ]}>
                  筋トレ
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  { backgroundColor: colors.backgroundLight, borderColor: colors.border },
                  characterType === 'diet' && { backgroundColor: colors.primary + '30', borderColor: colors.primary },
                ]}
                onPress={() => updateCharacterType('diet')}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.optionButtonText,
                  { color: colors.textSecondary },
                  characterType === 'diet' && { color: colors.primary, fontWeight: '700' },
                ]}>
                  ダイエット
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 性別設定 */}
        {characterType !== 'simple' && (
          <View style={[styles.card, { backgroundColor: colors.backgroundCard, marginBottom: spacing.md }]}>
            <View style={styles.settingItemColumn}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>性別</Text>
                <Text style={[styles.settingDescription, { color: colors.textMuted }]}>
                  キャラクターの性別を選択
                </Text>
              </View>
              <View style={styles.optionGrid}>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    { backgroundColor: colors.backgroundLight, borderColor: colors.border },
                    characterGender === 'male' && { backgroundColor: colors.primary + '30', borderColor: colors.primary },
                  ]}
                  onPress={() => updateCharacterGender('male')}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.optionButtonText,
                    { color: colors.textSecondary },
                    characterGender === 'male' && { color: colors.primary, fontWeight: '700' },
                  ]}>
                    男性
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    { backgroundColor: colors.backgroundLight, borderColor: colors.border },
                    characterGender === 'female' && { backgroundColor: colors.primary + '30', borderColor: colors.primary },
                  ]}
                  onPress={() => updateCharacterGender('female')}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.optionButtonText,
                    { color: colors.textSecondary },
                    characterGender === 'female' && { color: colors.primary, fontWeight: '700' },
                  ]}>
                    女性
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ダークモード */}
        <View style={[styles.card, { backgroundColor: colors.backgroundCard }]}>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>ダークモード</Text>
              <Text style={[styles.settingDescription, { color: colors.textMuted }]}>
                {theme === 'dark' ? 'ダークテーマを使用' : 'ライトテーマを使用'}
              </Text>
            </View>
            <Switch
              value={theme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary + '60' }}
              thumbColor={theme === 'dark' ? colors.primary : colors.textMuted}
            />
          </View>
        </View>
      </View>

      {/* データ管理セクション */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>データ管理</Text>
        <View style={[styles.card, { backgroundColor: colors.backgroundCard }]}>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.textMuted }]}>データをエクスポート</Text>
              <Text style={[styles.settingDescription, { color: colors.textMuted }]}>Coming Soon</Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.danger }]}>データを初期化</Text>
              <Text style={[styles.settingDescription, { color: colors.textMuted }]}>すべての記録を削除</Text>
            </View>
            <Text style={[styles.chevron, { color: colors.textMuted }]}>▶</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* アプリ情報セクション */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>アプリ情報</Text>
        <View style={[styles.card, { backgroundColor: colors.backgroundCard }]}>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>バージョン</Text>
            </View>
            <Text style={[styles.versionText, { color: colors.textSecondary }]}>0.1.0</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <TouchableOpacity 
            style={styles.settingItem} 
            activeOpacity={0.7}
            onPress={() => Linking.openURL('https://ikdmtm.github.io/evolve-docs/privacy.html')}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabelSmall, { color: colors.textSecondary }]}>プライバシーポリシー</Text>
            </View>
            <Text style={[styles.chevron, { color: colors.textMuted }]}>▶</Text>
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <TouchableOpacity 
            style={styles.settingItem} 
            activeOpacity={0.7}
            onPress={() => Linking.openURL('https://ikdmtm.github.io/evolve-docs/support.html')}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabelSmall, { color: colors.textSecondary }]}>サポート</Text>
            </View>
            <Text style={[styles.chevron, { color: colors.textMuted }]}>▶</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* フッター */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textMuted }]}>Evolve - 成長を可視化するアプリ</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  
  // ヘッダー
  header: {
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
  },
  
  // セクション
  section: {
    padding: spacing.lg,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    paddingLeft: spacing.xs,
  },
  card: {
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
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingLabelSmall: {
    fontSize: 14,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 12,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    marginHorizontal: spacing.md,
  },
  
  // 制限情報
  restrictionInfo: {
    marginTop: spacing.md,
  },
  restrictionBadge: {
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderLeftWidth: 3,
  },
  restrictionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  usageInfo: {
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderLeftWidth: 3,
  },
  usageText: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  usageSubtext: {
    fontSize: 11,
    lineHeight: 16,
  },
  
  // 固定休息日
  fixedRestInfo: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  fixedRestText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  activeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.xs,
    marginTop: spacing.sm,
  },
  activeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chevron: {
    fontSize: 12,
  },
  versionText: {
    fontSize: 14,
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
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  weekdayButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  
  // オプション選択グリッド
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  optionButton: {
    flexBasis: '30%',
    flexGrow: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  optionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  // フッター
  footer: {
    marginTop: spacing.xxl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
  },
});
