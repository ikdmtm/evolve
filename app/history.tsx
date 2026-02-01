import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { useState, useEffect } from 'react';
import { WorkoutRepository } from '../src/core/storage/WorkoutRepository';
import { DayStateRepository } from '../src/core/storage/DayStateRepository';
import { formatDateJP } from '../src/utils/date';
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

  useEffect(() => {
    loadMonthData();
  }, [currentMonth]);

  async function loadMonthData() {
    try {
      setLoading(true);
      const dayStateRepo = new DayStateRepository();
      const workoutRepo = new WorkoutRepository();

      // カレンダーの日付リストを生成
      const dates = generateCalendarDates(currentMonth.year, currentMonth.month);
      
      // 各日の情報を取得
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
    const lastDay = new Date(year, month, 0);
    
    // 月の最初の日が何曜日か（0=日曜日）
    const startDayOfWeek = firstDay.getDay();
    
    // カレンダーの開始日（前月の日付を含む）
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDayOfWeek);
    
    // カレンダーの日付を生成（6週間分=42日）
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
    if (!day.isCurrentMonth) {
      return '#f0f0f0'; // 他月の日付は薄いグレー
    }
    if (day.isRestDay) {
      return '#34C759'; // 緑: 休息日
    }
    if (day.hasActivity) {
      return '#007AFF'; // 青: 活動済み
    }
    return '#FF9500'; // オレンジ: 未活動
  }

  function getDayStatusSymbol(day: DayInfo): string {
    if (!day.isCurrentMonth) return '';
    if (day.isRestDay) return '🛌';
    if (day.hasActivity) return '💪';
    return '—';
  }

  function getWorkoutTypeLabel(workout: Workout): string {
    if (workout.type === 'strength') return '筋トレ';
    if (workout.type === 'cardio') return '有酸素';
    if (workout.type === 'light') return '軽めの運動';
    return '';
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  const today = new Date();
  const isCurrentMonth = currentMonth.year === today.getFullYear() && currentMonth.month === today.getMonth() + 1;

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigateMonth(-1)}>
          <Text style={styles.navButtonText}>← 前月</Text>
        </TouchableOpacity>
        
        <View style={styles.monthContainer}>
          <Text style={styles.monthText}>
            {currentMonth.year}年{currentMonth.month}月
          </Text>
          {!isCurrentMonth && (
            <TouchableOpacity onPress={goToToday} style={styles.todayButton}>
              <Text style={styles.todayButtonText}>今月</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity style={styles.navButton} onPress={() => navigateMonth(1)}>
          <Text style={styles.navButtonText}>翌月 →</Text>
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
            const isToday = day.date === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            const isSunday = index % 7 === 0;
            const isSaturday = index % 7 === 6;

            return (
              <TouchableOpacity
                key={day.date}
                style={[
                  styles.dayCell,
                  isToday && styles.todayCell,
                ]}
                onPress={() => handleDayPress(day.date)}
                disabled={!day.isCurrentMonth}
              >
                <Text style={[
                  styles.dayNumber,
                  !day.isCurrentMonth && styles.otherMonthText,
                  isSunday && day.isCurrentMonth && styles.sundayText,
                  isSaturday && day.isCurrentMonth && styles.saturdayText,
                  isToday && styles.todayText,
                ]}>
                  {dayNum}
                </Text>
                {day.isCurrentMonth && (
                  <>
                    <View style={[
                      styles.statusDot,
                      { backgroundColor: getDayStatusColor(day) }
                    ]} />
                    <Text style={styles.statusSymbol}>
                      {getDayStatusSymbol(day)}
                    </Text>
                    <Text style={styles.levelText}>Lv{day.level}</Text>
                  </>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 凡例 */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#007AFF' }]} />
            <Text style={styles.legendText}>活動済み</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#34C759' }]} />
            <Text style={styles.legendText}>休息日</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FF9500' }]} />
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
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedDate && formatDateJP(selectedDate)}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {selectedWorkouts.length === 0 ? (
                <Text style={styles.emptyText}>記録がありません</Text>
              ) : (
                selectedWorkouts.map((workout) => (
                  <View key={workout.id} style={styles.workoutCard}>
                    <View style={styles.workoutHeader}>
                      <Text style={styles.workoutType}>{getWorkoutTypeLabel(workout)}</Text>
                      <Text style={styles.workoutTitle}>{workout.title}</Text>
                    </View>

                    {workout.type === 'strength' && workout.strength && (
                      <View style={styles.workoutDetails}>
                        {workout.strength.exercises.map((exercise, i) => (
                          <View key={i} style={styles.exerciseRow}>
                            <Text style={styles.exerciseName}>{exercise.name}</Text>
                            <Text style={styles.exerciseSets}>
                              {exercise.sets.length}セット
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {workout.type === 'cardio' && workout.cardio && (
                      <View style={styles.workoutDetails}>
                        <Text style={styles.detailText}>
                          {workout.cardio.minutes}分 • {workout.cardio.intensity}
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
                      <Text style={styles.workoutNote}>{workout.note}</Text>
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
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  navButton: {
    padding: 8,
    minWidth: 70,
  },
  navButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  monthContainer: {
    alignItems: 'center',
  },
  monthText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  todayButton: {
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#007AFF',
    borderRadius: 12,
  },
  todayButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekHeaderCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  sundayText: {
    color: '#FF3B30',
  },
  saturdayText: {
    color: '#007AFF',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
  },
  todayCell: {
    backgroundColor: '#FFF9E6',
    borderColor: '#FFD700',
    borderWidth: 2,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  todayText: {
    color: '#FF9500',
    fontWeight: 'bold',
  },
  otherMonthText: {
    color: '#ccc',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
  statusSymbol: {
    fontSize: 14,
    marginTop: 2,
  },
  levelText: {
    fontSize: 9,
    color: '#666',
    marginTop: 2,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    fontSize: 24,
    color: '#666',
    padding: 4,
  },
  modalScroll: {
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 40,
  },
  workoutCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  workoutHeader: {
    marginBottom: 12,
  },
  workoutType: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  workoutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  workoutDetails: {
    marginTop: 8,
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  exerciseName: {
    fontSize: 14,
    color: '#333',
  },
  exerciseSets: {
    fontSize: 14,
    color: '#666',
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  workoutNote: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
