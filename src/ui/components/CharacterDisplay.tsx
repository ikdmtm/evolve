import React from 'react';
import { View, Image, StyleSheet, ViewStyle } from 'react-native';
import type { CharacterType, CharacterGender } from '../../core/storage/SettingsRepository';

type CharacterDisplayProps = {
  level: number;
  characterType: CharacterType;
  characterGender: CharacterGender;
  style?: ViewStyle;
};

// 画像を事前にロード（コンポーネント外で定義してキャッシュ）
const images: Record<string, any> = {
  // Muscle Male
  'character-muscle-male-l0': require('../../../assets/character-muscle-male-l0.webp'),
  'character-muscle-male-l1': require('../../../assets/character-muscle-male-l1.webp'),
  'character-muscle-male-l2': require('../../../assets/character-muscle-male-l2.webp'),
  'character-muscle-male-l3': require('../../../assets/character-muscle-male-l3.webp'),
  'character-muscle-male-l4': require('../../../assets/character-muscle-male-l4.webp'),
  'character-muscle-male-l5': require('../../../assets/character-muscle-male-l5.webp'),
  'character-muscle-male-l6': require('../../../assets/character-muscle-male-l6.webp'),
  'character-muscle-male-l7': require('../../../assets/character-muscle-male-l7.webp'),
  'character-muscle-male-l8': require('../../../assets/character-muscle-male-l8.webp'),
  'character-muscle-male-l9': require('../../../assets/character-muscle-male-l9.webp'),
  'character-muscle-male-l10': require('../../../assets/character-muscle-male-l10.webp'),
  
  // Muscle Female
  'character-muscle-female-l0': require('../../../assets/character-muscle-female-l0.webp'),
  'character-muscle-female-l1': require('../../../assets/character-muscle-female-l1.webp'),
  'character-muscle-female-l2': require('../../../assets/character-muscle-female-l2.webp'),
  'character-muscle-female-l3': require('../../../assets/character-muscle-female-l3.webp'),
  'character-muscle-female-l4': require('../../../assets/character-muscle-female-l4.webp'),
  'character-muscle-female-l5': require('../../../assets/character-muscle-female-l5.webp'),
  'character-muscle-female-l6': require('../../../assets/character-muscle-female-l6.webp'),
  'character-muscle-female-l7': require('../../../assets/character-muscle-female-l7.webp'),
  'character-muscle-female-l8': require('../../../assets/character-muscle-female-l8.webp'),
  'character-muscle-female-l9': require('../../../assets/character-muscle-female-l9.webp'),
  'character-muscle-female-l10': require('../../../assets/character-muscle-female-l10.webp'),
  
  // Diet Male
  'character-diet-male-l0': require('../../../assets/character-diet-male-l0.webp'),
  'character-diet-male-l1': require('../../../assets/character-diet-male-l1.webp'),
  'character-diet-male-l2': require('../../../assets/character-diet-male-l2.webp'),
  'character-diet-male-l3': require('../../../assets/character-diet-male-l3.webp'),
  'character-diet-male-l4': require('../../../assets/character-diet-male-l4.webp'),
  'character-diet-male-l5': require('../../../assets/character-diet-male-l5.webp'),
  'character-diet-male-l6': require('../../../assets/character-diet-male-l6.webp'),
  'character-diet-male-l7': require('../../../assets/character-diet-male-l7.webp'),
  'character-diet-male-l8': require('../../../assets/character-diet-male-l8.webp'),
  'character-diet-male-l9': require('../../../assets/character-diet-male-l9.webp'),
  'character-diet-male-l10': require('../../../assets/character-diet-male-l10.webp'),
  
  // Diet Female
  'character-diet-female-l0': require('../../../assets/character-diet-female-l0.webp'),
  'character-diet-female-l1': require('../../../assets/character-diet-female-l1.webp'),
  'character-diet-female-l2': require('../../../assets/character-diet-female-l2.webp'),
  'character-diet-female-l3': require('../../../assets/character-diet-female-l3.webp'),
  'character-diet-female-l4': require('../../../assets/character-diet-female-l4.webp'),
  'character-diet-female-l5': require('../../../assets/character-diet-female-l5.webp'),
  'character-diet-female-l6': require('../../../assets/character-diet-female-l6.webp'),
  'character-diet-female-l7': require('../../../assets/character-diet-female-l7.webp'),
  'character-diet-female-l8': require('../../../assets/character-diet-female-l8.webp'),
  'character-diet-female-l9': require('../../../assets/character-diet-female-l9.webp'),
  'character-diet-female-l10': require('../../../assets/character-diet-female-l10.webp'),
};

/**
 * レベルに応じたキャラクター画像を表示するコンポーネント
 */
export function CharacterDisplay({
  level,
  characterType,
  characterGender,
  style,
}: CharacterDisplayProps) {
  const clampedLevel = Math.max(0, Math.min(10, level));

  if (characterType === 'simple') {
    return null;
  }

  const imageName = `character-${characterType}-${characterGender}-l${clampedLevel}`;
  const imageSource = images[imageName];

  if (!imageSource) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <Image
        source={imageSource}
        style={styles.image}
        resizeMode="contain"
        fadeDuration={0}
        accessible
        accessibilityLabel={`レベル ${clampedLevel} のキャラクター`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
