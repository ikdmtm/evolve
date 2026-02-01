import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { initDatabase } from '../src/core/storage/db';

export default function RootLayout() {
  const [isDbReady, setIsDbReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function setupDatabase() {
      try {
        await initDatabase();
        setIsDbReady(true);
      } catch (err) {
        console.error('Failed to initialize database:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    }

    setupDatabase();
  }, []);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: 'red', fontSize: 16, textAlign: 'center' }}>
          データベース初期化エラー:{'\n'}{error}
        </Text>
      </View>
    );
  }

  if (!isDbReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>データベース初期化中...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="auto" />
      <Tabs>
        <Tabs.Screen
          name="index"
          options={{
            href: null, // indexは非表示
          }}
        />
        <Tabs.Screen
          name="home"
          options={{
            title: 'ホーム',
            tabBarLabel: 'ホーム',
          }}
        />
        <Tabs.Screen
          name="log"
          options={{
            title: '記録',
            tabBarLabel: '記録',
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: '履歴',
            tabBarLabel: '履歴',
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: '設定',
            tabBarLabel: '設定',
          }}
        />
      </Tabs>
    </>
  );
}
