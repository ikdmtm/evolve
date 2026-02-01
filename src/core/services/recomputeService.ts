import { Stage, DayInput, computeTimeline } from '../domain/stage';

/**
 * 再計算サービス
 * 過去日の編集（ログ追加/削除、休息日変更）が発生した際に、
 * その日以降のステージを再計算する
 */

export type RecomputeInput = {
  /** 再計算開始日より前のステージ（初期ステージまたは前日のステージ） */
  startStage: Stage;
  /** 再計算開始日（YYYY-MM-DD） */
  fromDate: string;
  /** 再計算終了日（YYYY-MM-DD）、未指定の場合は今日まで */
  toDate?: string;
  /** 日次データ（fromDate以降の日付を時系列順に含む） */
  dayStates: DayInput[];
};

export type RecomputeResult = {
  /** 再計算されたステージのタイムライン */
  timeline: { date: string; stage: Stage }[];
};

/**
 * 指定期間のステージを再計算する
 * @param input 再計算パラメータ
 * @returns 再計算結果
 */
export function recomputeStages(input: RecomputeInput): RecomputeResult {
  const { startStage, fromDate, toDate, dayStates } = input;

  // fromDate以降のデータをフィルタリング（時系列順を保証）
  let relevantDays = dayStates.filter((d) => d.date >= fromDate);

  // toDateが指定されている場合は、その日までをフィルタリング
  if (toDate) {
    relevantDays = relevantDays.filter((d) => d.date <= toDate);
  }

  // 時系列順にソート（念のため）
  relevantDays.sort((a, b) => a.date.localeCompare(b.date));

  // ステージのタイムラインを再計算
  const timeline = computeTimeline(startStage, relevantDays);

  return { timeline };
}

/**
 * 特定の日のステージを取得するヘルパー関数
 * @param timeline ステージタイムライン
 * @param date 取得したい日付（YYYY-MM-DD）
 * @returns その日のステージ、見つからない場合はundefined
 */
export function getStageOnDate(
  timeline: { date: string; stage: Stage }[],
  date: string
): Stage | undefined {
  const entry = timeline.find((t) => t.date === date);
  return entry?.stage;
}

/**
 * 最新のステージを取得するヘルパー関数
 * @param timeline ステージタイムライン
 * @returns 最新のステージ、タイムラインが空の場合はundefined
 */
export function getLatestStage(
  timeline: { date: string; stage: Stage }[]
): Stage | undefined {
  if (timeline.length === 0) return undefined;
  return timeline[timeline.length - 1].stage;
}
