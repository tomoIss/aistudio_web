'use client';

import React, { useState } from 'react';

interface UsernameModalProps {
  isOpen: boolean;
  onSave: (username: string) => void;
}

export default function UsernameModal({ isOpen, onSave }: UsernameModalProps) {
  const [grade, setGrade] = useState('1');
  const [cls, setCls] = useState('1');
  const [attendance, setAttendance] = useState('01');
  const [school, setSchool] = useState('iss');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const generatedUsername = `${grade}${cls}${attendance}${school}`;
    onSave(generatedUsername);
  };

  const attendanceNumbers = Array.from({ length: 42 }, (_, i) =>
    String(i + 1).padStart(2, '0')
  );

  return (
    <div
      id="username-init-modal"
      className="app-modal"
      style={{ zIndex: 2000, backgroundColor: 'rgba(0,0,0,0.85)' }}
    >
      <div
        className="modal-content-card"
        style={{
          maxWidth: 380,
          textAlign: 'center',
          backgroundColor: '#1f2937',
          color: '#fff',
          borderColor: '#4b5563',
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: '1.4rem', color: '#60a5fa', fontWeight: 900 }}>
          初期設定
        </h2>
        <p style={{ fontSize: '0.92rem', marginBottom: 22, color: '#d1d5db' }}>
          あなたのクラス・出席番号を選択してください。
        </p>

        <form onSubmit={handleSubmit}>
          {/* 学年・クラスの選択 */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, textAlign: 'left' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 6, color: '#9ca3af', fontWeight: 'bold' }}>
                学年
              </label>
              <select
                id="init-grade"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                style={{
                  width: '100%',
                  padding: 10,
                  borderRadius: 6,
                  background: '#374151',
                  color: '#fff',
                  border: '1px solid #4b5563',
                  fontSize: '1rem',
                }}
              >
                <option value="1">1年</option>
                <option value="2">2年</option>
                <option value="3">3年</option>
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 6, color: '#9ca3af', fontWeight: 'bold' }}>
                クラス
              </label>
              <select
                id="init-class"
                value={cls}
                onChange={(e) => setCls(e.target.value)}
                style={{
                  width: '100%',
                  padding: 10,
                  borderRadius: 6,
                  background: '#374151',
                  color: '#fff',
                  border: '1px solid #4b5563',
                  fontSize: '1rem',
                }}
              >
                {Array.from({ length: 9 }, (_, i) => (
                  <option key={i + 1} value={String(i + 1)}>
                    {i + 1}組
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 出席番号の選択（01〜42） */}
          <div style={{ textAlign: 'left', marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 6, color: '#9ca3af', fontWeight: 'bold' }}>
              出席番号
            </label>
            <select
              id="init-attendance"
              value={attendance}
              onChange={(e) => setAttendance(e.target.value)}
              style={{
                width: '100%',
                padding: 10,
                borderRadius: 6,
                background: '#374151',
                color: '#fff',
                border: '1px solid #4b5563',
                fontSize: '1rem',
              }}
            >
              {attendanceNumbers.map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
          </div>

          {/* 学校コードの選択 */}
          <div style={{ textAlign: 'left', marginBottom: 25 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 6, color: '#9ca3af', fontWeight: 'bold' }}>
              学校コード
            </label>
            <select
              id="init-school"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              style={{
                width: '100%',
                padding: 10,
                borderRadius: 6,
                background: '#374151',
                color: '#fff',
                border: '1px solid #4b5563',
                fontSize: '1rem',
              }}
            >
              <option value="iss">iss</option>
            </select>
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px 20px',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 900,
              fontSize: '1.05rem',
              cursor: 'pointer',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
              transition: 'background-color 0.15s',
            }}
          >
            設定を完了する
          </button>
        </form>
      </div>
    </div>
  );
}
