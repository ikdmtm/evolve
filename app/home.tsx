import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { WorkoutRepository } from '../src/core/storage/WorkoutRepository';
import { DayStateRepository } from '../src/core/storage/DayStateRepository';
import { getTodayDate, formatDateJP } from '../src/utils/date';

export default function HomeScreen() {
  const [currentDate, setCurrentDate] = useState(getTodayDate());
  const [stage, setStage] = useState<number>(0);
  const [isRestDay, setIsRestDay] = useState(false);
  const [hasActivity, setHasActivity] = useState(false);
  const [loading, setLoading] = useState(true);

  const today = getTodayDate();

  useEffect(() => {
    loadDayData();
  }, [currentDate]);

  async function loadDayData() {
    try {
      setLoading(true);
      
      const dayStateRepo = new DayStateRepository();
      const workoutRepo = new WorkoutRepository();

      // ステージと休息日情報を取得
      const dayState = await dayStateRepo.getByDate(currentDate);
      setStage(dayState?.stage ?? 0);
      setIsRestDay(dayState?.isRestDay ?? false);

      // その日の活動記録を確認
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
    if (isRestDay) {
      return '休息日';
    }
    if (hasActivity) {
      return '活動済み';
    }
    return '未活動';
  }

  function getStatusColor() {
    if (isRestDay) {
      return '#34C759'; // 緑: 休息日
    }
    if (hasActivity) {
      return '#007AFF'; // 青: 活動済み
    }
    return '#FF9500'; // オレンジ: 未活動
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 日付ナビゲーション */}
      <View style={styles.dateNav}>
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => navigateDate(-1)}
        >
          <Text style={styles.navButtonText}>← 前日</Text>
        </TouchableOpacity>
        
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>{formatDateJP(currentDate)}</Text>
          {currentDate !== today && (
            <TouchableOpacity onPress={goToToday} style={styles.todayButton}>
              <Text style={styles.todayButtonText}>今日</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity 
          style={[styles.navButton, currentDate >= today && styles.navButtonDisabled]} 
          onPress={() => navigateDate(1)}
          disabled={currentDate >= today}
        >
          <Text style={[styles.navButtonText, currentDate >= today && styles.navButtonTextDisabled]}>
            翌日 →
          </Text>
        </TouchableOpacity>
      </View>

      {/* キャラクター表示エリア */}
      <View style={styles.characterContainer}>
        <View style={[styles.characterPlaceholder, { borderColor: getStatusColor() }]}>
          <Text style={styles.characterText}>キャラクター</Text>
          <Text style={styles.characterSubtext}>Stage {stage}</Text>
        </View>
      </View>

      {/* ステージ表示 */}
      <View style={styles.stageContainer}>
        <Text style={styles.stageLabel}>現在のステージ</Text>
        <View style={styles.stageBar}>
          {[...Array(10)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.stageSegment,
                i <= stage && styles.stageSegmentActive,
              ]}
            />
          ))}
        </View>
        <View style={styles.stageRange}>
          <Text style={styles.stageRangeText}>0</Text>
          <Text style={styles.stageRangeText}>9</Text>
        </View>
      </View>

      {/* 状態表示 */}
      <View style={[styles.statusContainer, { borderLeftColor: getStatusColor() }]}>
        <Text style={styles.statusLabel}>今日の状態</Text>
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
      </View>

      {/* 説明 */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>ステージについて</Text>
        <Text style={styles.infoText}>
          • 活動を記録するとステージが上がります{'\n'}
          • 何もしないとステージが下がります{'\n'}
          • 休息日は下がりません{'\n'}
          • ステージは0〜9の10段階です
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 100,
  },
  dateNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  navButton: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: 80,
  },
  navButtonDisabled: {
    backgroundColor: '#f0f0f0',
    borderColor: '#e0e0e0',
  },
  navButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  navButtonTextDisabled: {
    color: '#999',
  },
  dateContainer: {
    alignItems: 'center',
  },
  dateText: {
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
  characterContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  characterPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 4,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  characterText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  characterSubtext: {
    fontSize: 16,
    color: '#666',
  },
  stageContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  stageLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontWeight: '600',
  },
  stageBar: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  stageSegment: {
    flex: 1,
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
  },
  stageSegmentActive: {
    backgroundColor: '#007AFF',
  },
  stageRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stageRangeText: {
    fontSize: 12,
    color: '#999',
  },
  statusContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '600',
  },
  statusText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  infoContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
});
