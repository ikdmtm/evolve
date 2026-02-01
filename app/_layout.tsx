import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { initDatabase } from '../src/core/storage/db';
import { colors } from '../src/theme/colors';

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
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          データベース初期化エラー:{'\n'}{error}
        </Text>
      </View>
    );
  }

  if (!isDbReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.backgroundLight,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: 85,
            paddingTop: 8,
            paddingBottom: 28,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="home"
          options={{
            title: 'ホーム',
            tabBarLabel: 'ホーム',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="log"
          options={{
            title: '記録',
            tabBarLabel: '記録',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'create' : 'create-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: '履歴',
            tabBarLabel: '履歴',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: '設定',
            tabBarLabel: '設定',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'settings' : 'settings-outline'} size={24} color={color} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  errorText: {
    color: colors.danger,
    fontSize: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    color: colors.textSecondary,
    fontSize: 14,
  },
});
