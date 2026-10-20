'use client';

import React from 'react';

interface HeaderProps {
  currentClass: string;
  isRefreshing: boolean;
  onOpenClassSelect: () => void;
  onRefresh: () => void;
  onOpenAddModal: () => void;
  proxyConnected?: boolean;
}

export default function Header({
  currentClass,
  isRefreshing,
  onOpenClassSelect,
  onRefresh,
  onOpenAddModal,
  proxyConnected = true,
}: HeaderProps) {
  return (
    <header className="app-header">
      <div
        className="menu-label"
        role="button"
        tabIndex={0}
        onClick={onOpenClassSelect}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpenClassSelect();
          }
        }}
        id="header-class-name"
        title="クリックしてクラスを切り替え"
      >
        {currentClass || '未設定'}
        <br />
        課題リスト
      </div>

      <button
        type="button"
        className="refresh-btn"
        onClick={onRefresh}
        title="データ更新"
        aria-label="課題リストを最新状態に更新"
      >
        <span className={`refresh-icon ${isRefreshing ? 'spinning' : ''}`}>
          🔄
        </span>
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <button
          type="button"
          className="add-btn"
          onClick={onOpenAddModal}
        >
          新たな課題の追加
        </button>
        <div
          style={{
            fontSize: '0.75rem',
            backgroundColor: proxyConnected ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.25)',
            border: `1px solid ${proxyConnected ? '#22c55e' : '#ef4444'}`,
            color: '#fff',
            borderRadius: 12,
            padding: '2px 8px',
            fontWeight: 'bold',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
          title="GASフィルタリングを自動回避するAI Studioサーバープロキシ経由で通信しています"
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: proxyConnected ? '#4ade80' : '#f87171',
            }}
          />
          Server Proxy 経由
        </div>
      </div>
    </header>
  );
}
