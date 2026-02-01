import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useState, useEffect } from 'react';
import { WorkoutRepository } from '../src/core/storage/WorkoutRepository';
import type { Workout, WorkoutType } from '../src/core/domain/models';
import { getTodayDate, generateId, formatDateJP } from '../src/utils/date';

type FormMode = 'list' | 'create' | 'edit';

export default function LogScreen() {
  const [mode, setMode] = useState<FormMode>('list');
  const [selectedType, setSelectedType] = useState<WorkoutType>('strength');
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);

  // フォーム入力
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  
  // Cardio用
  const [cardioMinutes, setCardioMinutes] = useState('');
  const [cardioIntensity, setCardioIntensity] = useState<'easy' | 'medium' | 'hard'>('medium');
  
  // Light用
  const [lightLabel, setLightLabel] = useState('');
  const [lightMinutes, setLightMinutes] = useState('');

  const repo = new WorkoutRepository();
  const today = getTodayDate();

  useEffect(() => {
    loadWorkouts();
  }, []);

  async function loadWorkouts() {
    try {
      const data = await repo.getByDate(today);
      setWorkouts(data);
    } catch (error) {
      console.error('Failed to load workouts:', error);
    }
  }

  function startCreate(type: WorkoutType) {
    setSelectedType(type);
    setMode('create');
    resetForm();
  }

  function resetForm() {
    setTitle('');
    setNote('');
    setCardioMinutes('');
    setCardioIntensity('medium');
    setLightLabel('');
    setLightMinutes('');
  }

  async function saveWorkout() {
    try {
      const workout: Workout = {
        id: editingWorkout?.id ?? generateId(),
        date: today,
        type: selectedType,
        title: title || undefined,
        note: note || undefined,
        createdAt: editingWorkout?.createdAt ?? Date.now(),
      };

      if (selectedType === 'cardio') {
        const minutes = parseInt(cardioMinutes);
        if (isNaN(minutes) || minutes <= 0) {
          Alert.alert('エラー', '時間を入力してください');
          return;
        }
        workout.cardio = {
          minutes,
          intensity: cardioIntensity,
        };
      } else if (selectedType === 'light') {
        workout.light = {
          label: lightLabel || undefined,
          minutes: lightMinutes ? parseInt(lightMinutes) : undefined,
        };
      } else {
        // Strengthは後で実装
        workout.strength = { exercises: [] };
      }

      if (editingWorkout) {
        await repo.update(workout);
      } else {
        await repo.create(workout);
      }

      Alert.alert('成功', '記録を保存しました');
      setMode('list');
      setEditingWorkout(null);
      loadWorkouts();
    } catch (error) {
      Alert.alert('エラー', error instanceof Error ? error.message : '保存に失敗しました');
    }
  }

  async function deleteWorkout(id: string) {
    Alert.alert('確認', '本当に削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: async () => {
          try {
            await repo.delete(id);
            Alert.alert('完了', '削除しました');
            loadWorkouts();
          } catch (error) {
            Alert.alert('エラー', '削除に失敗しました');
          }
        },
      },
    ]);
  }

  function startEdit(workout: Workout) {
    setEditingWorkout(workout);
    setSelectedType(workout.type);
    setTitle(workout.title || '');
    setNote(workout.note || '');
    
    if (workout.type === 'cardio' && workout.cardio) {
      setCardioMinutes(String(workout.cardio.minutes));
      setCardioIntensity(workout.cardio.intensity || 'medium');
    } else if (workout.type === 'light' && workout.light) {
      setLightLabel(workout.light.label || '');
      setLightMinutes(workout.light.minutes ? String(workout.light.minutes) : '');
    }
    
    setMode('edit');
  }

  if (mode === 'list') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>記録</Text>
          <Text style={styles.date}>{formatDateJP(today)}</Text>
        </View>

        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[styles.typeButton, { backgroundColor: '#5B8FF9' }]}
            onPress={() => startCreate('strength')}
          >
            <Text style={styles.typeButtonText}>💪 筋トレ</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, { backgroundColor: '#61DDAA' }]}
            onPress={() => startCreate('cardio')}
          >
            <Text style={styles.typeButtonText}>🏃 有酸素</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, { backgroundColor: '#F6BD16' }]}
            onPress={() => startCreate('light')}
          >
            <Text style={styles.typeButtonText}>🧘 軽め</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.workoutList}>
          <Text style={styles.sectionTitle}>今日の記録 ({workouts.length}件)</Text>
          {workouts.length === 0 ? (
            <Text style={styles.emptyText}>まだ記録がありません</Text>
          ) : (
            workouts.map((workout) => (
              <TouchableOpacity
                key={workout.id}
                style={styles.workoutItem}
                onPress={() => startEdit(workout)}
              >
                <View style={styles.workoutHeader}>
                  <Text style={styles.workoutType}>
                    {workout.type === 'strength' && '💪 筋トレ'}
                    {workout.type === 'cardio' && '🏃 有酸素'}
                    {workout.type === 'light' && '🧘 軽め'}
                  </Text>
                  <TouchableOpacity onPress={() => deleteWorkout(workout.id)}>
                    <Text style={styles.deleteButton}>削除</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.workoutTitle}>
                  {workout.title || '(タイトルなし)'}
                </Text>
                {workout.cardio && (
                  <Text style={styles.workoutDetail}>
                    {workout.cardio.minutes}分 ({workout.cardio.intensity})
                  </Text>
                )}
                {workout.light && (
                  <Text style={styles.workoutDetail}>
                    {workout.light.label}
                    {workout.light.minutes && ` - ${workout.light.minutes}分`}
                  </Text>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    );
  }

  // 作成・編集フォーム
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { setMode('list'); setEditingWorkout(null); }}>
          <Text style={styles.backButton}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {editingWorkout ? '編集' : '新規作成'} - {' '}
          {selectedType === 'strength' && '💪 筋トレ'}
          {selectedType === 'cardio' && '🏃 有酸素'}
          {selectedType === 'light' && '🧘 軽め'}
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>タイトル（任意）</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="例: 朝のランニング"
        />

        {selectedType === 'cardio' && (
          <>
            <Text style={styles.label}>時間（分） *</Text>
            <TextInput
              style={styles.input}
              value={cardioMinutes}
              onChangeText={setCardioMinutes}
              keyboardType="numeric"
              placeholder="30"
            />

            <Text style={styles.label}>強度</Text>
            <View style={styles.intensitySelector}>
              {(['easy', 'medium', 'hard'] as const).map((intensity) => (
                <TouchableOpacity
                  key={intensity}
                  style={[
                    styles.intensityButton,
                    cardioIntensity === intensity && styles.intensityButtonActive,
                  ]}
                  onPress={() => setCardioIntensity(intensity)}
                >
                  <Text style={styles.intensityButtonText}>
                    {intensity === 'easy' && '低'}
                    {intensity === 'medium' && '中'}
                    {intensity === 'hard' && '高'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {selectedType === 'light' && (
          <>
            <Text style={styles.label}>ラベル（任意）</Text>
            <TextInput
              style={styles.input}
              value={lightLabel}
              onChangeText={setLightLabel}
              placeholder="例: 散歩、ストレッチ"
            />

            <Text style={styles.label}>時間（分・任意）</Text>
            <TextInput
              style={styles.input}
              value={lightMinutes}
              onChangeText={setLightMinutes}
              keyboardType="numeric"
              placeholder="15"
            />
          </>
        )}

        {selectedType === 'strength' && (
          <Text style={styles.comingSoon}>
            ※ 筋トレの詳細入力は次のステップで実装予定{'\n'}
            現在は簡易保存のみ
          </Text>
        )}

        <Text style={styles.label}>メモ（任意）</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={note}
          onChangeText={setNote}
          placeholder="メモを入力..."
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity style={styles.saveButton} onPress={saveWorkout}>
          <Text style={styles.saveButtonText}>保存</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 8,
  },
  typeSelector: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  typeButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  typeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  workoutList: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    paddingVertical: 32,
  },
  workoutItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  workoutType: {
    fontSize: 14,
    color: '#666',
  },
  deleteButton: {
    color: '#ff3b30',
    fontSize: 14,
  },
  workoutTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  workoutDetail: {
    fontSize: 14,
    color: '#666',
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  intensitySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  intensityButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  intensityButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#e3f2ff',
  },
  intensityButtonText: {
    fontSize: 16,
  },
  comingSoon: {
    padding: 16,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    color: '#856404',
    fontSize: 14,
    marginTop: 16,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
