'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Copy } from 'lucide-react';
import { ConfirmModal } from '@/components/ConfirmModal';
import { StatusBadge } from '@/components/StatusBadge';
import { updatePostStatusResult } from '@/lib/actions';
import type { AdminPost, PostStatus } from '@/lib/types';

type ActionVariant = 'primary' | 'secondary' | 'danger';

type PostAction = {
  label: string;
  status: PostStatus;
  variant: ActionVariant;
  show: (current: PostStatus) => boolean;
};

const POST_ACTIONS: PostAction[] = [
  {
    label: 'Publish',
    status: 'published',
    variant: 'primary',
    show: (s) => s !== 'published',
  },
  {
    label: 'Pause',
    status: 'paused',
    variant: 'secondary',
    show: (s) => s === 'published',
  },
  {
    label: 'Archive',
    status: 'archived',
    variant: 'secondary',
    show: (s) => s !== 'archived' && s !== 'deleted',
  },
  {
    label: 'Delete',
    status: 'deleted',
    variant: 'danger',
    show: (s) => s !== 'deleted',
  },
];

type ModalConfig = {
  title: string;
  body: string;
  note: string;
  variant: 'default' | 'danger';
  confirmLabel: string;
};

const CONFIRM_REQUIRED = new Set<PostStatus>(['paused', 'archived', 'deleted']);

/** Each confirm label repeats the button that opened it, so the action keeps
 *  the same name from the trigger through to the confirmation. */
const MODAL_CONFIG: Record<string, ModalConfig> = {
  paused: {
    title: 'Pause this listing?',
    body: 'It stops showing in search and browse until someone publishes it again.',
    note: 'The status updates as soon as the change saves.',
    variant: 'default',
    confirmLabel: 'Pause listing',
  },
  archived: {
    title: 'Archive this listing?',
    body: 'It comes off the marketplace and moves to the seller’s archive. You can publish it again later.',
    note: 'The status updates as soon as the change saves.',
    variant: 'default',
    confirmLabel: 'Archive listing',
  },
  deleted: {
    title: 'Delete this listing?',
    body: 'This takes the listing off the marketplace for good.',
    note: 'The status updates as soon as the change saves.',
    variant: 'danger',
    confirmLabel: 'Delete listing',
  },
};

const VARIANT_CLASS: Record<ActionVariant, string> = {
  primary: 'btn btn-pill-dark w-full',
  secondary: 'btn btn-pill-ghost w-full',
  danger:
    'btn w-full rounded-full border border-danger-100 bg-white px-5 py-2 font-medium text-danger-700 hover:border-danger-500 hover:bg-danger-50',
};

export function ListingActionsCard({ post }: { post: AdminPost }) {
  const router = useRouter();
  const [pendingStatus, setPendingStatus] = useState<PostStatus | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<PostStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const executeStatusChange = async (next: PostStatus) => {
    if (pendingStatus !== null || next === post.status) return;
    setPendingStatus(next);
    setError(null);

    // Deliberately NOT wrapped in try/catch. The Result variant reports
    // backend failures in its return value, so the only thing it throws is
    // Next's redirect signal — catching that would swallow the navigation.
    // The throwing `updatePostStatus` used to surface as an opaque digest in
    // production instead of the backend's actual message.
    const result = await updatePostStatusResult(post.id, next);
    setPendingStatus(null);

    if (!result.ok) {
      // Leave the modal open so the failure is attached to the action that
      // caused it, rather than closing and stranding the message behind it.
      setError(result.error);
      return;
    }

    setConfirmTarget(null);
    router.refresh();
  };

  const handleActionClick = (next: PostStatus) => {
    setError(null);
    if (CONFIRM_REQUIRED.has(next)) {
      setConfirmTarget(next);
    } else {
      executeStatusChange(next);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(post.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — fail silently
    }
  };

  const visibleActions = POST_ACTIONS.filter((a) => a.show(post.status));
  const modalConfig = confirmTarget ? MODAL_CONFIG[confirmTarget] : null;

  return (
    <>
      <section className="card-inner space-y-5 p-5">
        {/* ── Listing status ──────────────────────────────────────────────── */}
        <div>
          <p className="label-micro mb-3">Listing Status</p>
          <div className="mb-4">
            <StatusBadge status={post.status} />
          </div>
          <div className="flex flex-col gap-2">
            {visibleActions.map((action) => (
              <button
                key={action.status}
                type="button"
                disabled={pendingStatus !== null}
                onClick={() => handleActionClick(action.status)}
                className={VARIANT_CLASS[action.variant]}
              >
                {pendingStatus === action.status ? 'Saving…' : action.label}
              </button>
            ))}
          </div>
          {/* When a confirm modal is open the error renders inside it, so it
              is never shown in two places at once. */}
          {error && !confirmTarget && (
            <p role="alert" className="mt-2 text-xs text-danger-700">
              {error}
            </p>
          )}
        </div>

        {/* ── Quick actions ───────────────────────────────────────────────── */}
        <div className="space-y-2 border-t border-ink-100 pt-5">
          <p className="label-micro mb-3">Quick Actions</p>
          <button
            type="button"
            onClick={handleCopy}
            className="btn btn-pill-ghost w-full justify-start"
          >
            {copied ? (
              <Check size={14} strokeWidth={2.2} className="shrink-0 text-success-700" />
            ) : (
              <Copy size={14} strokeWidth={1.9} className="shrink-0 text-ink-400" />
            )}
            <span className="tnum truncate">
              {copied ? 'Copied' : `Copy ID  i${post.id}`}
            </span>
          </button>
          {/* Anonymised accounts come back with no seller at all, so the
              listing can outlive the account that posted it. */}
          {post.seller ? (
            <Link
              href={`/users/${post.seller.id}`}
              className="btn btn-pill-ghost w-full justify-center"
            >
              View seller
            </Link>
          ) : (
            <p className="rounded-full border border-dashed border-ink-200 px-5 py-2 text-center text-data text-ink-400">
              Seller account removed
            </p>
          )}
          <Link
            href="/trust-safety?targetType=post"
            className="btn btn-pill-ghost w-full justify-center"
          >
            View post reports
          </Link>
        </div>
      </section>

      {modalConfig && confirmTarget && (
        <ConfirmModal
          open={true}
          title={modalConfig.title}
          body={modalConfig.body}
          note={modalConfig.note}
          variant={modalConfig.variant}
          confirmLabel={modalConfig.confirmLabel}
          isPending={pendingStatus === confirmTarget}
          pendingLabel="Saving…"
          error={error ?? undefined}
          onConfirm={() => executeStatusChange(confirmTarget)}
          onClose={() => {
            if (pendingStatus === null) {
              setConfirmTarget(null);
              setError(null);
            }
          }}
        />
      )}
    </>
  );
}
