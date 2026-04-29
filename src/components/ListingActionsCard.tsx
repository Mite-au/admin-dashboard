'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Copy } from 'lucide-react';
import { ConfirmModal } from '@/components/ConfirmModal';
import { StatusBadge } from '@/components/StatusBadge';
import { updatePostStatus } from '@/lib/actions';
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

const MODAL_CONFIG: Record<string, ModalConfig> = {
  paused: {
    title: '아이템이 일시중지 됩니다',
    body: '일시중지하시겠습니까?',
    note: '처리 완료 후 status에 반영됩니다.',
    variant: 'default',
    confirmLabel: '일시중지',
  },
  archived: {
    title: '아이템이 숨김처리 됩니다',
    body: '숨김처리하시겠습니까?',
    note: '처리 완료 후 status에 반영됩니다.',
    variant: 'default',
    confirmLabel: '숨김처리',
  },
  deleted: {
    title: '아이템이 삭제처리 됩니다',
    body: '정말 삭제하시겠습니까?',
    note: '처리 완료 후 status에 반영됩니다.',
    variant: 'danger',
    confirmLabel: '삭제',
  },
};

const VARIANT_CLASS: Record<ActionVariant, string> = {
  primary:
    'w-full rounded-full bg-ink-900 px-4 py-2 text-sm text-center text-white hover:bg-ink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
  secondary:
    'w-full rounded-full border border-ink-200 px-4 py-2 text-sm text-center text-ink-700 hover:bg-ink-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
  danger:
    'w-full rounded-full border border-red-200 px-4 py-2 text-sm text-center text-danger hover:bg-pink-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
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
    try {
      await updatePostStatus(post.id, next);
      setConfirmTarget(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Status update failed.');
    } finally {
      setPendingStatus(null);
    }
  };

  const handleActionClick = (next: PostStatus) => {
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
      <section className="card-inner p-6 space-y-5">
        {/* ── Listing status ──────────────────────────────────────────────── */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-500 mb-3">
            Listing Status
          </p>
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
          {error && <p className="mt-2 text-xs text-danger">{error}</p>}
        </div>

        {/* ── Quick actions ───────────────────────────────────────────────── */}
        <div className="border-t border-ink-100 pt-5 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-500 mb-3">
            Quick Actions
          </p>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-2 w-full rounded-full border border-ink-200 px-4 py-2 text-sm text-ink-700 hover:bg-ink-50 transition-colors"
          >
            {copied ? (
              <Check size={14} className="shrink-0 text-success" />
            ) : (
              <Copy size={14} className="shrink-0" />
            )}
            <span className="truncate">
              {copied ? 'Copied!' : `Copy ID  i${post.id}`}
            </span>
          </button>
          <Link
            href={`/users/${post.seller.id}`}
            className="flex items-center justify-center w-full rounded-full border border-ink-200 px-4 py-2 text-sm text-ink-700 hover:bg-ink-50 transition-colors"
          >
            View seller
          </Link>
          <Link
            href="/trust-safety?targetType=post"
            className="flex items-center justify-center w-full rounded-full border border-ink-200 px-4 py-2 text-sm text-ink-700 hover:bg-ink-50 transition-colors"
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
          onConfirm={() => executeStatusChange(confirmTarget)}
          onClose={() => {
            if (pendingStatus === null) setConfirmTarget(null);
          }}
        />
      )}
    </>
  );
}
