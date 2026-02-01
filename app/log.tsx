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

type FormMode = 'list' | 'detail' | 'create' | 'edit';

// 筋トレ種目リスト（フリーウエイト・マシン網羅）
const EXERCISE_PRESETS = [
  {
    category: '胸（フリーウエイト）',
    exercises: [
      'バーベルベンチプレス',
      'ダンベルベンチプレス',
      'インクラインベンチプレス',
      'デクラインベンチプレス',
      'ダンベルフライ',
      'インクラインダンベルフライ',
      'ダンベルプルオーバー',
      '腕立て伏せ',
      'ディップス',
    ],
  },
  {
    category: '胸（マシン）',
    exercises: [
      'チェストプレスマシン',
      'ペックフライマシン',
      'ケーブルクロスオーバー',
      'ケーブルフライ',
    ],
  },
  {
    category: '背中（フリーウエイト）',
    exercises: [
      'デッドリフト',
      'バーベルロウ',
      'ベントオーバーロウ',
      'ワンハンドダンベルロウ',
      '懸垂',
      'チンニング',
      'ダンベルシュラッグ',
      'バーベルシュラッグ',
    ],
  },
  {
    category: '背中（マシン）',
    exercises: [
      'ラットプルダウン',
      'シーテッドロウ',
      'Tバーロウ',
      'ケーブルロウ',
      'ハイパーエクステンション',
    ],
  },
  {
    category: '脚（フリーウエイト）',
    exercises: [
      'バーベルスクワット',
      'フロントスクワット',
      'ブルガリアンスクワット',
      'ダンベルランジ',
      'ダンベルスクワット',
      'ルーマニアンデッドリフト',
      'ダンベルカーフレイズ',
      'バーベルカーフレイズ',
    ],
  },
  {
    category: '脚（マシン）',
    exercises: [
      'レッグプレス',
      'レッグエクステンション',
      'レッグカール',
      'ハックスクワット',
      'アダクション',
      'アブダクション',
      'カーフレイズマシン',
    ],
  },
  {
    category: '肩（フリーウエイト）',
    exercises: [
      'ショルダープレス',
      'ダンベルショルダープレス',
      'バーベルショルダープレス',
      'サイドレイズ',
      'フロントレイズ',
      'リアレイズ',
      'ダンベルアップライトロウ',
      'バーベルアップライトロウ',
      'フェイスプル',
    ],
  },
  {
    category: '肩（マシン）',
    exercises: [
      'ショルダープレスマシン',
      'ケーブルサイドレイズ',
      'ケーブルフロントレイズ',
      'ケーブルリアレイズ',
    ],
  },
  {
    category: '腕（上腕二頭筋）',
    exercises: [
      'バーベルカール',
      'ダンベルカール',
      'ハンマーカール',
      'インクラインダンベルカール',
      'コンセントレーションカール',
      'プリーチャーカール',
      'ケーブルカール',
      'EZバーカール',
    ],
  },
  {
    category: '腕（上腕三頭筋）',
    exercises: [
      'トライセップスエクステンション',
      'ダンベルキックバック',
      'オーバーヘッドエクステンション',
      'クローズグリップベンチプレス',
      'ケーブルプッシュダウン',
      'ディップス（三頭重視）',
    ],
  },
  {
    category: '腹筋・体幹',
    exercises: [
      'クランチ',
      'シットアップ',
      'レッグレイズ',
      'ハンギングレッグレイズ',
      'プランク',
      'サイドプランク',
      'アブローラー',
      'ケーブルクランチ',
      'ロシアンツイスト',
    ],
  },
  {
    category: 'その他',
    exercises: ['カスタム入力'],
  },
];

// 有酸素運動の種目リスト
const CARDIO_PRESETS = [
  {
    category: '屋内',
    exercises: [
      'ランニングマシン',
      'エアロバイク',
      'エリプティカル',
      'ローイングマシン',
      'ステッパー',
      'エアロビクス',
      '縄跳び',
    ],
  },
  {
    category: '屋外',
    exercises: [
      'ランニング',
      'ジョギング',
      'ウォーキング',
      'サイクリング',
      '水泳',
      'ハイキング',
    ],
  },
  {
    category: 'スポーツ',
    exercises: [
      'サッカー',
      'バスケットボール',
      'テニス',
      'バドミントン',
      'ダンス',
    ],
  },
  {
    category: 'その他',
    exercises: ['カスタム入力'],
  },
];

// 軽めの活動リスト
const LIGHT_PRESETS = [
  {
    category: '日常活動',
    exercises: [
      '散歩',
      '階段',
      '家事',
      '掃除',
      '買い物',
      '庭仕事',
    ],
  },
  {
    category: 'ストレッチ・リラクゼーション',
    exercises: [
      'ストレッチ',
      'ヨガ',
      'ピラティス',
      '体操',
      '太極拳',
    ],
  },
  {
    category: 'その他',
    exercises: ['カスタム入力'],
  },
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
  const [cardioActivity, setCardioActivity] = useState('');
  const [cardioMinutes, setCardioMinutes] = useState('');
  const [cardioIntensity, setCardioIntensity] = useState<'easy' | 'medium' | 'hard'>('medium');
  
  // Light用
  const [lightActivity, setLightActivity] = useState('');
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
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');
  
  // 活動選択モーダル（Cardio/Light用）
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [activitySearchQuery, setActivitySearchQuery] = useState('');
  const [customActivityName, setCustomActivityName] = useState('');
  const [isActivityCustomMode, setIsActivityCustomMode] = useState(false);

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

  function viewDetail(workout: Workout) {
    setEditingWorkout(workout);
    setMode('detail');
  }

  function resetForm() {
    setTitle('');
    setNote('');
    setCardioActivity('');
    setCardioMinutes('');
    setCardioIntensity('medium');
    setLightActivity('');
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
        if (!cardioActivity.trim()) {
          Alert.alert('エラー', '活動を選択してください');
          return;
        }
        const minutes = parseInt(cardioMinutes);
        if (isNaN(minutes) || minutes <= 0) {
          Alert.alert('エラー', '時間を入力してください');
          return;
        }
        workout.cardio = {
          minutes,
          intensity: cardioIntensity,
        };
        workout.title = finalTitle || cardioActivity;
      } else if (selectedType === 'light') {
        if (!lightActivity.trim()) {
          Alert.alert('エラー', '活動を選択してください');
          return;
        }
        workout.light = {
          label: lightActivity,
          minutes: lightMinutes ? parseInt(lightMinutes) : undefined,
        };
        workout.title = finalTitle || lightActivity;
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
      setCardioActivity(workout.title || '');
      setCardioMinutes(String(workout.cardio.minutes));
      setCardioIntensity(workout.cardio.intensity || 'medium');
    } else if (workout.type === 'light' && workout.light) {
      setLightActivity(workout.light.label || '');
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
    setExerciseSearchQuery('');
    setShowExerciseModal(true);
  }

  // 検索クエリで種目をフィルタリング
  function getFilteredExercises() {
    if (!exerciseSearchQuery.trim()) {
      return EXERCISE_PRESETS;
    }

    const query = exerciseSearchQuery.toLowerCase();
    return EXERCISE_PRESETS.map(category => ({
      category: category.category,
      exercises: category.exercises.filter(exercise =>
        exercise.toLowerCase().includes(query)
      ),
    })).filter(category => category.exercises.length > 0);
  }

  // 活動選択モーダル（Cardio/Light用）
  function openActivityModal() {
    setActivitySearchQuery('');
    setCustomActivityName('');
    setIsActivityCustomMode(false);
    setShowActivityModal(true);
  }

  function selectActivity(name: string) {
    if (name === 'カスタム入力') {
      setIsActivityCustomMode(true);
      setCustomActivityName('');
      return;
    }

    if (selectedType === 'cardio') {
      setCardioActivity(name);
    } else if (selectedType === 'light') {
      setLightActivity(name);
    }
    setShowActivityModal(false);
  }

  function addCustomActivity() {
    if (!customActivityName.trim()) {
      Alert.alert('エラー', '活動名を入力してください');
      return;
    }

    if (selectedType === 'cardio') {
      setCardioActivity(customActivityName.trim());
    } else if (selectedType === 'light') {
      setLightActivity(customActivityName.trim());
    }
    setShowActivityModal(false);
  }

  function getFilteredActivities() {
    const presets = selectedType === 'cardio' ? CARDIO_PRESETS : LIGHT_PRESETS;
    
    if (!activitySearchQuery.trim()) {
      return presets;
    }

    const query = activitySearchQuery.toLowerCase();
    return presets.map(category => ({
      category: category.category,
      exercises: category.exercises.filter(exercise =>
        exercise.toLowerCase().includes(query)
      ),
    })).filter(category => category.exercises.length > 0);
  }

  // 時間調整（Cardio/Light用）
  function adjustMinutes(delta: number) {
    if (selectedType === 'cardio') {
      const current = parseInt(cardioMinutes) || 0;
      const newValue = Math.max(0, current + delta);
      setCardioMinutes(String(newValue));
    } else if (selectedType === 'light') {
      const current = parseInt(lightMinutes) || 0;
      const newValue = Math.max(0, current + delta);
      setLightMinutes(String(newValue));
    }
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

  function adjustSetValue(
    exerciseIndex: number,
    setIndex: number,
    field: 'reps' | 'weightKg' | 'rpe',
    delta: number
  ) {
    const newExercises = [...exercises];
    const set = newExercises[exerciseIndex].sets[setIndex];
    const current = set[field] || 0;
    const newValue = Math.max(0, current + delta);
    
    // 重量は小数点1桁まで
    if (field === 'weightKg') {
      set[field] = Math.round(newValue * 10) / 10;
    } else {
      set[field] = Math.round(newValue);
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
                onPress={() => viewDetail(workout)}
              >
                <View style={styles.workoutHeader}>
                  <Text style={styles.workoutType}>
                    {workout.type === 'strength' && '💪 筋トレ'}
                    {workout.type === 'cardio' && '🏃 有酸素'}
                    {workout.type === 'light' && '🧘 軽め'}
                  </Text>
                  <TouchableOpacity 
                    onPress={(e) => {
                      e.stopPropagation();
                      deleteWorkout(workout.id);
                    }}
                  >
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

  // 詳細表示画面
  if (mode === 'detail' && editingWorkout) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { setMode('list'); setEditingWorkout(null); }}>
            <Text style={styles.backButton}>← 戻る</Text>
          </TouchableOpacity>
          <Text style={styles.title}>記録詳細</Text>
        </View>

        <View style={styles.detailContainer}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailType}>
              {editingWorkout.type === 'strength' && '💪 筋トレ'}
              {editingWorkout.type === 'cardio' && '🏃 有酸素'}
              {editingWorkout.type === 'light' && '🧘 軽め'}
            </Text>
            <View style={styles.detailActions}>
              <TouchableOpacity
                style={styles.editButton2}
                onPress={() => {
                  startEdit(editingWorkout);
                }}
              >
                <Text style={styles.editButtonText}>編集</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton2}
                onPress={() => deleteWorkout(editingWorkout.id)}
              >
                <Text style={styles.deleteButtonText}>削除</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.detailTitle}>{editingWorkout.title}</Text>
          <Text style={styles.detailDate}>{formatDateJP(editingWorkout.date)}</Text>

          {editingWorkout.cardio && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>有酸素運動</Text>
              <Text style={styles.detailText}>時間: {editingWorkout.cardio.minutes}分</Text>
              <Text style={styles.detailText}>
                強度: {editingWorkout.cardio.intensity === 'easy' ? '低' : editingWorkout.cardio.intensity === 'medium' ? '中' : '高'}
              </Text>
            </View>
          )}

          {editingWorkout.light && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>軽めの活動</Text>
              <Text style={styles.detailText}>種類: {editingWorkout.light.label}</Text>
              {editingWorkout.light.minutes && (
                <Text style={styles.detailText}>時間: {editingWorkout.light.minutes}分</Text>
              )}
            </View>
          )}

          {editingWorkout.strength && editingWorkout.strength.exercises.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>筋トレ種目</Text>
              {editingWorkout.strength.exercises.map((exercise, index) => (
                <View key={index} style={styles.detailExercise}>
                  <Text style={styles.detailExerciseName}>{exercise.name}</Text>
                  {exercise.sets.map((set, setIndex) => (
                    <View key={setIndex} style={styles.detailSet}>
                      <Text style={styles.detailSetLabel}>{setIndex + 1}セット目</Text>
                      <View style={styles.detailSetInfo}>
                        {set.reps !== undefined && (
                          <Text style={styles.detailSetText}>回数: {set.reps}回</Text>
                        )}
                        {set.weightKg !== undefined && (
                          <Text style={styles.detailSetText}>重量: {set.weightKg}kg</Text>
                        )}
                        {set.rpe !== undefined && (
                          <Text style={styles.detailSetText}>RPE: {set.rpe}</Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}

          {editingWorkout.note && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>メモ</Text>
              <Text style={styles.detailText}>{editingWorkout.note}</Text>
            </View>
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
            <Text style={styles.label}>活動 *</Text>
            <View style={styles.activitySelectContainer}>
              <Text style={styles.activitySelectText}>
                {cardioActivity || '活動を選択...'}
              </Text>
              <TouchableOpacity
                style={styles.activitySelectButton}
                onPress={openActivityModal}
              >
                <Text style={styles.activitySelectButtonText}>
                  {cardioActivity ? '変更' : '選択'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>時間（分） *</Text>
            <View style={styles.numberInputContainer}>
              <TouchableOpacity
                style={styles.minusButton}
                onPress={() => adjustMinutes(-1)}
              >
                <Text style={styles.buttonText}>−</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.numberInput}
                value={cardioMinutes}
                onChangeText={setCardioMinutes}
                keyboardType="numeric"
                placeholder="0"
              />
              <TouchableOpacity
                style={styles.plusButton}
                onPress={() => adjustMinutes(1)}
              >
                <Text style={styles.buttonText}>＋</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => adjustMinutes(5)}
              >
                <Text style={styles.quickButtonText}>+5</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => adjustMinutes(10)}
              >
                <Text style={styles.quickButtonText}>+10</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => adjustMinutes(15)}
              >
                <Text style={styles.quickButtonText}>+15</Text>
              </TouchableOpacity>
            </View>

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
            <Text style={styles.label}>活動 *</Text>
            <View style={styles.activitySelectContainer}>
              <Text style={styles.activitySelectText}>
                {lightActivity || '活動を選択...'}
              </Text>
              <TouchableOpacity
                style={styles.activitySelectButton}
                onPress={openActivityModal}
              >
                <Text style={styles.activitySelectButtonText}>
                  {lightActivity ? '変更' : '選択'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>時間（分・任意）</Text>
            <View style={styles.numberInputContainer}>
              <TouchableOpacity
                style={styles.minusButton}
                onPress={() => adjustMinutes(-1)}
              >
                <Text style={styles.buttonText}>−</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.numberInput}
                value={lightMinutes}
                onChangeText={setLightMinutes}
                keyboardType="numeric"
                placeholder="0"
              />
              <TouchableOpacity
                style={styles.plusButton}
                onPress={() => adjustMinutes(1)}
              >
                <Text style={styles.buttonText}>＋</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => adjustMinutes(5)}
              >
                <Text style={styles.quickButtonText}>+5</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => adjustMinutes(10)}
              >
                <Text style={styles.quickButtonText}>+10</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => adjustMinutes(15)}
              >
                <Text style={styles.quickButtonText}>+15</Text>
              </TouchableOpacity>
            </View>
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
                    <View style={styles.setHeader}>
                      <Text style={styles.setLabel}>{setIndex + 1}セット目</Text>
                      <TouchableOpacity onPress={() => removeSet(exerciseIndex, setIndex)}>
                        <Text style={styles.removeSetButton}>削除</Text>
                      </TouchableOpacity>
                    </View>

                    {/* 回数入力 */}
                    <View style={styles.setInputRow}>
                      <Text style={styles.inputLabel}>回数</Text>
                      <View style={styles.numberInputContainer}>
                        <TouchableOpacity
                          style={styles.minusButton}
                          onPress={() => adjustSetValue(exerciseIndex, setIndex, 'reps', -1)}
                        >
                          <Text style={styles.buttonText}>−</Text>
                        </TouchableOpacity>
                        <TextInput
                          style={styles.numberInput}
                          value={set.reps ? String(set.reps) : '0'}
                          onChangeText={(text) => updateSet(exerciseIndex, setIndex, 'reps', text)}
                          keyboardType="numeric"
                        />
                        <TouchableOpacity
                          style={styles.plusButton}
                          onPress={() => adjustSetValue(exerciseIndex, setIndex, 'reps', 1)}
                        >
                          <Text style={styles.buttonText}>＋</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* 重量入力 */}
                    <View style={styles.setInputRow}>
                      <Text style={styles.inputLabel}>重量(kg)</Text>
                      <View style={styles.numberInputContainer}>
                        <TouchableOpacity
                          style={styles.minusButton}
                          onPress={() => adjustSetValue(exerciseIndex, setIndex, 'weightKg', -2.5)}
                        >
                          <Text style={styles.buttonText}>−</Text>
                        </TouchableOpacity>
                        <TextInput
                          style={styles.numberInput}
                          value={set.weightKg ? String(set.weightKg) : '0'}
                          onChangeText={(text) => updateSet(exerciseIndex, setIndex, 'weightKg', text)}
                          keyboardType="decimal-pad"
                        />
                        <TouchableOpacity
                          style={styles.plusButton}
                          onPress={() => adjustSetValue(exerciseIndex, setIndex, 'weightKg', 2.5)}
                        >
                          <Text style={styles.buttonText}>＋</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.quickButton}
                          onPress={() => adjustSetValue(exerciseIndex, setIndex, 'weightKg', 5)}
                        >
                          <Text style={styles.quickButtonText}>+5</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.quickButton}
                          onPress={() => adjustSetValue(exerciseIndex, setIndex, 'weightKg', 10)}
                        >
                          <Text style={styles.quickButtonText}>+10</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* RPE入力 */}
                    <View style={styles.setInputRow}>
                      <Text style={styles.inputLabel}>RPE</Text>
                      <View style={styles.numberInputContainer}>
                        <TouchableOpacity
                          style={styles.minusButton}
                          onPress={() => adjustSetValue(exerciseIndex, setIndex, 'rpe', -1)}
                        >
                          <Text style={styles.buttonText}>−</Text>
                        </TouchableOpacity>
                        <TextInput
                          style={styles.numberInput}
                          value={set.rpe ? String(set.rpe) : ''}
                          onChangeText={(text) => updateSet(exerciseIndex, setIndex, 'rpe', text)}
                          keyboardType="numeric"
                          placeholder="任意"
                        />
                        <TouchableOpacity
                          style={styles.plusButton}
                          onPress={() => adjustSetValue(exerciseIndex, setIndex, 'rpe', 1)}
                        >
                          <Text style={styles.buttonText}>＋</Text>
                        </TouchableOpacity>
                      </View>
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

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              value={exerciseSearchQuery}
              onChangeText={setExerciseSearchQuery}
              placeholder="種目を検索..."
              autoCapitalize="none"
            />
            {exerciseSearchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearSearchButton}
                onPress={() => setExerciseSearchQuery('')}
              >
                <Text style={styles.clearSearchText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={styles.modalScroll}>
            {getFilteredExercises().map((category) => (
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

    {/* 活動選択モーダル（Cardio/Light用） */}
    <Modal
      visible={showActivityModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowActivityModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>活動を選択</Text>
            <TouchableOpacity onPress={() => setShowActivityModal(false)}>
              <Text style={styles.modalCloseButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              value={activitySearchQuery}
              onChangeText={setActivitySearchQuery}
              placeholder="活動を検索..."
              autoCapitalize="none"
            />
            {activitySearchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearSearchButton}
                onPress={() => setActivitySearchQuery('')}
              >
                <Text style={styles.clearSearchText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={styles.modalScroll}>
            {getFilteredActivities().map((category) => (
              <View key={category.category} style={styles.categoryContainer}>
                <Text style={styles.categoryTitle}>{category.category}</Text>
                {category.exercises.map((exercise) => (
                  <TouchableOpacity
                    key={exercise}
                    style={styles.exerciseOption}
                    onPress={() => selectActivity(exercise)}
                  >
                    <Text style={styles.exerciseOptionText}>{exercise}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}

            {isActivityCustomMode && (
              <View style={styles.customInputContainer}>
                <Text style={styles.categoryTitle}>カスタム活動</Text>
                <TextInput
                  style={styles.input}
                  value={customActivityName}
                  onChangeText={setCustomActivityName}
                  placeholder="活動名を入力..."
                  autoFocus
                />
                <TouchableOpacity style={styles.customAddButton} onPress={addCustomActivity}>
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
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  setHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  setLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  removeSetButton: {
    color: '#ff3b30',
    fontSize: 12,
    fontWeight: '600',
  },
  setInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    width: 80,
    fontSize: 14,
    color: '#666',
  },
  numberInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  minusButton: {
    backgroundColor: '#ff3b30',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusButton: {
    backgroundColor: '#34C759',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  numberInput: {
    minWidth: 70,
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 8,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  quickButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  quickButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
  searchContainer: {
    padding: 16,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  clearSearchButton: {
    position: 'absolute',
    right: 24,
    top: 20,
  },
  clearSearchText: {
    fontSize: 18,
    color: '#666',
  },
  detailContainer: {
    padding: 16,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailType: {
    fontSize: 14,
    color: '#666',
  },
  detailActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton2: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton2: {
    backgroundColor: '#ff3b30',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  detailDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  detailSection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  detailExercise: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  detailExerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  detailSet: {
    marginBottom: 8,
    paddingLeft: 12,
  },
  detailSetLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  detailSetInfo: {
    flexDirection: 'row',
    gap: 12,
  },
  detailSetText: {
    fontSize: 14,
    color: '#666',
  },
  activitySelectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 16,
  },
  activitySelectText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  activitySelectButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  activitySelectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
