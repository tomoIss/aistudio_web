/**
 * Task parsing, fingerprinting, time formatting and calculation utilities
 */

export interface TaskItem {
  課題id?: string | number;
  教科?: string;
  課題名?: string;
  詳細?: string;
  期限?: string;
  [key: string]: unknown;
}

export interface RemainingTimeResult {
  text: string;
  isUrgent: boolean;
}

/**
 * 課題を一意に特定する指紋（ID + 教科 + 課題名 + 期限）
 */
export function getTaskFingerprint(task: TaskItem): string {
  const deadline = task.期限 ? new Date(task.期限).getTime() : 'no-deadline';
  const id = task.課題id ?? '';
  const subject = task.教科 ?? '';
  const title = task.課題名 ?? '';
  return `${id}-${subject}-${title}-${deadline}`;
}

/**
 * 残り時間を計算する
 * - 期限切れ -> { text: '期限切れ', isUrgent: true }
 * - 24時間未満 -> { text: '残り HH:MM', isUrgent: true }
 * - 24時間以上 -> { text: '残り N日', isUrgent: false }
 */
export function getRemainingTime(
  isoString: string | undefined | null,
  referenceNow: Date = new Date()
): RemainingTimeResult {
  if (!isoString) return { text: '', isUrgent: false };

  const deadline = new Date(isoString);
  if (isNaN(deadline.getTime())) return { text: '', isUrgent: false };

  const diffMs = deadline.getTime() - referenceNow.getTime();

  if (diffMs <= 0) {
    return { text: '期限切れ', isUrgent: true };
  }

  // 残り総分数（Math.ceilで秒単位を切り上げ）
  const totalMinutes = Math.ceil(diffMs / (1000 * 60));

  if (totalMinutes < 60 * 24) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    return { text: `残り ${timeStr}`, isUrgent: true };
  } else {
    const days = Math.floor(totalMinutes / (60 * 24));
    return { text: `残り ${days}日`, isUrgent: false };
  }
}

/**
 * 日時文字列を表示用フォーマットに変換 (M/D HH:mm)
 */
export function formatDateTime(isoString: string | undefined | null): string {
  if (!isoString) return '--/-- --:--';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return String(isoString);
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${m}/${d} ${h}:${min}`;
}

/**
 * datetime-localの入力値をGAS登録用の「YYYY/M/D H:m」形式に変換する
 */
export function formatSubmissionDeadline(datetimeLocalVal: string): string {
  const d = new Date(datetimeLocalVal);
  if (isNaN(d.getTime())) {
    throw new Error('無効な日付です');
  }
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes()}`;
}

/**
 * 現在存在しない課題の完了キャッシュ指紋を削除する
 */
export function cleanupDoneFingerprints(
  existingFingerprints: string[],
  latestTasks: TaskItem[]
): string[] {
  if (!existingFingerprints || existingFingerprints.length === 0) return [];
  const validFingerprints = new Set(latestTasks.map((t) => getTaskFingerprint(t)));
  return existingFingerprints.filter((fp) => validFingerprints.has(fp));
}
