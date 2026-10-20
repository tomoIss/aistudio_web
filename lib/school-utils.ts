/**
 * School and class helper utilities for workManage
 */

/**
 * 日本の学校年度（4月始まり〜翌年3月終わり）に基づき、
 * 令和表記の年度コード（例: 2026年10月なら R8、2027年2月なら R8）を計算する
 * 令和元年 = 2019年 (year - 2018)
 */
export function getSchoolYearCode(targetDate: Date = new Date()): string {
  let year = targetDate.getFullYear();
  const month = targetDate.getMonth() + 1; // 1〜12

  // 1月〜3月は「前年度」扱い
  if (month >= 1 && month <= 3) {
    year -= 1;
  }

  const reiwaYear = year - 2018;
  return `R${reiwaYear}`;
}

/**
 * クラス名を正規化する (例: 3-4issR8)
 */
export function normalizeClassName(
  grade: string | number,
  classNum: string | number,
  school: string,
  yearCode?: string
): string {
  const year = yearCode || getSchoolYearCode();
  return `${grade}-${classNum}${school}${year}`;
}

/**
 * GASスプレッドシートのシート名一覧から、表示対象のクラス名のみを抽出する
 * 1. システム予約シート名を除外 ('クラスリスト', '課題リストテンプレート', 'スクリプトログ')
 * 2. 空文字や空白を除外
 * 3. ISO日付形式 (例: 2026-03...) を除外
 */
export function filterValidClasses(classes: unknown[]): string[] {
  if (!Array.isArray(classes)) return [];

  const systemSheets = new Set(['クラスリスト', '課題リストテンプレート', 'スクリプトログ']);
  const isIsoDate = /^\d{4}-\d{2}-\d{2}/;

  const valid: string[] = [];

  for (const item of classes) {
    if (item === null || item === undefined) continue;
    const clsStr = String(item).trim();
    if (!clsStr) continue;
    if (systemSheets.has(clsStr)) continue;
    if (isIsoDate.test(clsStr)) continue;

    valid.push(clsStr);
  }

  return valid;
}
