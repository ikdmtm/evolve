import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { WorkoutRepository } from '../src/core/storage/WorkoutRepository';
import { DayStateRepository } from '../src/core/storage/DayStateRepository';
import { SettingsRepository, CharacterType, CharacterGender } from '../src/core/storage/SettingsRepository';
import { getTodayDate, formatDateJP } from '../src/utils/date';
import { getLevelColor, shadows, radius, spacing } from '../src/theme/colors';
import { useTheme } from '../src/context/ThemeContext';
import { LevelDisplay } from '../src/ui/components/LevelDisplay';
import { CharacterDisplay } from '../src/ui/components/CharacterDisplay';

export default function HomeScreen() {
  const { colors } = useTheme();
  const [currentDate, setCurrentDate] = useState(getTodayDate());
  const [level, setLevel] = useState<number>(0);
  const [isRestDay, setIsRestDay] = useState(false);
  const [hasActivity, setHasActivity] = useState(false);
  const [loading, setLoading] = useState(true);
  const [characterType, setCharacterType] = useState<CharacterType>('simple');
  const [characterGender, setCharacterGender] = useState<CharacterGender>('male');

  const today = getTodayDate();

  // 画面フォーカス時にデータを再読み込み
  useFocusEffect(
    useCallback(() => {
      loadDayData();
    }, [])
  );

  useEffect(() => {
    loadDayData();
  }, [currentDate]);

  async function loadDayData() {
    try {
      setLoading(true);
      
      const dayStateRepo = new DayStateRepository();
      const workoutRepo = new WorkoutRepository();
      const settingsRepo = new SettingsRepository();

      // まず前日のレベルを確定させる（今日を読み込むときのみ）
      if (currentDate === today) {
        await finalizePreviousDays(dayStateRepo, workoutRepo, settingsRepo);
      }

      let dayState = await dayStateRepo.getByDate(currentDate);
      
      // 固定休息日かどうかをチェック
      const dayOfWeek = new Date(currentDate).getDay();
      const fixedRestDays = await settingsRepo.getFixedRestDays();
      const isFixedRestDay = fixedRestDays.includes(dayOfWeek);
      
      // ワークアウトの有無を確認
      const workouts = await workoutRepo.getByDate(currentDate);
      const hasActivity = workouts.length > 0;
      
      // レベルが存在しない場合は前日から計算
      if (!dayState || dayState.level === undefined) {
        const yesterday = new Date(currentDate);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
        const yesterdayState = await dayStateRepo.getByDate(yesterdayStr);
        const prevLevel = yesterdayState?.level ?? 0;
        
        const isManualRestDay = dayState?.isRestDay ?? false;
        const isRestDay = isManualRestDay || isFixedRestDay;
        
        // 今日の場合は前日のレベルをそのまま表示（まだ確定していない）
        if (currentDate === today) {
          setLevel(prevLevel);
          // dayStateオブジェクトを作成（保存はしない）
          dayState = { date: currentDate, isRestDay, level: prevLevel };
        } else {
          // 過去の日の場合は、レベルを計算して保存
          let newLevel = prevLevel;
          if (hasActivity) {
            newLevel = Math.min(prevLevel + 1, 10);
          } else if (isRestDay) {
            newLevel = prevLevel;
          } else {
            newLevel = Math.max(prevLevel - 1, 0);
          }
          
          // データベースに保存
          await dayStateRepo.upsert({
            date: currentDate,
            isRestDay: isRestDay,
            level: newLevel,
          });
          
          setLevel(newLevel);
          dayState = { date: currentDate, isRestDay, level: newLevel };
        }
      } else {
        setLevel(dayState.level);
      }
      
      // 固定休息日または手動休息日の場合はisRestDay=true
      setIsRestDay(dayState?.isRestDay ?? isFixedRestDay);
      setHasActivity(hasActivity);

      // キャラクター設定を読み込み
      const charType = await settingsRepo.getCharacterType();
      const charGender = await settingsRepo.getCharacterGender();
      setCharacterType(charType);
      setCharacterGender(charGender);
    } catch (error) {
      console.error('Failed to load day data:', error);
    } finally {
      setLoading(false);
    }
  }

  /**
   * 過去の未確定日のレベルを確定させる
   * 今日より前の日で、レベルが記録されていない日を遡って確定する
   */
  async function finalizePreviousDays(
    dayStateRepo: DayStateRepository,
    workoutRepo: WorkoutRepository,
    settingsRepo: SettingsRepository
  ) {
    // 最大30日前まで遡る
    const daysToCheck = 30;
    const datesToFinalize: string[] = [];
    
    // 未確定の日をリストアップ
    for (let i = 1; i <= daysToCheck; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      const dayState = await dayStateRepo.getByDate(dateStr);
      if (!dayState || dayState.level === undefined) {
        datesToFinalize.push(dateStr);
      } else {
        // レベルが記録されている日に到達したら終了
        break;
      }
    }
    
    // 古い順（最も過去の日から）に確定していく
    datesToFinalize.reverse();
    
    for (const dateStr of datesToFinalize) {
      // 前日のレベルを取得
      const date = new Date(dateStr);
      date.setDate(date.getDate() - 1);
      const prevDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const prevDayState = await dayStateRepo.getByDate(prevDateStr);
      const prevLevel = prevDayState?.level ?? 0;
      
      // その日の活動と休息日設定を確認
      const workouts = await workoutRepo.getByDate(dateStr);
      const hasActivity = workouts.length > 0;
      
      const dateObj = new Date(dateStr);
      const dayOfWeek = dateObj.getDay();
      const fixedRestDays = await settingsRepo.getFixedRestDays();
      const isFixedRestDay = fixedRestDays.includes(dayOfWeek);
      
      const existingDayState = await dayStateRepo.getByDate(dateStr);
      const isManualRestDay = existingDayState?.isRestDay ?? false;
      const isRestDay = isManualRestDay || isFixedRestDay;
      
      // レベルを計算
      let newLevel = prevLevel;
      if (hasActivity) {
        newLevel = Math.min(prevLevel + 1, 10);
      } else if (isRestDay) {
        newLevel = prevLevel;
      } else {
        newLevel = Math.max(prevLevel - 1, 0);
      }
      
      // データベースに保存
      await dayStateRepo.upsert({
        date: dateStr,
        isRestDay: isRestDay,
        level: newLevel,
      });
      
      console.log(`[finalizePreviousDays] ${dateStr}: ${prevLevel} -> ${newLevel} (hasActivity: ${hasActivity}, isRestDay: ${isRestDay})`);
    }
  }

  function navigateDate(offset: number) {
    const date = new Date(currentDate);
    date.setDate(date.getDate() + offset);
    const newDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    setCurrentDate(newDate);
  }

  function goToToday() {
    setCurrentDate(today);
  }

  function getStatusText() {
    // 活動優先: 活動がある場合は休息日でも活動日として表示
    if (hasActivity) return '活動済み';
    if (isRestDay) return '休息日';
    return '未活動';
  }

  function getStatusIcon() {
    // 活動優先: 活動がある場合は休息日でも活動日として表示
    if (hasActivity) return '🔥';
    if (isRestDay) return '🌙';
    return '💤';
  }

  function getStatusColor() {
    // 活動優先: 活動がある場合は休息日でも活動日として表示
    if (hasActivity) return colors.success;
    if (isRestDay) return colors.info;
    return colors.warning;
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>読み込み中...</Text>
      </View>
    );
  }

  const levelColor = getLevelColor(level, colors);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* 日付ナビゲーション */}
      <View style={styles.dateNav}>
        <TouchableOpacity 
          style={[styles.navButton, { backgroundColor: colors.backgroundCard }]} 
          onPress={() => navigateDate(-1)}
          activeOpacity={0.7}
        >
          <Text style={[styles.navButtonText, { color: colors.primary }]}>◀</Text>
        </TouchableOpacity>
        
        <View style={styles.dateContainer}>
          <Text style={[styles.dateText, { color: colors.textPrimary }]}>{formatDateJP(currentDate)}</Text>
          {currentDate !== today && (
            <TouchableOpacity onPress={goToToday} style={[styles.todayButton, { backgroundColor: colors.primary }]}>
              <Text style={[styles.todayButtonText, { color: colors.textPrimary }]}>今日に戻る</Text>
            </TouchableOpacity>
          )}
          {currentDate === today && (
            <View style={[styles.todayBadge, { backgroundColor: colors.accent }]}>
              <Text style={[styles.todayBadgeText, { color: colors.background }]}>TODAY</Text>
            </View>
          )}
        </View>
        
        <TouchableOpacity 
          style={[styles.navButton, { backgroundColor: colors.backgroundCard }, currentDate >= today && { backgroundColor: colors.backgroundLight, opacity: 0.5 }]} 
          onPress={() => navigateDate(1)}
          disabled={currentDate >= today}
          activeOpacity={0.7}
        >
          <Text style={[styles.navButtonText, { color: colors.primary }, currentDate >= today && { color: colors.textMuted }]}>
            ▶
          </Text>
        </TouchableOpacity>
      </View>

      {/* メインカード - レベル可視化 */}
      <View style={[styles.mainCard, { backgroundColor: colors.backgroundCard }]}>
        <View style={styles.characterArea}>
          {characterType === 'simple' ? (
            <LevelDisplay level={level} levelColor={levelColor} colors={colors} />
          ) : (
            <CharacterDisplay 
              level={level} 
              characterType={characterType} 
              characterGender={characterGender} 
            />
          )}
        </View>

        {/* レベルバー */}
        <View style={styles.levelSection}>
          <View style={styles.levelHeader}>
            <Text style={[styles.levelLabel, { color: colors.textSecondary }]}>レベル進捗</Text>
            <Text style={[styles.levelValue, { color: levelColor }]}>{level}/10</Text>
          </View>
          <View style={styles.levelBarContainer}>
            <View style={[styles.levelBarBackground, { backgroundColor: colors.backgroundLight }]}>
              {[...Array(11)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.levelSegment,
                    { backgroundColor: colors.border },
                    i <= level && { backgroundColor: levelColor },
                  ]}
                />
              ))}
            </View>
          </View>
          <View style={styles.levelLabels}>
            <Text style={[styles.levelLabelText, { color: colors.textMuted }]}>0</Text>
            <Text style={[styles.levelLabelText, { color: colors.textMuted }]}>5</Text>
            <Text style={[styles.levelLabelText, { color: colors.textMuted }]}>10</Text>
          </View>
        </View>
      </View>

      {/* 状態カード */}
      <View style={[styles.statusCard, { backgroundColor: colors.backgroundCard, borderLeftColor: getStatusColor() }]}>
        <View style={[styles.statusIconContainer, { backgroundColor: colors.backgroundLight }]}>
          <Text style={styles.statusIcon}>{getStatusIcon()}</Text>
        </View>
        <View style={styles.statusInfo}>
          <Text style={[styles.statusLabel, { color: colors.textMuted }]}>本日のステータス</Text>
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>
      </View>

      {/* 説明カード */}
      <View style={[styles.infoCard, { backgroundColor: colors.backgroundCard }]}>
        <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>レベルシステム</Text>
        <View style={styles.infoList}>
          <View style={styles.infoItem}>
            <View style={[styles.infoBullet, { backgroundColor: colors.primary }]} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>活動するとレベルUP</Text>
          </View>
          <View style={styles.infoItem}>
            <View style={[styles.infoBullet, { backgroundColor: colors.primary }]} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>何もしないとレベルDOWN</Text>
          </View>
          <View style={styles.infoItem}>
            <View style={[styles.infoBullet, { backgroundColor: colors.primary }]} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>休息日はキープ</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingTop: 60,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
  
  // 日付ナビゲーション
  dateNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dateContainer: {
    alignItems: 'center',
  },
  dateText: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  todayButton: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  todayButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  todayBadge: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  todayBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // メインカード
  mainCard: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.medium,
  },
  characterArea: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },

  // レベルセクション
  levelSection: {
    marginTop: spacing.sm,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  levelLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  levelValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  levelBarContainer: {
    marginBottom: spacing.xs,
  },
  levelBarBackground: {
    flexDirection: 'row',
    gap: 3,
    borderRadius: radius.sm,
    padding: 4,
  },
  levelSegment: {
    flex: 1,
    height: 16,
    borderRadius: radius.xs,
  },
  levelLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  levelLabelText: {
    fontSize: 10,
    fontWeight: '600',
  },

  // 状態カード
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    ...shadows.small,
  },
  statusIconContainer: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  statusIcon: {
    fontSize: 24,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusText: {
    fontSize: 22,
    fontWeight: '700',
  },

  // 説明カード
  infoCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.small,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  infoList: {
    gap: spacing.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.sm,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
