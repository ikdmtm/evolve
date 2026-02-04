import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import type { ColorScheme } from '../../theme/colors';

const SEGMENTS = 11; // Level 0..10
const RING_SIZE = 152;
const CENTER = RING_SIZE / 2;
const SEGMENT_RADIUS = 58;
const SEGMENT_SIZE = 6;

type LevelDisplayProps = {
  level: number;
  levelColor: string;
  colors: ColorScheme;
  style?: ViewStyle;
};

/**
 * レベルを画像に頼らず共通で表示するコンポーネント。
 * リング状の11セグメント + 中央の大きな数字で「進捗」と「現在値」を表現。
 * 後から diet/muscle 別のキャラ画像を差し込む場合も、この外枠は流用可能。
 */
export function LevelDisplay({
  level,
  levelColor,
  colors,
  style,
}: LevelDisplayProps) {
  const clampedLevel = Math.max(0, Math.min(10, level));

  return (
    <View style={[styles.wrapper, style]}>
      {/* リング: 11本のセグメントを円形に配置（0が上） */}
      <View style={styles.ring}>
        {Array.from({ length: SEGMENTS }, (_, i) => {
          const angleRad = (i / SEGMENTS) * 2 * Math.PI - Math.PI / 2;
          const x = CENTER + SEGMENT_RADIUS * Math.cos(angleRad) - SEGMENT_SIZE / 2;
          const y = CENTER + SEGMENT_RADIUS * Math.sin(angleRad) - 4;
          const filled = i <= clampedLevel;
          return (
            <View
              key={i}
              style={[
                styles.segment,
                {
                  left: x,
                  top: y,
                  width: SEGMENT_SIZE,
                  height: 8,
                  borderRadius: SEGMENT_SIZE / 2,
                  backgroundColor: filled ? levelColor : colors.border,
                },
              ]}
            />
          );
        })}
      </View>

      {/* 中央: レベル数字 + ラベル */}
      <View style={styles.center}>
        <Text
          style={[styles.levelNumber, { color: levelColor }]}
          numberOfLines={1}
          accessible
          accessibilityLabel={`レベル ${clampedLevel}`}
        >
          {clampedLevel}
        </Text>
        <Text style={[styles.levelLabel, { color: colors.textMuted }]}>
          LEVEL
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segment: {
    position: 'absolute',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelNumber: {
    fontSize: 56,
    fontWeight: '800',
    letterSpacing: -2,
    lineHeight: 60,
  },
  levelLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 2,
  },
});
