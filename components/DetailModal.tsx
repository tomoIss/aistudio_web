'use client';

import React from 'react';
import { TaskItem, formatDateTime } from '@/lib/task-utils';

interface DetailModalProps {
  isOpen: boolean;
  task: TaskItem | null;
  onClose: () => void;
  onDeleteRequest: (task: TaskItem) => void;
}

export default function DetailModal({
  isOpen,
  task,
  onClose,
  onDeleteRequest,
}: DetailModalProps) {
  if (!isOpen || !task) return null;

  return (
    <div
      id="detail-modal"
      className="app-modal"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="modal-content-card">
        <button
          type="button"
          className="close-btn"
          aria-label="閉じる"
          onClick={onClose}
        >
          &times;
        </button>

        <div className="detail-header">
          <div className="detail-subject" id="detail-subject">
            {task.教科 || '不明'}
          </div>
          <button
            type="button"
            className="btn btn-danger"
            id="detail-delete-btn"
            onClick={() => onDeleteRequest(task)}
          >
            削除
          </button>
        </div>

        <h2
          className="modal-title"
          id="detail-title"
          style={{ border: 'none', marginBottom: 15, fontSize: '1.6rem' }}
        >
          {task.課題名 || '無題の課題'}
        </h2>

        <div className="modal-body">
          <div
            style={{
              whiteSpace: 'pre-wrap',
              backgroundColor: '#f9fafb',
              padding: 16,
              borderRadius: 8,
              border: '2px solid #e5e7eb',
              fontSize: '1.05rem',
              lineHeight: 1.6,
              minHeight: 80,
              color: '#1f2937',
            }}
            id="detail-desc"
          >
            {task.詳細 || '詳細なし'}
          </div>

          <div
            style={{
              marginTop: 18,
              textAlign: 'right',
              fontWeight: 900,
              fontSize: '1.25rem',
              color: '#d9534f',
            }}
            id="detail-deadline"
          >
            期限: {formatDateTime(task.期限)}
          </div>
        </div>
      </div>
    </div>
  );
}
