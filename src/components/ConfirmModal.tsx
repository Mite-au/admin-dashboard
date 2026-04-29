'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export interface ConfirmModalProps {
  open: boolean;
  title: string;
  body?: string;
  note?: string;
  variant?: 'default' | 'danger';
  confirmLabel?: string;
  cancelLabel?: string;
  isPending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({
  open,
  title,
  body,
  note,
  variant = 'default',
  confirmLabel = '확인',
  cancelLabel = '취소',
  isPending = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPending) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, isPending, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={() => { if (!isPending) onClose(); }}
      />

      {/* Card */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
      >
        {variant === 'danger' && (
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-pink-50">
            <AlertTriangle size={18} className="text-danger" />
          </div>
        )}

        <h2 className="text-base font-bold text-ink-900 leading-snug">{title}</h2>
        {body && <p className="mt-2 text-sm text-ink-700">{body}</p>}
        {note && <p className="mt-2 text-xs text-ink-500">{note}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            disabled={isPending}
            onClick={onClose}
            className="rounded-full border border-ink-200 px-5 py-2 text-sm text-ink-700 hover:bg-ink-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={onConfirm}
            className={
              variant === 'danger'
                ? 'rounded-full px-5 py-2 text-sm font-medium text-white bg-danger hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                : 'rounded-full px-5 py-2 text-sm font-medium text-white bg-ink-900 hover:bg-ink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            }
          >
            {isPending ? '처리 중...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
