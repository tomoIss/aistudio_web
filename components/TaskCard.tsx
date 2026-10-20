'use client';

import React from 'react';
import { TaskItem, getRemainingTime, formatDateTime } from '@/lib/task-utils';

interface TaskCardProps {
  task: TaskItem;
  isDone: boolean;
  onToggleStatus: (e: React.MouseEvent, taskId: string | number) => void;
  onClick: () => void;
}

export default function TaskCard({
  task,
  isDone,
  onToggleStatus,
  onClick,
}: TaskCardProps) {
  const remaining = getRemainingTime(task.期限);
  const taskId = task.課題id ?? '';

  return (
    <div
      className="task-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <button
        type="button"
        className={`status-toggle-btn ${isDone ? 'is-done' : ''}`}
        aria-label={`${task.課題名 || '課題'}の完了状態を切り替え: 現在${isDone ? '完了' : '未完了'}`}
        onClick={(e) => onToggleStatus(e, taskId)}
      >
        {isDone ? '完了' : '未完了'}
      </button>

      <div className="subject">{task.教科 || '不明'}</div>

      <div className="title">{task.課題名 || '無題の課題'}</div>

      <div className="detail-badge">{task.詳細 || '==詳細なし=='}</div>

      <div className="task-footer">
        <div className={`time-left ${remaining.isUrgent ? 'urgent' : ''}`}>
          {remaining.text}
        </div>
        <div className="deadline">{formatDateTime(task.期限)}</div>
      </div>
    </div>
  );
}
