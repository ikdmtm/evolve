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
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { WorkoutRepository } from '../src/core/storage/WorkoutRepository';
import { DayStateRepository } from '../src/core/storage/DayStateRepository';
import { SettingsRepository } from '../src/core/storage/SettingsRepository';
import type { Workout, WorkoutType } from '../src/core/domain/models';
import { getTodayDate, generateId, formatDateJP } from '../src/utils/date';
import { shadows, radius, spacing, darkColors } from '../src/theme/colors';
import { useTheme } from '../src/context/ThemeContext';

// StyleSheet用の静的カラー
const colors = darkColors;

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
  const { colors: themeColors } = useTheme();
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
  const [previousRecords, setPreviousRecords] = useState<Map<string, Array<{
    reps?: number;
    weightKg?: number;
    rpe?: number;
  }>>>(new Map());
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

      // レベルを更新
      await updateDayLevel(today);

      Alert.alert('成功', '記録を保存しました');
      setMode('list');
      setEditingWorkout(null);
      loadWorkouts();
    } catch (error) {
      Alert.alert('エラー', error instanceof Error ? error.message : '保存に失敗しました');
    }
  }

  async function updateDayLevel(date: string) {
    try {
      const dayStateRepo = new DayStateRepository();
      const settingsRepo = new SettingsRepository();
      
      // その日の記録を取得
      const workouts = await repo.getByDate(date);
      const hasActivity = workouts.length > 0;
      
      // 前日のレベルを取得
      const yesterday = new Date(date);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
      const yesterdayState = await dayStateRepo.getByDate(yesterdayStr);
      const prevLevel = yesterdayState?.level ?? 0;
      
      // 休息日設定を取得（手動 or 固定）
      const todayState = await dayStateRepo.getByDate(date);
      const dayOfWeek = new Date(date).getDay();
      const fixedRestDays = await settingsRepo.getFixedRestDays();
      const isFixedRestDay = fixedRestDays.includes(dayOfWeek);
      const isRestDay = todayState?.isRestDay ?? isFixedRestDay;
      
      // レベルを計算（活動優先）
      let newLevel = prevLevel;
      if (hasActivity) {
        // 活動ありは休息日設定に関わらず+1（活動優先）
        newLevel = Math.min(prevLevel + 1, 10);
      } else if (isRestDay) {
        // 活動なし + 休息日はレベル維持
        newLevel = prevLevel;
      } else {
        // 活動なし + 非休息日は-1
        newLevel = Math.max(prevLevel - 1, 0);
      }
      
      // DayStateを更新
      await dayStateRepo.upsert({
        date,
        isRestDay,
        level: newLevel,
      });
      
      console.log(`[updateDayLevel] ${date}: ${prevLevel} -> ${newLevel} (hasActivity: ${hasActivity}, isRestDay: ${isRestDay}, isFixedRestDay: ${isFixedRestDay})`);
    } catch (error) {
      console.error('Failed to update day level:', error);
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
            
            // レベルを更新
            await updateDayLevel(today);
            
            Alert.alert('完了', '削除しました');
            setMode('list');
            setEditingWorkout(null);
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

  // 前回の記録を取得
  async function loadPreviousRecord(exerciseName: string): Promise<Array<{ reps?: number; weightKg?: number; rpe?: number; }> | null> {
    try {
      // 過去30日分の記録を取得
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const startDate = `${thirtyDaysAgo.getFullYear()}-${String(thirtyDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(thirtyDaysAgo.getDate()).padStart(2, '0')}`;
      
      console.log('[loadPreviousRecord] exerciseName:', exerciseName);
      console.log('[loadPreviousRecord] dateRange:', startDate, 'to', today);
      console.log('[loadPreviousRecord] editingWorkout?.id:', editingWorkout?.id);
      
      const pastWorkouts = await repo.getByDateRange(startDate, today);
      console.log('[loadPreviousRecord] total pastWorkouts:', pastWorkouts.length);
      
      // 現在編集中のワークアウトは除外（新規作成時はundefinedなので全て含まれる）
      const filteredWorkouts = pastWorkouts.filter(w => w.id !== editingWorkout?.id);
      console.log('[loadPreviousRecord] filtered (excluding current editing):', filteredWorkouts.length);
      
      // 同じ種目の最新の記録を探す（新しい順にソート済み）
      for (let i = filteredWorkouts.length - 1; i >= 0; i--) {
        const workout = filteredWorkouts[i];
        if (workout.strength && workout.strength.exercises) {
          const exercise = workout.strength.exercises.find(e => e.name === exerciseName);
          if (exercise && exercise.sets.length > 0) {
            console.log('[loadPreviousRecord] found exercise:', exercise.name, 'from workout:', workout.id, 'date:', workout.date);
            console.log('[loadPreviousRecord] sets:', exercise.sets);
            // 前回の記録を保存して返す
            setPreviousRecords(prev => new Map(prev).set(exerciseName, exercise.sets));
            return exercise.sets;
          }
        }
      }
      
      console.log('[loadPreviousRecord] no previous record found for:', exerciseName);
      // 記録が見つからない場合は削除
      setPreviousRecords(prev => {
        const newMap = new Map(prev);
        newMap.delete(exerciseName);
        return newMap;
      });
      return null;
    } catch (error) {
      console.error('Failed to load previous record:', error);
      return null;
    }
  }

  async function selectExercise(name: string) {
    if (name === 'カスタム入力') {
      // カスタム入力の場合はモーダルを閉じずに入力欄を表示
      setIsCustomMode(true);
      setCustomExerciseName('');
      return;
    }
    
    if (editingExerciseIndex !== null) {
      // 既存の種目を編集
      updateExerciseName(editingExerciseIndex, name);
      setShowExerciseModal(false);
    } else {
      // 新規種目を追加
      console.log('[selectExercise] exerciseName:', name);
      console.log('[selectExercise] current exercises:', JSON.stringify(exercises, null, 2));
      
      // 1. まず現在編集中の同じ種目を探す
      const currentExercise = exercises.find(e => e.name === name);
      
      let initialSet: any;
      
      if (currentExercise && currentExercise.sets.length > 0) {
        // 現在編集中の同じ種目がある場合、その最初のセットをコピー
        initialSet = { ...currentExercise.sets[0] };
        console.log('[selectExercise] using current exercise first set:', JSON.stringify(initialSet, null, 2));
      } else {
        // 2. なければDBから前回の記録を取得
        const previousSets = await loadPreviousRecord(name);
        console.log('[selectExercise] previousSets from DB:', JSON.stringify(previousSets, null, 2));
        
        initialSet = previousSets && previousSets.length > 0 
          ? { ...previousSets[0] }
          : { reps: 10, weightKg: 0 };
        console.log('[selectExercise] initialSet:', JSON.stringify(initialSet, null, 2));
      }
      
      setExercises(currentExercises => {
        const newExercises = [...currentExercises, { name, sets: [initialSet] }];
        console.log('[selectExercise] newExercises:', JSON.stringify(newExercises, null, 2));
        return newExercises;
      });
      setShowExerciseModal(false);
    }
  }

  async function addCustomExercise() {
    if (!customExerciseName.trim()) {
      Alert.alert('エラー', '種目名を入力してください');
      return;
    }
    
    const name = customExerciseName.trim();
    
    if (editingExerciseIndex !== null) {
      updateExerciseName(editingExerciseIndex, name);
      setShowExerciseModal(false);
    } else {
      // 1. まず現在編集中の同じ種目を探す
      const currentExercise = exercises.find(e => e.name === name);
      
      let initialSet: any;
      
      if (currentExercise && currentExercise.sets.length > 0) {
        // 現在編集中の同じ種目がある場合、その最初のセットをコピー
        initialSet = { ...currentExercise.sets[0] };
        console.log('[addCustomExercise] using current exercise first set:', JSON.stringify(initialSet, null, 2));
      } else {
        // 2. なければDBから前回の記録を取得
        const previousSets = await loadPreviousRecord(name);
        
        initialSet = previousSets && previousSets.length > 0 
          ? { ...previousSets[0] }
          : { reps: 10, weightKg: 0 };
        console.log('[addCustomExercise] initialSet:', JSON.stringify(initialSet, null, 2));
      }
      
      setExercises(currentExercises => [...currentExercises, { name, sets: [initialSet] }]);
      setShowExerciseModal(false);
    }
  }

  function removeExercise(index: number) {
    setExercises(exercises.filter((_, i) => i !== index));
  }

  function updateExerciseName(index: number, name: string) {
    const newExercises = [...exercises];
    newExercises[index].name = name;
    setExercises(newExercises);
    
    // 種目名が変更されたら前回の記録を読み込む
    loadPreviousRecord(name);
  }

  function addSet(exerciseIndex: number) {
    const newExercises = [...exercises];
    const exercise = newExercises[exerciseIndex];
    
    // 前回の記録または直前のセットをコピー
    const previousSets = previousRecords.get(exercise.name);
    const lastSet = exercise.sets[exercise.sets.length - 1];
    const setIndexForPrevious = exercise.sets.length;
    
    let initialSet: any = {};
    
    if (previousSets && previousSets[setIndexForPrevious]) {
      // 前回の同じセット番号の記録を使用
      initialSet = { ...previousSets[setIndexForPrevious] };
    } else if (lastSet) {
      // 直前のセットをコピー
      initialSet = { ...lastSet };
    }
    
    newExercises[exerciseIndex].sets.push(initialSet);
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
      <ScrollView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={[styles.header, { backgroundColor: themeColors.backgroundLight }]}>
          <Text style={[styles.title, { color: themeColors.textPrimary }]}>記録</Text>
          <Text style={[styles.date, { color: themeColors.textSecondary }]}>{formatDateJP(today)}</Text>
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
            workouts.map((workout) => {
              const typeColor = 
                workout.type === 'strength' ? '#5B8FF9' :
                workout.type === 'cardio' ? '#61DDAA' : '#F6BD16';
              
              return (
                <TouchableOpacity
                  key={workout.id}
                  style={[styles.workoutItemCard, { borderLeftColor: typeColor }]}
                  onPress={() => viewDetail(workout)}
                >
                  <View style={styles.workoutCardHeader}>
                    <View style={styles.workoutCardTypeContainer}>
                      <View style={[styles.workoutCardTypeBadge, { backgroundColor: typeColor }]}>
                        <Text style={styles.workoutCardTypeIcon}>
                          {workout.type === 'strength' && '💪'}
                          {workout.type === 'cardio' && '🏃'}
                          {workout.type === 'light' && '🧘'}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.workoutCardTitle}>
                          {workout.title || '(タイトルなし)'}
                        </Text>
                        <Text style={styles.workoutCardType}>
                          {workout.type === 'strength' && '筋トレ'}
                          {workout.type === 'cardio' && '有酸素'}
                          {workout.type === 'light' && '軽め'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={styles.workoutCardDeleteButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        deleteWorkout(workout.id);
                      }}
                    >
                      <Text style={styles.workoutCardDeleteText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.workoutCardContent}>
                    {workout.cardio && (
                      <View style={styles.workoutCardInfo}>
                        <Text style={styles.workoutCardInfoLabel}>時間</Text>
                        <Text style={styles.workoutCardInfoValue}>{workout.cardio.minutes}分</Text>
                        <Text style={styles.workoutCardInfoLabel}>強度</Text>
                        <Text style={styles.workoutCardInfoValue}>
                          {workout.cardio.intensity === 'easy' ? '低' : 
                           workout.cardio.intensity === 'medium' ? '中' : '高'}
                        </Text>
                      </View>
                    )}
                    {workout.light && (
                      <View style={styles.workoutCardInfo}>
                        {workout.light.minutes && (
                          <>
                            <Text style={styles.workoutCardInfoLabel}>時間</Text>
                            <Text style={styles.workoutCardInfoValue}>{workout.light.minutes}分</Text>
                          </>
                        )}
                      </View>
                    )}
                    {workout.strength && workout.strength.exercises.length > 0 && (
                      <View style={styles.workoutCardInfo}>
                        <Text style={styles.workoutCardInfoLabel}>種目数</Text>
                        <Text style={styles.workoutCardInfoValue}>{workout.strength.exercises.length}種目</Text>
                        <Text style={styles.workoutCardInfoLabel}>内容</Text>
                        <Text style={styles.workoutCardInfoValue} numberOfLines={1}>
                          {workout.strength.exercises.slice(0, 2).map(e => e.name).join(', ')}
                          {workout.strength.exercises.length > 2 && ' ...'}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    );
  }

  // 詳細表示画面
  if (mode === 'detail' && editingWorkout) {
    const typeColor = 
      editingWorkout.type === 'strength' ? '#5B8FF9' :
      editingWorkout.type === 'cardio' ? '#61DDAA' : '#F6BD16';
    
    return (
      <ScrollView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={[styles.header, { backgroundColor: themeColors.backgroundLight }]}>
          <TouchableOpacity onPress={() => { setMode('list'); setEditingWorkout(null); }}>
            <Text style={[styles.backButton, { color: themeColors.primary }]}>← 戻る</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: themeColors.textPrimary }]}>記録詳細</Text>
        </View>

        <View style={styles.detailContainer}>
          <View style={[styles.detailHeaderCard, { borderTopColor: typeColor }]}>
            <View style={styles.detailHeaderTop}>
              <View style={[styles.detailTypeBadge, { backgroundColor: typeColor }]}>
                <Text style={styles.detailTypeIcon}>
                  {editingWorkout.type === 'strength' && '💪'}
                  {editingWorkout.type === 'cardio' && '🏃'}
                  {editingWorkout.type === 'light' && '🧘'}
                </Text>
              </View>
              <View style={styles.detailHeaderInfo}>
                <Text style={styles.detailTitle}>{editingWorkout.title}</Text>
                <Text style={styles.detailType}>
                  {editingWorkout.type === 'strength' && '筋トレ'}
                  {editingWorkout.type === 'cardio' && '有酸素運動'}
                  {editingWorkout.type === 'light' && '軽めの活動'}
                </Text>
                <Text style={styles.detailDate}>{formatDateJP(editingWorkout.date)}</Text>
              </View>
            </View>
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

          {editingWorkout.cardio && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>活動内容</Text>
              <View style={styles.detailInfoGrid}>
                <View style={styles.detailInfoItem}>
                  <Text style={styles.detailInfoLabel}>時間</Text>
                  <Text style={styles.detailInfoValue}>{editingWorkout.cardio.minutes}分</Text>
                </View>
                <View style={styles.detailInfoItem}>
                  <Text style={styles.detailInfoLabel}>強度</Text>
                  <Text style={styles.detailInfoValue}>
                    {editingWorkout.cardio.intensity === 'easy' ? '低' : 
                     editingWorkout.cardio.intensity === 'medium' ? '中' : '高'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {editingWorkout.light && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>活動内容</Text>
              {editingWorkout.light.minutes && (
                <View style={styles.detailInfoGrid}>
                  <View style={styles.detailInfoItem}>
                    <Text style={styles.detailInfoLabel}>時間</Text>
                    <Text style={styles.detailInfoValue}>{editingWorkout.light.minutes}分</Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {editingWorkout.strength && editingWorkout.strength.exercises.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>トレーニング内容</Text>
              {editingWorkout.strength.exercises.map((exercise, index) => (
                <View key={index} style={styles.detailExerciseCard}>
                  <Text style={styles.detailExerciseName}>{exercise.name}</Text>
                  <View style={styles.detailSetsContainer}>
                    {exercise.sets.map((set, setIndex) => (
                      <View key={setIndex} style={styles.detailSetCard}>
                        <View style={styles.detailSetNumber}>
                          <Text style={styles.detailSetNumberText}>{setIndex + 1}</Text>
                        </View>
                        <View style={styles.detailSetInfo}>
                          {set.reps !== undefined && (
                            <View style={styles.detailSetItem}>
                              <Text style={styles.detailSetItemLabel}>回数</Text>
                              <Text style={styles.detailSetItemValue}>{set.reps}</Text>
                            </View>
                          )}
                          {set.weightKg !== undefined && (
                            <View style={styles.detailSetItem}>
                              <Text style={styles.detailSetItemLabel}>重量</Text>
                              <Text style={styles.detailSetItemValue}>{set.weightKg}kg</Text>
                            </View>
                          )}
                          {set.rpe !== undefined && (
                            <View style={styles.detailSetItem}>
                              <Text style={styles.detailSetItemLabel}>RPE</Text>
                              <Text style={styles.detailSetItemValue}>{set.rpe}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}

          {editingWorkout.note && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>メモ</Text>
              <View style={styles.detailNoteCard}>
                <Text style={styles.detailNoteText}>{editingWorkout.note}</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    );
  }

  // 作成・編集フォーム
  return (
    <>
    <ScrollView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={[styles.header, { backgroundColor: themeColors.backgroundLight }]}>
        <TouchableOpacity onPress={() => { setMode('list'); setEditingWorkout(null); }}>
          <Text style={[styles.backButton, { color: themeColors.primary }]}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: themeColors.textPrimary }]}>
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
            {exercises.map((exercise, exerciseIndex) => {
              const previousSets = previousRecords.get(exercise.name);
              
              return (
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
                  
                  {previousSets && previousSets.length > 0 && (
                    <View style={styles.previousRecordContainer}>
                      <Text style={styles.previousRecordLabel}>前回の記録:</Text>
                      <Text style={styles.previousRecordText}>
                        {previousSets.map((set, i) => {
                          const parts = [];
                          if (set.reps) parts.push(`${set.reps}回`);
                          if (set.weightKg) parts.push(`${set.weightKg}kg`);
                          if (set.rpe) parts.push(`RPE${set.rpe}`);
                          return `${i + 1}. ${parts.join(' × ')}`;
                        }).join(' / ')}
                      </Text>
                    </View>
                  )}

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
                      <View style={styles.weightInputWrapper}>
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
                        </View>
                        <View style={styles.quickButtonsRow}>
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
              );
            })}

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
            <Text style={styles.searchLabel}>検索</Text>
            <View style={styles.searchInputWrapper}>
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
            <Text style={styles.searchLabel}>検索</Text>
            <View style={styles.searchInputWrapper}>
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
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.backgroundLight,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  date: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  backButton: {
    fontSize: 14,
    color: colors.primary,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  typeSelector: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
  },
  typeButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
    ...shadows.small,
  },
  typeButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  workoutList: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.md,
    color: colors.textPrimary,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textMuted,
    paddingVertical: spacing.xxl,
    fontSize: 16,
  },
  workoutItem: {
    backgroundColor: colors.backgroundCard,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  workoutItemCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderLeftWidth: 4,
    ...shadows.medium,
  },
  workoutCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  workoutCardTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  workoutCardTypeBadge: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  workoutCardTypeIcon: {
    fontSize: 24,
  },
  workoutCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  workoutCardType: {
    fontSize: 12,
    color: colors.textMuted,
  },
  workoutCardDeleteButton: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  workoutCardDeleteText: {
    fontSize: 18,
    color: colors.textMuted,
  },
  workoutCardContent: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  workoutCardInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  workoutCardInfoLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginRight: 4,
  },
  workoutCardInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginRight: spacing.md,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  workoutType: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  deleteButton: {
    color: colors.danger,
    fontSize: 14,
  },
  workoutTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: colors.textPrimary,
  },
  workoutDetail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  form: {
    padding: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    color: colors.textPrimary,
  },
  input: {
    backgroundColor: colors.backgroundCard,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 16,
    color: colors.textPrimary,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  intensitySelector: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  intensityButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
  },
  intensityButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
  },
  intensityButtonText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  comingSoon: {
    padding: spacing.md,
    backgroundColor: colors.warning + '20',
    borderRadius: radius.md,
    color: colors.warning,
    fontSize: 14,
    marginTop: spacing.md,
  },
  exerciseContainer: {
    backgroundColor: colors.backgroundLight,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  previousRecordContainer: {
    backgroundColor: colors.backgroundCard,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  previousRecordLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 4,
  },
  previousRecordText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  exerciseNameInput: {
    flex: 1,
  },
  removeButton: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '600',
    padding: spacing.sm,
  },
  setContainer: {
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  setHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  setLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  removeSetButton: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  setInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  inputLabel: {
    width: 80,
    fontSize: 14,
    color: colors.textSecondary,
  },
  numberInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weightInputWrapper: {
    flex: 1,
    gap: 6,
  },
  quickButtonsRow: {
    flexDirection: 'row',
    gap: 6,
    marginLeft: 42,
  },
  minusButton: {
    backgroundColor: colors.danger,
    width: 36,
    height: 36,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusButton: {
    backgroundColor: colors.success,
    width: 36,
    height: 36,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  numberInput: {
    minWidth: 70,
    flex: 1,
    backgroundColor: colors.backgroundLight,
    borderRadius: radius.md,
    padding: spacing.sm,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
  },
  quickButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  quickButtonText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  addSetButton: {
    padding: spacing.sm,
    alignItems: 'center',
  },
  addSetButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  addExerciseButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  addExerciseButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
    marginTop: spacing.xl,
    ...shadows.medium,
  },
  saveButtonText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  exerciseName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  editButton: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalCloseButton: {
    fontSize: 24,
    color: colors.textMuted,
    padding: 4,
  },
  modalScroll: {
    padding: spacing.md,
  },
  categoryContainer: {
    marginBottom: spacing.lg,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  exerciseOption: {
    padding: spacing.md,
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  exerciseOptionText: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  customInputContainer: {
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.md,
  },
  customAddButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  customAddButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  searchContainer: {
    padding: spacing.md,
    paddingTop: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  searchInputWrapper: {
    position: 'relative',
  },
  searchInput: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
  },
  clearSearchButton: {
    position: 'absolute',
    right: 24,
    top: 20,
  },
  clearSearchText: {
    fontSize: 18,
    color: colors.textMuted,
  },
  detailContainer: {
    padding: spacing.md,
  },
  detailHeaderCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderTopWidth: 4,
    ...shadows.medium,
  },
  detailHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  detailTypeBadge: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailTypeIcon: {
    fontSize: 28,
  },
  detailHeaderInfo: {
    flex: 1,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  detailType: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 2,
  },
  detailDate: {
    fontSize: 12,
    color: colors.textMuted,
  },
  detailActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  editButton2: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  editButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton2: {
    backgroundColor: colors.danger,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  deleteButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  detailSection: {
    marginBottom: spacing.md,
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  detailInfoGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  detailInfoItem: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailInfoLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  detailInfoValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  detailExerciseCard: {
    backgroundColor: colors.backgroundCard,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailExerciseName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  detailSetsContainer: {
    gap: spacing.sm,
  },
  detailSetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.backgroundLight,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  detailSetNumber: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailSetNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  detailSetInfo: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.md,
  },
  detailSetItem: {
    alignItems: 'center',
  },
  detailSetItemLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 2,
  },
  detailSetItemValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  detailNoteCard: {
    backgroundColor: colors.backgroundCard,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailNoteText: {
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  activitySelectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  activitySelectText: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
  },
  activitySelectButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  activitySelectButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
});
