'use client';

import React, { useState } from 'react';

interface AddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: {
    subject: string;
    title: string;
    detail: string;
    deadlineRaw: string;
  }) => void;
}

export default function AddModal({ isOpen, onClose, onSubmit }: AddModalProps) {
  const [subject, setSubject] = useState('');
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !title.trim() || !deadline.trim()) {
      setError('科目名、課題名、期限は必須です。');
      return;
    }
    setError('');
    onSubmit({
      subject: subject.trim(),
      title: title.trim(),
      detail: detail.trim(),
      deadlineRaw: deadline,
    });
    // Reset form
    setSubject('');
    setTitle('');
    setDetail('');
    setDeadline('');
  };

  return (
    <div
      id="add-modal"
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
        <h2 className="modal-title">課題の追加</h2>

        {error && (
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              borderRadius: 6,
              marginBottom: 14,
              fontSize: '0.9rem',
              fontWeight: 'bold',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="add-subject">科目名</label>
              <input
                type="text"
                id="add-subject"
                placeholder="例: 数学"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="add-title">課題名</label>
              <input
                type="text"
                id="add-title"
                placeholder="例: プリントP10~15"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="add-detail">詳細</label>
              <textarea
                id="add-detail"
                rows={3}
                placeholder="提出方法や補足など"
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="add-deadline">期限 (yyyy/mm/dd hh:mm)</label>
              <input
                type="datetime-local"
                id="add-deadline"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>

          <div className="btn-group">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              キャンセル
            </button>
            <button type="submit" className="btn btn-primary">
              追加する
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
