import { Level, DayInput, computeTimeline } from '../domain/stage';

/**
 * 再計算サービス
 * 過去日の編集（ログ追加/削除、休息日変更）が発生した際に、
 * その日以降のレベルを再計算する
 */

export type RecomputeInput = {
  /** 再計算開始日より前のレベル（初期レベルまたは前日のレベル） */
  startLevel: Level;
  /** 再計算開始日（YYYY-MM-DD） */
  fromDate: string;
  /** 再計算終了日（YYYY-MM-DD）、未指定の場合は今日まで */
  toDate?: string;
  /** 日次データ（fromDate以降の日付を時系列順に含む） */
  dayStates: DayInput[];
  /** @deprecated Use startLevel instead */
  startStage?: Level;
};

export type RecomputeResult = {
  /** 再計算されたレベルのタイムライン */
  timeline: { date: string; level: Level }[];
};

/**
 * 指定期間のレベルを再計算する
 * @param input 再計算パラメータ
 * @returns 再計算結果
 */
export function recomputeStages(input: RecomputeInput): RecomputeResult {
  const { startLevel, startStage, fromDate, toDate, dayStates } = input;
  
  // 後方互換性: startStageがあればそれを使用
  const level = startLevel ?? startStage ?? 0;

  // fromDate以降のデータをフィルタリング（時系列順を保証）
  let relevantDays = dayStates.filter((d) => d.date >= fromDate);

  // toDateが指定されている場合は、その日までをフィルタリング
  if (toDate) {
    relevantDays = relevantDays.filter((d) => d.date <= toDate);
  }

  // 時系列順にソート（念のため）
  relevantDays.sort((a, b) => a.date.localeCompare(b.date));

  // レベルのタイムラインを再計算
  const timeline = computeTimeline(level, relevantDays);

  return { timeline };
}

/**
 * 特定の日のレベルを取得するヘルパー関数
 * @param timeline レベルタイムライン
 * @param date 取得したい日付（YYYY-MM-DD）
 * @returns その日のレベル、見つからない場合はundefined
 */
export function getLevelOnDate(
  timeline: { date: string; level: Level }[],
  date: string
): Level | undefined {
  const entry = timeline.find((t) => t.date === date);
  return entry?.level;
}

/**
 * 最新のレベルを取得するヘルパー関数
 * @param timeline レベルタイムライン
 * @returns 最新のレベル、タイムラインが空の場合はundefined
 */
export function getLatestLevel(
  timeline: { date: string; level: Level }[]
): Level | undefined {
  if (timeline.length === 0) return undefined;
  return timeline[timeline.length - 1].level;
}

// 後方互換性のためのエイリアス（非推奨）
/** @deprecated Use getLevelOnDate instead */
export const getStageOnDate = getLevelOnDate;
/** @deprecated Use getLatestLevel instead */
export const getLatestStage = getLatestLevel;
