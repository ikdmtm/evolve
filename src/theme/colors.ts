/**
 * アプリ全体のカラーパレット
 * ダークブルー系のスタイリッシュなテーマ
 */

export const colors = {
  // プライマリカラー
  primary: '#6366F1',       // インディゴ
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',
  
  // アクセントカラー
  accent: '#22D3EE',        // シアン
  accentLight: '#67E8F9',
  
  // 状態カラー
  success: '#10B981',       // エメラルドグリーン
  warning: '#F59E0B',       // アンバー
  danger: '#EF4444',        // レッド
  info: '#3B82F6',          // ブルー
  
  // 背景カラー
  background: '#0F172A',    // ダークネイビー
  backgroundLight: '#1E293B',
  backgroundCard: '#334155',
  
  // テキストカラー
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  
  // ボーダー
  border: '#475569',
  borderLight: '#334155',
  
  // グラデーション
  gradientStart: '#6366F1',
  gradientEnd: '#8B5CF6',
  
  // 特殊用途
  overlay: 'rgba(0, 0, 0, 0.6)',
  cardShadow: 'rgba(0, 0, 0, 0.3)',
  
  // レベルカラー（グラデーション用）
  level: {
    low: '#EF4444',         // 0-3: 赤系
    mid: '#F59E0B',         // 4-6: オレンジ系
    high: '#10B981',        // 7-10: 緑系
  },
};

/**
 * レベルに応じた色を取得
 */
export function getLevelColor(level: number): string {
  if (level <= 3) return colors.level.low;
  if (level <= 6) return colors.level.mid;
  return colors.level.high;
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
