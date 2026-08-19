'use client';

import { useEffect, useId, useRef } from 'react';
import clsx from 'clsx';
import { AlertTriangle, CircleAlert } from 'lucide-react';

export interface ConfirmModalProps {
  open: boolean;
  title: string;
  body?: string;
  note?: string;
  variant?: 'default' | 'danger';
  confirmLabel?: string;
  cancelLabel?: string;
  /** Label while the action is in flight. */
  pendingLabel?: string;
  isPending?: boolean;
  /**
   * Failure message for the action this dialog confirms. The modal only
   * renders it — the caller decides to stay open, which is the point: the
   * error stays attached to the action that produced it.
   */
  error?: string;
  onConfirm: () => void;
  onClose: () => void;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function ConfirmModal({
  open,
  title,
  body,
  note,
  variant = 'default',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  pendingLabel = 'Working…',
  isPending = false,
  error,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const bodyId = useId();

  // Escape to dismiss, and Tab cycles inside the dialog rather than escaping
  // to the page behind it. Focus returns to whatever opened the modal.
  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const node = dialogRef.current;
    node?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPending) {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !node) return;

      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, isPending, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 animate-fade-in bg-ink-900/30 backdrop-blur-[3px]"
        onClick={() => {
          if (!isPending) onClose();
        }}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={body ? bodyId : undefined}
        className="relative z-10 w-full max-w-sm animate-pop-in rounded-panel bg-white p-6 shadow-pop"
      >
        {variant === 'danger' && (
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-danger-50">
            <AlertTriangle size={18} strokeWidth={2} className="text-danger-700" />
          </div>
        )}

        <h2 id={titleId} className="text-[0.9375rem] font-bold leading-snug text-ink-900">
          {title}
        </h2>
        {body && (
          <p id={bodyId} className="mt-2 text-data text-ink-700">
            {body}
          </p>
        )}
        {note && <p className="mt-2 text-xs text-ink-500">{note}</p>}

        {error && (
          <p
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-control bg-danger-50 px-3 py-2.5 text-data text-danger-700"
          >
            <CircleAlert size={15} strokeWidth={2} className="mt-px shrink-0" />
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={onClose}
            className="btn btn-pill-ghost"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={onConfirm}
            className={clsx(
              'btn rounded-full px-5 py-2 font-semibold text-white',
              variant === 'danger'
                ? 'bg-danger-700 hover:bg-danger-500 disabled:hover:bg-danger-700'
                : 'bg-ink-900 hover:bg-ink-700 disabled:hover:bg-ink-900',
            )}
          >
            {isPending ? pendingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
