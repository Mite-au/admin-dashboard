'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { setUserPenaltyResult } from '@/lib/actions';
import type { UserStatus } from '@/lib/types';

const REASON_MAX_LENGTH = 500;

/**
 * Apply or lift an account penalty.
 *
 * This is the only ban/unban path there is. `users.status` has no `banned`
 * member and `PATCH /admin/users/:id/status` refuses one — the `banned` status
 * the API reports is derived from `user_penalties.active`, so it can only be
 * changed through `POST /admin/users/:id/penalty`. Until this control existed
 * the status card told admins to "lift the penalty" with nothing on the page
 * that could.
 *
 * The reason is optional on the backend and capped at 500 characters. It is
 * offered on both directions because the audit trail of *why* a ban was lifted
 * matters as much as why it was applied.
 */
export function PenaltyControl({
  userId,
  status,
}: {
  userId: string;
  status: UserStatus;
}) {
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isBanned = status === 'banned';

  const apply = (active: boolean) => {
    if (isPending) return;
    setError(null);
    startTransition(async () => {
      const result = await setUserPenaltyResult(userId, active, reason);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setReason('');
      router.refresh();
    });
  };

  return (
    <div>
      <p className="text-data leading-relaxed text-ink-700">
        {isBanned
          ? 'An active penalty is holding this account at banned. Lifting it restores the status underneath.'
          : 'A penalty bans the account immediately and sends the member a notification. It can be lifted again from here.'}
      </p>

      <div className="mt-4">
        <label htmlFor="penalty-reason" className="label-micro mb-1.5 block">
          Reason {isBanned ? 'for lifting' : ''}
          <span className="ml-1 font-normal normal-case text-ink-400">(optional)</span>
        </label>
        <textarea
          id="penalty-reason"
          className="pill-textarea"
          rows={3}
          maxLength={REASON_MAX_LENGTH}
          disabled={isPending}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={
            isBanned
              ? 'Appeal upheld — listing was genuine.'
              : 'Repeated no-shows after accepted offers.'
          }
        />
        <p className="mt-1 text-2xs text-ink-400">
          Recorded on the penalty for the audit trail. {reason.length}/{REASON_MAX_LENGTH}
        </p>
      </div>

      <button
        type="button"
        disabled={isPending}
        onClick={() => apply(!isBanned)}
        className={
          isBanned
            ? 'btn btn-pill-ghost mt-3 w-full px-5 py-2.5'
            : 'btn mt-3 w-full rounded-full border border-danger-100 px-5 py-2.5 font-semibold text-danger-700 transition-colors hover:border-danger-500 disabled:cursor-not-allowed disabled:opacity-60'
        }
      >
        {isPending
          ? isBanned
            ? 'Lifting…'
            : 'Applying…'
          : isBanned
            ? 'Lift penalty'
            : 'Apply penalty'}
      </button>

      {error && (
        <p
          role="alert"
          className="mt-3 flex items-start gap-1.5 text-2xs font-medium leading-relaxed text-danger-700"
        >
          <AlertCircle size={14} strokeWidth={2} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
