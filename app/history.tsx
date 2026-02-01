import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { WorkoutRepository } from '../src/core/storage/WorkoutRepository';
import { DayStateRepository } from '../src/core/storage/DayStateRepository';
import { formatDateJP, getTodayDate } from '../src/utils/date';
import { colors, getLevelColor, shadows, radius, spacing } from '../src/theme/colors';
import type { Workout } from '../src/core/domain/models';

interface DayInfo {
  date: string;
  level: number;
  isRestDay: boolean;
  hasActivity: boolean;
  isCurrentMonth: boolean;
}

export default function HistoryScreen() {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  const [dayInfos, setDayInfos] = useState<DayInfo[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedWorkouts, setSelectedWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  // 画面フォーカス時にデータを再読み込み
  useFocusEffect(
    useCallback(() => {
      loadMonthData();
    }, [currentMonth])
  );

  useEffect(() => {
    loadMonthData();
  }, [currentMonth]);

  async function loadMonthData() {
    try {
      setLoading(true);
      const dayStateRepo = new DayStateRepository();
      const workoutRepo = new WorkoutRepository();

      const dates = generateCalendarDates(currentMonth.year, currentMonth.month);
      
      const infos: DayInfo[] = await Promise.all(
        dates.map(async ({ date, isCurrentMonth }) => {
          const dayState = await dayStateRepo.getByDate(date);
          const workouts = await workoutRepo.getByDate(date);
          
          return {
            date,
            level: dayState?.level ?? 0,
            isRestDay: dayState?.isRestDay ?? false,
            hasActivity: workouts.length > 0,
            isCurrentMonth,
          };
        })
      );

      setDayInfos(infos);
    } catch (error) {
      console.error('Failed to load month data:', error);
      Alert.alert('エラー', 'データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }

  function generateCalendarDates(year: number, month: number): Array<{ date: string; isCurrentMonth: boolean }> {
    const firstDay = new Date(year, month - 1, 1);
    const startDayOfWeek = firstDay.getDay();
    
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDayOfWeek);
    
    const dates: Array<{ date: string; isCurrentMonth: boolean }> = [];
    for (let i = 0; i < 42; i++) {
      const current = new Date(startDate);
      current.setDate(current.getDate() + i);
      
      const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
      const isCurrentMonth = current.getMonth() + 1 === month && current.getFullYear() === year;
      
      dates.push({ date: dateStr, isCurrentMonth });
    }
    
    return dates;
  }

  function navigateMonth(offset: number) {
    const newMonth = currentMonth.month + offset;
    if (newMonth < 1) {
      setCurrentMonth({ year: currentMonth.year - 1, month: 12 });
    } else if (newMonth > 12) {
      setCurrentMonth({ year: currentMonth.year + 1, month: 1 });
    } else {
      setCurrentMonth({ ...currentMonth, month: newMonth });
    }
  }

  function goToToday() {
    const now = new Date();
    setCurrentMonth({ year: now.getFullYear(), month: now.getMonth() + 1 });
  }

  async function handleDayPress(date: string) {
    try {
      const workoutRepo = new WorkoutRepository();
      const workouts = await workoutRepo.getByDate(date);
      setSelectedDate(date);
      setSelectedWorkouts(workouts);
    } catch (error) {
      console.error('Failed to load workouts:', error);
      Alert.alert('エラー', 'ワークアウトの読み込みに失敗しました');
    }
  }

  function closeModal() {
    setSelectedDate(null);
    setSelectedWorkouts([]);
  }

  function getDayStatusColor(day: DayInfo): string {
    if (!day.isCurrentMonth) return 'transparent';
    if (day.isRestDay) return colors.info;
    if (day.hasActivity) return colors.success;
    return colors.warning;
  }

  function getWorkoutTypeLabel(workout: Workout): string {
    if (workout.type === 'strength') return '筋トレ';
    if (workout.type === 'cardio') return '有酸素';
    if (workout.type === 'light') return '軽め';
    return '';
  }

  function getWorkoutTypeColor(type: string): string {
    if (type === 'strength') return colors.danger;
    if (type === 'cardio') return colors.success;
    return colors.info;
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  const today = new Date();
  const todayStr = getTodayDate();
  const isCurrentMonth = currentMonth.year === today.getFullYear() && currentMonth.month === today.getMonth() + 1;

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigateMonth(-1)} activeOpacity={0.7}>
          <Text style={styles.navButtonText}>◀</Text>
        </TouchableOpacity>
        
        <View style={styles.monthContainer}>
          <Text style={styles.monthText}>
            {currentMonth.year}年{currentMonth.month}月
          </Text>
          {!isCurrentMonth && (
            <TouchableOpacity onPress={goToToday} style={styles.todayButton}>
              <Text style={styles.todayButtonText}>今月に戻る</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity style={styles.navButton} onPress={() => navigateMonth(1)} activeOpacity={0.7}>
          <Text style={styles.navButtonText}>▶</Text>
        </TouchableOpacity>
      </View>

      {/* カレンダー */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* 曜日ヘッダー */}
        <View style={styles.weekHeader}>
          {['日', '月', '火', '水', '木', '金', '土'].map((day, i) => (
            <View key={i} style={styles.weekHeaderCell}>
              <Text style={[
                styles.weekHeaderText,
                i === 0 && styles.sundayText,
                i === 6 && styles.saturdayText,
              ]}>
                {day}
              </Text>
            </View>
          ))}
        </View>

        {/* 日付グリッド */}
        <View style={styles.calendarGrid}>
          {dayInfos.map((day, index) => {
            const dateObj = new Date(day.date);
            const dayNum = dateObj.getDate();
            const isToday = day.date === todayStr;
            const isSunday = index % 7 === 0;
            const isSaturday = index % 7 === 6;

            return (
              <TouchableOpacity
                key={day.date}
                style={[
                  styles.dayCell,
                  isToday && styles.todayCell,
                  !day.isCurrentMonth && styles.otherMonthCell,
                ]}
                onPress={() => day.isCurrentMonth && handleDayPress(day.date)}
                disabled={!day.isCurrentMonth}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.dayNumber,
                  !day.isCurrentMonth && styles.otherMonthText,
                  isSunday && day.isCurrentMonth && styles.sundayText,
                  isSaturday && day.isCurrentMonth && styles.saturdayText,
                  isToday && styles.todayDayNumber,
                ]}>
                  {dayNum}
                </Text>
                {day.isCurrentMonth && (
                  <View style={styles.dayContent}>
                    <View style={[styles.statusDot, { backgroundColor: getDayStatusColor(day) }]} />
                    <Text style={[styles.levelText, { color: getLevelColor(day.level) }]}>
                      {day.level}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 凡例 */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
            <Text style={styles.legendText}>活動</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.info }]} />
            <Text style={styles.legendText}>休息</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
            <Text style={styles.legendText}>未活動</Text>
          </View>
        </View>
      </ScrollView>

      {/* ワークアウト詳細モーダル */}
      <Modal
        visible={selectedDate !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedDate && formatDateJP(selectedDate)}
              </Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {selectedWorkouts.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyIcon}>📝</Text>
                  <Text style={styles.emptyText}>記録がありません</Text>
                </View>
              ) : (
                selectedWorkouts.map((workout) => (
                  <View key={workout.id} style={styles.workoutCard}>
                    <View style={styles.workoutHeader}>
                      <View style={[styles.typeBadge, { backgroundColor: getWorkoutTypeColor(workout.type) }]}>
                        <Text style={styles.typeBadgeText}>{getWorkoutTypeLabel(workout)}</Text>
                      </View>
                      <Text style={styles.workoutTitle}>{workout.title}</Text>
                    </View>

                    {workout.type === 'strength' && workout.strength && (
                      <View style={styles.workoutDetails}>
                        {workout.strength.exercises.map((exercise, i) => (
                          <View key={i} style={styles.exerciseRow}>
                            <Text style={styles.exerciseName}>{exercise.name}</Text>
                            <Text style={styles.exerciseSets}>{exercise.sets.length}セット</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {workout.type === 'cardio' && workout.cardio && (
                      <View style={styles.workoutDetails}>
                        <Text style={styles.detailText}>
                          ⏱ {workout.cardio.minutes}分 • {workout.cardio.intensity}
                        </Text>
                      </View>
                    )}

                    {workout.type === 'light' && workout.light && (
                      <View style={styles.workoutDetails}>
                        <Text style={styles.detailText}>
                          {workout.light.label}
                          {workout.light.minutes && ` • ${workout.light.minutes}分`}
                        </Text>
                      </View>
                    )}

                    {workout.note && (
                      <Text style={styles.workoutNote}>💬 {workout.note}</Text>
                    )}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 100,
  },
  
  // ヘッダー
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.md,
    backgroundColor: colors.backgroundLight,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  monthContainer: {
    alignItems: 'center',
  },
  monthText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  todayButton: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
  todayButtonText: {
    fontSize: 11,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  
  // カレンダー
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.md,
  },
  weekHeaderCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  sundayText: {
    color: colors.danger,
  },
  saturdayText: {
    color: colors.info,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: colors.borderLight,
  },
  todayCell: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
    borderWidth: 2,
  },
  otherMonthCell: {
    backgroundColor: colors.backgroundLight,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  todayDayNumber: {
    color: colors.primary,
    fontWeight: '800',
  },
  otherMonthText: {
    color: colors.textMuted,
  },
  dayContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  levelText: {
    fontSize: 10,
    fontWeight: '700',
  },
  
  // 凡例
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  
  // モーダル
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.backgroundLight,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '80%',
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  modalScroll: {
    padding: spacing.lg,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textMuted,
  },
  workoutCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  workoutHeader: {
    marginBottom: spacing.sm,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.xs,
    marginBottom: spacing.xs,
  },
  typeBadgeText: {
    fontSize: 10,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  workoutTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  workoutDetails: {
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  exerciseName: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  exerciseSets: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  workoutNote: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
});
