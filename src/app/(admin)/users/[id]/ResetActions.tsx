'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ImageMinus, KeyRound } from 'lucide-react';
import { ConfirmModal } from '@/components/ConfirmModal';
import { resetUserAvatarResult, resetUserPasswordResult } from '@/lib/actions';

type ResetTarget = 'password' | 'avatar';

type ResetCopy = {
  title: string;
  body: string;
  note: string;
  confirmLabel: string;
};

const RESET_COPY: Record<ResetTarget, ResetCopy> = {
  password: {
    title: 'Reset this member’s password?',
    body: 'They will have to set a new password before they can sign in again.',
    note: 'Applies immediately and cannot be undone.',
    confirmLabel: 'Reset password',
  },
  avatar: {
    title: 'Reset this member’s profile photo?',
    body: 'The current photo is removed and the account falls back to the default avatar.',
    note: 'Applies immediately and cannot be undone.',
    confirmLabel: 'Reset photo',
  },
};

/**
 * The two support resets, both irreversible and both confirmed.
 *
 * A failure keeps the dialog open with the backend's message inside it, so the
 * complaint stays attached to the button that caused it and a retry is one
 * click away. The dialog closes only once the reset actually succeeded.
 */
export function ResetActions({ userId }: { userId: string }) {
  const router = useRouter();
  const [target, setTarget] = useState<ResetTarget | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const openDialog = (next: ResetTarget) => {
    setError(null);
    setTarget(next);
  };

  const closeDialog = () => {
    if (isPending) return;
    setTarget(null);
    setError(null);
  };

  const handleConfirm = () => {
    if (!target || isPending) return;
    const pending = target;
    // Clear first: on a retry the previous failure must not linger next to a
    // request that is still in flight.
    setError(null);

    startTransition(async () => {
      const result =
        pending === 'password'
          ? await resetUserPasswordResult(userId)
          : await resetUserAvatarResult(userId);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setTarget(null);
      router.refresh();
    });
  };

  const copy = target ? RESET_COPY[target] : null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => openDialog('password')}
          disabled={isPending}
          className="btn-icon"
        >
          <KeyRound size={14} strokeWidth={1.9} aria-hidden="true" />
          Reset password
        </button>
        <button
          type="button"
          onClick={() => openDialog('avatar')}
          disabled={isPending}
          className="btn-icon"
        >
          <ImageMinus size={14} strokeWidth={1.9} aria-hidden="true" />
          Reset photo
        </button>
      </div>

      {copy && (
        <ConfirmModal
          open
          title={copy.title}
          body={copy.body}
          note={copy.note}
          confirmLabel={copy.confirmLabel}
          pendingLabel="Resetting…"
          isPending={isPending}
          error={error ?? undefined}
          onConfirm={handleConfirm}
          onClose={closeDialog}
        />
      )}
    </>
  );
}
