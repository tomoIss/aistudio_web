'use client';

import React, { useState } from 'react';
import { getSchoolYearCode, normalizeClassName } from '@/lib/school-utils';

interface ClassModalProps {
  isOpen: boolean;
  isLoading: boolean;
  classes: string[];
  isOnline: boolean;
  canCancel: boolean;
  onSelectClass: (className: string) => void;
  onClose: () => void;
  onNotify: (msg: string) => void;
}

export default function ClassModal({
  isOpen,
  isLoading,
  classes,
  isOnline,
  canCancel,
  onSelectClass,
  onClose,
  onNotify,
}: ClassModalProps) {
  const [newGrade, setNewGrade] = useState('1');
  const [newClassNum, setNewClassNum] = useState('1');
  const [newSchool, setNewSchool] = useState('iss');

  if (!isOpen) return null;

  const handleCreateNewClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      onNotify('オフライン中は新しいクラスを作成できません。');
      return;
    }

    const year = getSchoolYearCode();
    const normalized = normalizeClassName(newGrade, newClassNum, newSchool, year);

    // 重複チェック
    const isExisting = classes.some(
      (c) => c.trim().toLowerCase() === normalized.toLowerCase()
    );

    if (isExisting) {
      onNotify(`既存のクラス「${normalized}」が見つかりました。接続します。`);
    } else {
      onNotify(`新規クラス「${normalized}」を作成・接続します。`);
    }

    onSelectClass(normalized);
  };

  return (
    <div
      id="class-selection-ui"
      className="app-modal"
      style={{
        zIndex: 200,
        backgroundColor: 'var(--bg-green)',
        alignItems: 'center',
      }}
    >
      <div className="class-selection-container">
        {isLoading ? (
          <div>
            <div className="chalk-loader" />
            <div style={{ fontSize: '1.25rem', fontWeight: 900, marginTop: 15, color: '#333' }}>
              クラス情報を取得中...
            </div>
          </div>
        ) : (
          <div>
            <div className="class-selection-title">クラスを選択してください</div>

            {!isOnline ? (
              <div
                style={{
                  color: '#dc2626',
                  fontWeight: 'bold',
                  padding: '15px',
                  textAlign: 'center',
                  background: '#fee2e2',
                  borderRadius: 8,
                  marginBottom: 20,
                }}
              >
                現在オフラインのため、クラスを切り替えできません。
              </div>
            ) : (
              <div className="class-list-container" id="class-list-buttons">
                {classes.length > 0 ? (
                  classes.map((cls) => (
                    <button
                      key={cls}
                      type="button"
                      className="class-btn"
                      onClick={() => onSelectClass(cls)}
                    >
                      {cls}
                    </button>
                  ))
                ) : (
                  <p style={{ color: '#666', fontStyle: 'italic' }}>
                    既存のクラスはありません
                  </p>
                )}
              </div>
            )}

            {/* 新規クラス作成フォーム */}
            <div className="new-class-group">
              <p style={{ marginTop: 0, fontWeight: 'bold', color: '#555', marginBottom: 12 }}>
                リストにない場合は新規作成
              </p>
              <form onSubmit={handleCreateNewClass}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  <select
                    id="new-class-grade"
                    value={newGrade}
                    disabled={!isOnline}
                    onChange={(e) => setNewGrade(e.target.value)}
                    style={{
                      flex: 1,
                      padding: 10,
                      borderRadius: 6,
                      border: '2px solid #ccc',
                      fontWeight: 'bold',
                    }}
                  >
                    <option value="1">1年</option>
                    <option value="2">2年</option>
                    <option value="3">3年</option>
                  </select>

                  <select
                    id="new-class-class"
                    value={newClassNum}
                    disabled={!isOnline}
                    onChange={(e) => setNewClassNum(e.target.value)}
                    style={{
                      flex: 1,
                      padding: 10,
                      borderRadius: 6,
                      border: '2px solid #ccc',
                      fontWeight: 'bold',
                    }}
                  >
                    {Array.from({ length: 9 }, (_, i) => (
                      <option key={i + 1} value={String(i + 1)}>
                        {i + 1}組
                      </option>
                    ))}
                  </select>

                  <select
                    id="new-class-school"
                    value={newSchool}
                    disabled={!isOnline}
                    onChange={(e) => setNewSchool(e.target.value)}
                    style={{
                      flex: 1,
                      padding: 10,
                      borderRadius: 6,
                      border: '2px solid #ccc',
                      fontWeight: 'bold',
                    }}
                  >
                    <option value="iss">iss</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={!isOnline}
                  className="new-class-btn"
                  style={{ width: '100%', padding: '12px 20px', cursor: isOnline ? 'pointer' : 'not-allowed' }}
                >
                  作成
                </button>
              </form>
            </div>

            {canCancel && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ marginTop: 20 }}
                onClick={onClose}
              >
                キャンセル
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
