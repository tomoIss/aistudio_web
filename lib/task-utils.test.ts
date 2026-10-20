import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getTaskFingerprint,
  getRemainingTime,
  formatDateTime,
  formatSubmissionDeadline,
  cleanupDoneFingerprints,
  type TaskItem,
} from './task-utils.ts';

test('getTaskFingerprint produces stable unique identifier', () => {
  const task: TaskItem = {
    課題id: 'task-101',
    教科: '数学',
    課題名: '問題集P50-52',
    期限: '2026-10-25T15:00:00.000Z',
  };
  const expectedDeadline = new Date(task.期限!).getTime();
  assert.equal(getTaskFingerprint(task), `task-101-数学-問題集P50-52-${expectedDeadline}`);
});

test('getRemainingTime handles urgent (<24h), non-urgent (>=24h), and expired', () => {
  const now = new Date('2026-10-20T10:00:00.000Z');

  // Expired
  const past = '2026-10-20T09:00:00.000Z';
  const resPast = getRemainingTime(past, now);
  assert.equal(resPast.text, '期限切れ');
  assert.equal(resPast.isUrgent, true);

  // Urgent: remaining 5 hours 30 mins
  const urgent = '2026-10-20T15:30:00.000Z';
  const resUrgent = getRemainingTime(urgent, now);
  assert.equal(resUrgent.text, '残り 05:30');
  assert.equal(resUrgent.isUrgent, true);

  // Non-urgent: remaining 3 days
  const future = '2026-10-23T12:00:00.000Z';
  const resFuture = getRemainingTime(future, now);
  assert.equal(resFuture.text, '残り 3日');
  assert.equal(resFuture.isUrgent, false);
});

test('formatSubmissionDeadline formats correctly for GAS backend', () => {
  const formatted = formatSubmissionDeadline('2026-10-25T14:30');
  assert.match(formatted, /^2026\/10\/25 14:30$/);
});

test('cleanupDoneFingerprints keeps only valid active task fingerprints', () => {
  const activeTasks: TaskItem[] = [
    { 課題id: '1', 教科: '国語', 課題名: '漢字テスト', 期限: '2026-10-21T00:00:00.000Z' },
    { 課題id: '2', 教科: '数学', 課題名: 'ワークP20', 期限: '2026-10-22T00:00:00.000Z' },
  ];
  const fp1 = getTaskFingerprint(activeTasks[0]);
  const fp2 = getTaskFingerprint(activeTasks[1]);
  const fpOld = 'old-deleted-task';

  const cleaned = cleanupDoneFingerprints([fp1, fpOld, fp2], activeTasks);
  assert.deepEqual(cleaned, [fp1, fp2]);
});
