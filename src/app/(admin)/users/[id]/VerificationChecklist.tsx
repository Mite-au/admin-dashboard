'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { CircleCheck, CircleDashed } from 'lucide-react';
import {
  updateContactVerificationResult,
  updateSuburbVerificationResult,
} from '@/lib/actions';
import { boolOrNull } from '@/lib/guards';
import type { ActionResult, AdminUser } from '@/lib/types';

/**
 * The three channels an account can be trusted through, as one checklist.
 *
 * Each row is an admin override: the support path when a member can no longer
 * receive their own OTP, and how a test account gets a verified channel
 * without a real inbox or SIM. There is nothing to verify without an address,
 * number, or suburb on file — the backend rejects it — so the button is
 * withheld in that case and the row states what is missing instead.
 */
export function VerificationChecklist({ user }: { user: AdminUser }) {
  return (
    <ul className="divide-y divide-ink-100">
      <VerificationRow
        label="Email"
        value={user.email}
        verified={Boolean(user.emailVerified)}
        missingLabel="No email on file"
        onToggle={(next) => updateContactVerificationResult(user.id, 'email', next)}
      />
      <VerificationRow
        label="Phone"
        value={user.phone}
        verified={Boolean(user.phoneVerified)}
        missingLabel="No phone number on file"
        onToggle={(next) => updateContactVerificationResult(user.id, 'phone', next)}
      />
      {/* `suburbVerified` is tri-state: null means the profile has no suburb
          at all, which is not the same claim as "has one, not yet verified".
          Collapsing it with Boolean() showed those accounts as unverified. */}
      <VerificationRow
        label="Suburb"
        value={user.suburb}
        verified={boolOrNull(user.suburbVerified)}
        unknownLabel="No suburb"
        missingLabel="No suburb set"
        onToggle={(next) => updateSuburbVerificationResult(user.id, next)}
      />
    </ul>
  );
}

function VerificationRow({
  label,
  value,
  verified,
  missingLabel,
  unknownLabel,
  onToggle,
}: {
  label: string;
  value?: string | null;
  /** `null` = the backend has nothing to verify against, which is distinct
   *  from a `false` that means "on file, not yet verified". */
  verified: boolean | null;
  missingLabel: string;
  unknownLabel?: string;
  onToggle: (next: boolean) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Nothing to toggle when the channel is missing or the flag is unknown —
  // the backend rejects both, so the button is withheld rather than offered
  // and then failed.
  const onFile = Boolean(value) && verified !== null;
  const Icon = verified === true ? CircleCheck : CircleDashed;
  const stateLabel =
    verified === null
      ? (unknownLabel ?? 'Not recorded')
      : !onFile
        ? 'Nothing to verify'
        : verified
          ? 'Verified'
          : 'Not verified';

  const handleClick = () => {
    if (isPending) return;
    setError(null);
    startTransition(async () => {
      const result = await onToggle(!verified);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <li className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
      <Icon
        size={16}
        strokeWidth={2}
        aria-hidden="true"
        className={clsx('mt-0.5 shrink-0', verified === true ? 'text-success-700' : 'text-ink-300')}
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2">
          <span className="label-micro">{label}</span>
          <span
            className={clsx(
              'text-2xs font-semibold',
              !onFile ? 'text-ink-400' : verified ? 'text-success-700' : 'text-warning-700',
            )}
          >
            {stateLabel}
          </span>
        </div>

        <p className="mt-0.5 break-words text-data text-ink-900">{value || missingLabel}</p>

        {error && (
          <p
            role="alert"
            className="mt-1.5 text-2xs font-medium leading-relaxed text-danger-700"
          >
            {error}
          </p>
        )}
      </div>

      {onFile && (
        <button
          type="button"
          onClick={handleClick}
          disabled={isPending}
          className="btn-icon shrink-0"
        >
          {isPending ? 'Saving…' : verified ? 'Unverify' : 'Verify'}
        </button>
      )}
    </li>
  );
}
