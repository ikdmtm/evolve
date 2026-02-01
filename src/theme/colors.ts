/**
 * アプリ全体のカラーパレット
 */

export type ColorScheme = {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  accentLight: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  background: string;
  backgroundLight: string;
  backgroundCard: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderLight: string;
  gradientStart: string;
  gradientEnd: string;
  overlay: string;
  cardShadow: string;
  level: {
    low: string;
    mid: string;
    high: string;
  };
};

/**
 * ダークテーマ
 */
export const darkColors: ColorScheme = {
  primary: '#6366F1',
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',
  accent: '#22D3EE',
  accentLight: '#67E8F9',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
  background: '#0F172A',
  backgroundLight: '#1E293B',
  backgroundCard: '#334155',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  border: '#475569',
  borderLight: '#334155',
  gradientStart: '#6366F1',
  gradientEnd: '#8B5CF6',
  overlay: 'rgba(0, 0, 0, 0.6)',
  cardShadow: 'rgba(0, 0, 0, 0.3)',
  level: {
    low: '#EF4444',
    mid: '#F59E0B',
    high: '#10B981',
  },
};

/**
 * ライトテーマ
 */
export const lightColors: ColorScheme = {
  primary: '#6366F1',
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',
  accent: '#06B6D4',
  accentLight: '#22D3EE',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
  background: '#F8FAFC',
  backgroundLight: '#F1F5F9',
  backgroundCard: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  border: '#CBD5E1',
  borderLight: '#E2E8F0',
  gradientStart: '#6366F1',
  gradientEnd: '#8B5CF6',
  overlay: 'rgba(0, 0, 0, 0.4)',
  cardShadow: 'rgba(0, 0, 0, 0.1)',
  level: {
    low: '#EF4444',
    mid: '#F59E0B',
    high: '#10B981',
  },
};

/**
 * デフォルトカラー（後方互換性のため）
 */
export const colors = darkColors;

/**
 * レベルに応じた色を取得
 */
export function getLevelColor(level: number, colorScheme: ColorScheme = colors): string {
  if (level <= 3) return colorScheme.level.low;
  if (level <= 6) return colorScheme.level.mid;
  return colorScheme.level.high;
}

/**
 * 共通シャドウスタイル
 */
export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
};

/**
 * 共通ボーダーラディウス
 */
export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

/**
 * 共通スペーシング
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};
