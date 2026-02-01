import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useState, useEffect } from 'react';
import { WorkoutRepository } from '../src/core/storage/WorkoutRepository';
import type { Workout, WorkoutType } from '../src/core/domain/models';
import { getTodayDate, generateId, formatDateJP } from '../src/utils/date';

type FormMode = 'list' | 'create' | 'edit';

// 主要な筋トレ種目リスト
const EXERCISE_PRESETS = [
  { category: '胸', exercises: ['ベンチプレス', 'ダンベルプレス', '腕立て伏せ', 'ディップス'] },
  { category: '背中', exercises: ['デッドリフト', 'ラットプルダウン', '懸垂', 'ベントオーバーロウ'] },
  { category: '脚', exercises: ['スクワット', 'レッグプレス', 'レッグカール', 'レッグエクステンション'] },
  { category: '肩', exercises: ['ショルダープレス', 'サイドレイズ', 'フロントレイズ', 'リアレイズ'] },
  { category: '腕', exercises: ['バーベルカール', 'ハンマーカール', 'トライセップスエクステンション', 'ディップス'] },
  { category: 'その他', exercises: ['腹筋', 'プランク', 'カスタム入力'] },
];

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

  // Strength用
  const [exercises, setExercises] = useState<Array<{
    name: string;
    sets: Array<{
      reps?: number;
      weightKg?: number;
      rpe?: number;
      note?: string;
    }>;
  }>>([]);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(null);
  const [customExerciseName, setCustomExerciseName] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

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
    setExercises([]);
  }

  async function saveWorkout() {
    try {
      // タイトルが空の場合は日付を自動設定
      const finalTitle = title.trim() || formatDateJP(today);
      
      const workout: Workout = {
        id: editingWorkout?.id ?? generateId(),
        date: today,
        type: selectedType,
        title: finalTitle,
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
      } else if (selectedType === 'strength') {
        if (exercises.length === 0) {
          Alert.alert('エラー', '少なくとも1つの種目を追加してください');
          return;
        }
        workout.strength = { exercises };
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
    } else if (workout.type === 'strength' && workout.strength) {
      setExercises(workout.strength.exercises);
    }
    
    setMode('edit');
  }

  function openExerciseModal(index: number | null = null) {
    setEditingExerciseIndex(index);
    setCustomExerciseName('');
    setIsCustomMode(false);
    setShowExerciseModal(true);
  }

  function selectExercise(name: string) {
    if (name === 'カスタム入力') {
      // カスタム入力の場合はモーダルを閉じずに入力欄を表示
      setIsCustomMode(true);
      setCustomExerciseName('');
      return;
    }
    
    if (editingExerciseIndex !== null) {
      // 既存の種目を編集
      updateExerciseName(editingExerciseIndex, name);
    } else {
      // 新規種目を追加
      setExercises([...exercises, { name, sets: [{ reps: 10, weightKg: 0 }] }]);
    }
    setShowExerciseModal(false);
  }

  function addCustomExercise() {
    if (!customExerciseName.trim()) {
      Alert.alert('エラー', '種目名を入力してください');
      return;
    }
    
    if (editingExerciseIndex !== null) {
      updateExerciseName(editingExerciseIndex, customExerciseName.trim());
    } else {
      setExercises([...exercises, { name: customExerciseName.trim(), sets: [{ reps: 10, weightKg: 0 }] }]);
    }
    setShowExerciseModal(false);
  }

  function removeExercise(index: number) {
    setExercises(exercises.filter((_, i) => i !== index));
  }

  function updateExerciseName(index: number, name: string) {
    const newExercises = [...exercises];
    newExercises[index].name = name;
    setExercises(newExercises);
  }

  function addSet(exerciseIndex: number) {
    const newExercises = [...exercises];
    newExercises[exerciseIndex].sets.push({});
    setExercises(newExercises);
  }

  function removeSet(exerciseIndex: number, setIndex: number) {
    const newExercises = [...exercises];
    newExercises[exerciseIndex].sets = newExercises[exerciseIndex].sets.filter((_, i) => i !== setIndex);
    setExercises(newExercises);
  }

  function updateSet(
    exerciseIndex: number,
    setIndex: number,
    field: 'reps' | 'weightKg' | 'rpe' | 'note',
    value: string
  ) {
    const newExercises = [...exercises];
    const set = newExercises[exerciseIndex].sets[setIndex];
    
    if (field === 'note') {
      set[field] = value || undefined;
    } else {
      const num = parseFloat(value);
      set[field] = isNaN(num) ? undefined : num;
    }
    
    setExercises(newExercises);
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
                {workout.strength && workout.strength.exercises.length > 0 && (
                  <Text style={styles.workoutDetail}>
                    {workout.strength.exercises.length}種目 -{' '}
                    {workout.strength.exercises.map(e => e.name).join(', ')}
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
    <>
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
          <>
            <Text style={styles.label}>種目</Text>
            {exercises.map((exercise, exerciseIndex) => (
              <View key={exerciseIndex} style={styles.exerciseContainer}>
                <View style={styles.exerciseHeader}>
                  <Text style={styles.exerciseName}>
                    {exercise.name || `種目${exerciseIndex + 1}`}
                  </Text>
                  <TouchableOpacity onPress={() => openExerciseModal(exerciseIndex)}>
                    <Text style={styles.editButton}>変更</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeExercise(exerciseIndex)}>
                    <Text style={styles.removeButton}>削除</Text>
                  </TouchableOpacity>
                </View>

                {exercise.sets.map((set, setIndex) => (
                  <View key={setIndex} style={styles.setContainer}>
                    <Text style={styles.setLabel}>{setIndex + 1}セット目</Text>
                    <View style={styles.setInputs}>
                      <TextInput
                        style={[styles.input, styles.setInput]}
                        value={set.reps ? String(set.reps) : ''}
                        onChangeText={(text) => updateSet(exerciseIndex, setIndex, 'reps', text)}
                        placeholder="回数"
                        keyboardType="numeric"
                      />
                      <TextInput
                        style={[styles.input, styles.setInput]}
                        value={set.weightKg ? String(set.weightKg) : ''}
                        onChangeText={(text) => updateSet(exerciseIndex, setIndex, 'weightKg', text)}
                        placeholder="重量kg"
                        keyboardType="decimal-pad"
                      />
                      <TextInput
                        style={[styles.input, styles.setInput]}
                        value={set.rpe ? String(set.rpe) : ''}
                        onChangeText={(text) => updateSet(exerciseIndex, setIndex, 'rpe', text)}
                        placeholder="RPE"
                        keyboardType="numeric"
                      />
                      <TouchableOpacity onPress={() => removeSet(exerciseIndex, setIndex)}>
                        <Text style={styles.removeSetButton}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                <TouchableOpacity
                  style={styles.addSetButton}
                  onPress={() => addSet(exerciseIndex)}
                >
                  <Text style={styles.addSetButtonText}>+ セット追加</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity style={styles.addExerciseButton} onPress={() => openExerciseModal(null)}>
              <Text style={styles.addExerciseButtonText}>+ 種目追加</Text>
            </TouchableOpacity>
          </>
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

    {/* 種目選択モーダル */}
    <Modal
      visible={showExerciseModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowExerciseModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>種目を選択</Text>
            <TouchableOpacity onPress={() => setShowExerciseModal(false)}>
              <Text style={styles.modalCloseButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll}>
            {EXERCISE_PRESETS.map((category) => (
              <View key={category.category} style={styles.categoryContainer}>
                <Text style={styles.categoryTitle}>{category.category}</Text>
                {category.exercises.map((exercise) => (
                  <TouchableOpacity
                    key={exercise}
                    style={styles.exerciseOption}
                    onPress={() => selectExercise(exercise)}
                  >
                    <Text style={styles.exerciseOptionText}>{exercise}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}

            {isCustomMode && (
              <View style={styles.customInputContainer}>
                <Text style={styles.categoryTitle}>カスタム種目</Text>
                <TextInput
                  style={styles.input}
                  value={customExerciseName}
                  onChangeText={setCustomExerciseName}
                  placeholder="種目名を入力..."
                  autoFocus
                />
                <TouchableOpacity style={styles.customAddButton} onPress={addCustomExercise}>
                  <Text style={styles.customAddButtonText}>追加</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
    </>
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
  exerciseContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  exerciseNameInput: {
    flex: 1,
  },
  removeButton: {
    color: '#ff3b30',
    fontSize: 14,
    fontWeight: '600',
    padding: 8,
  },
  setContainer: {
    marginBottom: 8,
  },
  setLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  setInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  setInput: {
    flex: 1,
    padding: 8,
    fontSize: 14,
  },
  removeSetButton: {
    color: '#ff3b30',
    fontSize: 18,
    fontWeight: 'bold',
    padding: 8,
  },
  addSetButton: {
    padding: 8,
    alignItems: 'center',
  },
  addSetButtonText: {
    color: '#007AFF',
    fontSize: 14,
  },
  addExerciseButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addExerciseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  exerciseName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  editButton: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
    padding: 8,
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalCloseButton: {
    fontSize: 24,
    color: '#666',
    padding: 4,
  },
  modalScroll: {
    padding: 16,
  },
  categoryContainer: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  exerciseOption: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  exerciseOptionText: {
    fontSize: 15,
    color: '#333',
  },
  customInputContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  customAddButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  customAddButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
