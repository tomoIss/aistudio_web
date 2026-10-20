'use client';

import React from 'react';

interface NativePopupProps {
  isOpen: boolean;
  message: string;
  type?: 'alert' | 'confirm';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

export default function NativePopup({
  isOpen,
  message,
  type = 'alert',
  confirmText = 'OK',
  cancelText = 'キャンセル',
  onConfirm,
  onCancel,
  onClose,
}: NativePopupProps) {
  if (!isOpen) return null;

  return (
    <div
      className="native-popup-overlay"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      <div className="native-popup-card">
        <div className="native-popup-message">{message}</div>
        <div className="native-popup-actions">
          {type === 'confirm' ? (
            <>
              <button
                type="button"
                className="native-popup-btn cancel"
                onClick={onCancel || onClose}
              >
                {cancelText}
              </button>
              <button
                type="button"
                className="native-popup-btn"
                onClick={onConfirm}
              >
                {confirmText}
              </button>
            </>
          ) : (
            <button
              type="button"
              className="native-popup-btn"
              onClick={onClose || onConfirm}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
