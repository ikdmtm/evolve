import { View, Text, StyleSheet, Button, ScrollView, Alert } from 'react-native';
import { useState } from 'react';
import { WorkoutRepository } from '../src/core/storage/WorkoutRepository';
import { DayStateRepository } from '../src/core/storage/DayStateRepository';
import type { Workout } from '../src/core/domain/models';

export default function HomeScreen() {
  const [testResult, setTestResult] = useState<string>('');
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  async function testDatabase() {
    try {
      setTestResult('テスト実行中...');

      const workoutRepo = new WorkoutRepository();
      const dayStateRepo = new DayStateRepository();

      // 1. Workoutを作成
      const testWorkout: Workout = {
        id: `test-${Date.now()}`,
        date: '2026-01-15',
        type: 'strength',
        title: 'テスト筋トレ',
        note: 'データベーステスト',
        createdAt: Date.now(),
        strength: {
          exercises: [
            {
              name: 'ベンチプレス',
              sets: [
                { reps: 10, weightKg: 60, rpe: 7 },
                { reps: 8, weightKg: 65, rpe: 8 },
              ],
            },
          ],
        },
      };

      await workoutRepo.create(testWorkout);

      // 2. Workoutを取得
      const retrieved = await workoutRepo.getById(testWorkout.id);
      if (!retrieved) {
        throw new Error('Workoutが取得できませんでした');
      }

      // 3. DayStateを保存
      await dayStateRepo.upsert({
        date: '2026-01-15',
        isRestDay: false,
        stage: 3,
      });

      // 4. DayStateを取得
      const dayState = await dayStateRepo.getByDate('2026-01-15');
      if (!dayState) {
        throw new Error('DayStateが取得できませんでした');
      }

      // 5. 全Workoutを取得
      const allWorkouts = await workoutRepo.getByDate('2026-01-15');
      setWorkouts(allWorkouts);

      setTestResult(
        `✅ テスト成功！\n\n` +
        `保存したWorkout ID: ${testWorkout.id}\n` +
        `取得したWorkout: ${retrieved.title}\n` +
        `DayState: stage=${dayState.stage}, rest=${dayState.isRestDay}\n` +
        `この日のWorkout数: ${allWorkouts.length}`
      );

      Alert.alert('成功', 'データベーステストが成功しました！');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setTestResult(`❌ エラー: ${message}`);
      Alert.alert('エラー', message);
    }
  }

  async function clearData() {
    try {
      const workoutRepo = new WorkoutRepository();
      const dayStateRepo = new DayStateRepository();

      await workoutRepo.deleteAll();
      await dayStateRepo.deleteAll();

      setTestResult('✅ データを全削除しました');
      setWorkouts([]);
      Alert.alert('完了', 'データを全削除しました');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert('エラー', message);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Continue</Text>
      <Text style={styles.subtitle}>ホーム画面（M2: データベーステスト）</Text>

      <View style={styles.buttonContainer}>
        <Button title="データベーステスト実行" onPress={testDatabase} />
      </View>

      <View style={styles.buttonContainer}>
        <Button title="データ全削除" onPress={clearData} color="#ff6b6b" />
      </View>

      {testResult ? (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>テスト結果:</Text>
          <Text style={styles.resultText}>{testResult}</Text>
        </View>
      ) : null}

      {workouts.length > 0 && (
        <View style={styles.workoutsContainer}>
          <Text style={styles.workoutsTitle}>保存されたWorkout:</Text>
          {workouts.map((w) => (
            <View key={w.id} style={styles.workoutItem}>
              <Text style={styles.workoutText}>
                {w.title || 'タイトルなし'} ({w.type})
              </Text>
              <Text style={styles.workoutDate}>{w.date}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.description}>
        {'\n'}
        M2の目標:{'\n'}
        - データベースに保存{'\n'}
        - アプリ再起動後もデータが残る{'\n'}
        {'\n'}
        上のボタンでテストしてください。{'\n'}
        テスト後、アプリを完全に終了して再起動し、{'\n'}
        データが残っているか確認してください。
      </Text>
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#888',
    lineHeight: 22,
    marginTop: 20,
  },
  buttonContainer: {
    marginVertical: 8,
  },
  resultContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 14,
    lineHeight: 20,
  },
  workoutsContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#e8f4f8',
    borderRadius: 8,
  },
  workoutsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  workoutItem: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 6,
    marginBottom: 8,
  },
  workoutText: {
    fontSize: 14,
    fontWeight: '600',
  },
  workoutDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});
