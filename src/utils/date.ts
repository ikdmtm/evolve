/**
 * 今日の日付を YYYY-MM-DD 形式で取得
 */
export function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * ユニークIDを生成
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 日付を YYYY年MM月DD日 形式でフォーマット
 */
export function formatDateJP(dateString: string): string {
  const [year, month, day] = dateString.split('-');
  return `${year}年${month}月${day}日`;
}
