import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { WorkoutRepository } from '../src/core/storage/WorkoutRepository';
import { DayStateRepository } from '../src/core/storage/DayStateRepository';
import { getTodayDate, formatDateJP } from '../src/utils/date';
import { colors, getLevelColor, shadows, radius, spacing } from '../src/theme/colors';

export default function HomeScreen() {
  const [currentDate, setCurrentDate] = useState(getTodayDate());
  const [level, setLevel] = useState<number>(0);
  const [isRestDay, setIsRestDay] = useState(false);
  const [hasActivity, setHasActivity] = useState(false);
  const [loading, setLoading] = useState(true);

  const today = getTodayDate();

  // 画面フォーカス時にデータを再読み込み
  useFocusEffect(
    useCallback(() => {
      loadDayData();
    }, [currentDate])
  );

  useEffect(() => {
    loadDayData();
  }, [currentDate]);

  async function loadDayData() {
    try {
      setLoading(true);
      
      const dayStateRepo = new DayStateRepository();
      const workoutRepo = new WorkoutRepository();

      const dayState = await dayStateRepo.getByDate(currentDate);
      setLevel(dayState?.level ?? 0);
      setIsRestDay(dayState?.isRestDay ?? false);

      const workouts = await workoutRepo.getByDate(currentDate);
      setHasActivity(workouts.length > 0);
    } catch (error) {
      console.error('Failed to load day data:', error);
    } finally {
      setLoading(false);
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
    if (isRestDay) return '休息日';
    if (hasActivity) return '活動済み';
    return '未活動';
  }

  function getStatusIcon() {
    if (isRestDay) return '🌙';
    if (hasActivity) return '🔥';
    return '💤';
  }

  function getStatusColor() {
    if (isRestDay) return colors.info;
    if (hasActivity) return colors.success;
    return colors.warning;
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  const levelColor = getLevelColor(level);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 日付ナビゲーション */}
      <View style={styles.dateNav}>
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => navigateDate(-1)}
          activeOpacity={0.7}
        >
          <Text style={styles.navButtonText}>◀</Text>
        </TouchableOpacity>
        
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>{formatDateJP(currentDate)}</Text>
          {currentDate !== today && (
            <TouchableOpacity onPress={goToToday} style={styles.todayButton}>
              <Text style={styles.todayButtonText}>今日に戻る</Text>
            </TouchableOpacity>
          )}
          {currentDate === today && (
            <View style={styles.todayBadge}>
              <Text style={styles.todayBadgeText}>TODAY</Text>
            </View>
          )}
        </View>
        
        <TouchableOpacity 
          style={[styles.navButton, currentDate >= today && styles.navButtonDisabled]} 
          onPress={() => navigateDate(1)}
          disabled={currentDate >= today}
          activeOpacity={0.7}
        >
          <Text style={[styles.navButtonText, currentDate >= today && styles.navButtonTextDisabled]}>
            ▶
          </Text>
        </TouchableOpacity>
      </View>

      {/* メインカード - キャラクター & レベル */}
      <View style={styles.mainCard}>
        {/* キャラクター表示エリア */}
        <View style={styles.characterArea}>
          <View style={[styles.characterCircle, { borderColor: levelColor }]}>
            <Text style={styles.characterEmoji}>
              {level >= 8 ? '🦁' : level >= 5 ? '🐕' : level >= 2 ? '🐱' : '🐣'}
            </Text>
          </View>
          <View style={styles.levelBadge}>
            <Text style={[styles.levelBadgeText, { color: levelColor }]}>Lv.{level}</Text>
          </View>
        </View>

        {/* レベルバー */}
        <View style={styles.levelSection}>
          <View style={styles.levelHeader}>
            <Text style={styles.levelLabel}>レベル進捗</Text>
            <Text style={[styles.levelValue, { color: levelColor }]}>{level}/10</Text>
          </View>
          <View style={styles.levelBarContainer}>
            <View style={styles.levelBarBackground}>
              {[...Array(11)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.levelSegment,
                    i <= level && { backgroundColor: levelColor },
                  ]}
                />
              ))}
            </View>
          </View>
          <View style={styles.levelLabels}>
            <Text style={styles.levelLabelText}>0</Text>
            <Text style={styles.levelLabelText}>5</Text>
            <Text style={styles.levelLabelText}>10</Text>
          </View>
        </View>
      </View>

      {/* 状態カード */}
      <View style={[styles.statusCard, { borderLeftColor: getStatusColor() }]}>
        <View style={styles.statusIconContainer}>
          <Text style={styles.statusIcon}>{getStatusIcon()}</Text>
        </View>
        <View style={styles.statusInfo}>
          <Text style={styles.statusLabel}>本日のステータス</Text>
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>
      </View>

      {/* 説明カード */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>レベルシステム</Text>
        <View style={styles.infoList}>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>🔥</Text>
            <Text style={styles.infoText}>活動するとレベルUP</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>💤</Text>
            <Text style={styles.infoText}>何もしないとレベルDOWN</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>🌙</Text>
            <Text style={styles.infoText}>休息日はキープ</Text>
          </View>
        </View>
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
    padding: spacing.lg,
    paddingTop: 60,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
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
    backgroundColor: colors.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small,
  },
  navButtonDisabled: {
    backgroundColor: colors.backgroundLight,
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  navButtonTextDisabled: {
    color: colors.textMuted,
  },
  dateContainer: {
    alignItems: 'center',
  },
  dateText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  todayButton: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
  todayButtonText: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  todayBadge: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.accent,
    borderRadius: radius.xs,
  },
  todayBadgeText: {
    fontSize: 10,
    color: colors.background,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // メインカード
  mainCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.medium,
  },
  characterArea: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  characterCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.large,
  },
  characterEmoji: {
    fontSize: 64,
  },
  levelBadge: {
    marginTop: -16,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    backgroundColor: colors.background,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.backgroundCard,
  },
  levelBadgeText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
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
    color: colors.textSecondary,
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
    backgroundColor: colors.backgroundLight,
    borderRadius: radius.sm,
    padding: 4,
  },
  levelSegment: {
    flex: 1,
    height: 16,
    backgroundColor: colors.border,
    borderRadius: radius.xs,
  },
  levelLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  levelLabelText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
  },

  // 状態カード
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
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
    backgroundColor: colors.backgroundLight,
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
    color: colors.textMuted,
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
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.small,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  infoList: {
    gap: spacing.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
    width: 28,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});
