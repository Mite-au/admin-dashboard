'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateUserStatusResult } from '@/lib/actions';
import type { UserStatus } from '@/lib/types';

const MUTABLE_USER_STATUSES = ['active', 'suspended', 'pending_profile'] as const;
const MUTABLE_USER_STATUS_SET = new Set<string>(MUTABLE_USER_STATUSES);
type MutableUserStatus = (typeof MUTABLE_USER_STATUSES)[number];

function isMutableUserStatus(value: string): value is MutableUserStatus {
  return MUTABLE_USER_STATUS_SET.has(value);
}

const TERMINAL_COPY: Partial<Record<UserStatus, string>> = {
  banned:
    'Banned by an active penalty. Lifting it in the card below returns the account to the status it had before the ban.',
  deleted: 'This account has been deleted and can no longer be changed.',
  pending_deletion:
    'This account has requested deletion and is waiting on the deletion pipeline. Its status is not editable from here.',
};

/**
 * Activate / suspend the account.
 *
 * `banned`, `deleted` and `pending_deletion` are terminal from here: a ban is
 * written by the penalty endpoint, and both deletion states by the account
 * pipeline. `PATCH /admin/users/:id/status` accepts only
 * active / suspended / deleted / pending_profile, so the control turns into a
 * sentence explaining where the state came from rather than a select that
 * would fail on submit — or, worse, a select whose current value has no
 * matching option and silently displays the first one.
 *
 * Failure is rendered next to the select instead of thrown, because a thrown
 * Server Action error reaches production as an opaque digest — the backend's
 * actual complaint ("account is under an active penalty") is the whole point.
 */
export function UserStatusControl({
  userId,
  status,
}: {
  userId: string;
  status: UserStatus;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const terminalCopy = TERMINAL_COPY[status];
  if (terminalCopy) {
    return (
      <div className="mt-4 rounded-control border border-ink-200 bg-ink-50 px-3 py-2.5">
        <p className="label-micro">Account status</p>
        <p className="mt-1 text-data text-ink-700">{terminalCopy}</p>
      </div>
    );
  }

  const handleChange = (next: string) => {
    if (next === status || isPending) return;
    if (!isMutableUserStatus(next)) {
      setError('That status cannot be set from this screen.');
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await updateUserStatusResult(userId, next);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="mt-4">
      <label htmlFor="user-status" className="label-micro mb-1.5 block">
        Account status
      </label>
      <select
        id="user-status"
        className="pill-select"
        value={status}
        disabled={isPending}
        onChange={(e) => handleChange(e.target.value)}
      >
        <option value="active">Active</option>
        <option value="suspended">Suspended</option>
        {status === 'pending_profile' && (
          <option value="pending_profile">Pending profile</option>
        )}
      </select>

      {isPending && <p className="mt-1.5 text-2xs text-ink-500">Saving…</p>}

      {error && (
        <p role="alert" className="mt-1.5 text-2xs font-medium leading-relaxed text-danger-700">
          {error}
        </p>
      )}
    </div>
  );
}
