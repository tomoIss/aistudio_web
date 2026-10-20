import test from 'node:test';
import assert from 'node:assert/strict';
import { getSchoolYearCode, normalizeClassName, filterValidClasses } from './school-utils.ts';

test('getSchoolYearCode calculates Reiwa school year correctly', () => {
  // October 2026 -> 2026 school year -> 2026 - 2018 = R8
  const oct2026 = new Date(2026, 9, 15);
  assert.equal(getSchoolYearCode(oct2026), 'R8');

  // February 2027 -> previous school year (2026) -> 2026 - 2018 = R8
  const feb2027 = new Date(2027, 1, 10);
  assert.equal(getSchoolYearCode(feb2027), 'R8');

  // April 2027 -> 2027 school year -> 2027 - 2018 = R9
  const apr2027 = new Date(2027, 3, 1);
  assert.equal(getSchoolYearCode(apr2027), 'R9');
});

test('normalizeClassName formats class code according to specification', () => {
  assert.equal(normalizeClassName(3, 4, 'iss', 'R8'), '3-4issR8');
  assert.equal(normalizeClassName('1', '2', 'iss', 'R8'), '1-2issR8');
});

test('filterValidClasses excludes reserved system sheets, blank entries, and dates', () => {
  const rawList = [
    '3-4issR8',
    'クラスリスト',
    '課題リストテンプレート',
    'スクリプトログ',
    '',
    '   ',
    null,
    '2026-03-15',
    '3-5issR8'
  ];

  const filtered = filterValidClasses(rawList);
  assert.deepEqual(filtered, ['3-4issR8', '3-5issR8']);
});
