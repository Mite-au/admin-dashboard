'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, MoreVertical } from 'lucide-react';
import { DetailTabs } from '@/components/DetailTabs';
import { StatusBadge } from '@/components/StatusBadge';
import { Pagination } from '@/components/Pagination';
import { formatDate, formatNumber } from '@/lib/format';
import { updateThreadStatus } from '@/lib/actions';
import type { AdminThreadDetail, ThreadAdminStatus } from '@/lib/types';

type TabKey = 'messages' | 'reports' | 'logs';
const MUTABLE_THREAD_STATUSES = ['active', 'flagged', 'archived', 'hidden'] as const;
const MUTABLE_THREAD_STATUS_SET = new Set<string>(MUTABLE_THREAD_STATUSES);
const THREAD_STATUS_LABELS: Record<MutableThreadStatus, string> = {
  active: 'Active',
  flagged: 'Flagged',
  archived: 'Archived',
  hidden: 'Hidden',
};
type MutableThreadStatus = (typeof MUTABLE_THREAD_STATUSES)[number];

function isMutableThreadStatus(value: string): value is MutableThreadStatus {
  return MUTABLE_THREAD_STATUS_SET.has(value);
}

export function ThreadDetailClient({ thread }: { thread: AdminThreadDetail }) {
  const [tab, setTab] = useState<TabKey>('messages');

  return (
    <div className="px-8 pb-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
      <section className="card-inner lg:col-span-5 p-6 space-y-6">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-500">Thread</p>
          <h2 className="text-lg font-semibold text-ink-900">{thread.name}</h2>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
          <MetaField label="Thread ID" value={thread.id} />
          <MetaField label="Name" value={thread.name} />
          <MetaField label="Type">
            <span className="capitalize">{thread.type}</span>
          </MetaField>
          <MetaField label="Admin status">
            <ThreadStatusDropdown threadId={thread.id} value={thread.status} />
          </MetaField>
          <MetaField label="Current status">
            <StatusBadge status={thread.status} />
          </MetaField>
          <MetaField label="Participants" value={formatNumber(thread.memberCount)} />
          <MetaField label="Message count" value={formatNumber(thread.messageCount)} />
          <MetaField label="Created" value={formatDate(thread.createdAt)} />
          {thread.slug && <MetaField label="Slug" value={thread.slug} />}
          {thread.lastActiveAt && (
            <MetaField label="Last active" value={formatDate(thread.lastActiveAt)} />
          )}
        </dl>

        {thread.description && (
          <div className="rounded-xl border border-ink-200 p-4 space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
              Description
            </p>
            <p className="text-sm text-ink-900 whitespace-pre-wrap">{thread.description}</p>
          </div>
        )}

        <div className="rounded-xl border border-ink-200 p-4 space-y-3">
          <p className="text-sm font-medium text-ink-900">Thread summary</p>
          <p className="text-sm text-ink-700">
            {formatNumber(thread.memberCount)} participants and {formatNumber(thread.messageCount)}{' '}
            messages are currently associated with this thread.
          </p>
          <Link href="/threads" className="btn btn-pill-dark px-5 py-2 justify-center">
            Back to threads
          </Link>
        </div>
      </section>

      <section className="card-inner lg:col-span-7 p-6 flex flex-col">
        <DetailTabs
          active={tab}
          onChange={(k) => setTab(k as TabKey)}
          tabs={[
            { key: 'messages', label: 'Messages', count: thread.messageCount },
            { key: 'reports', label: 'Reports' },
            { key: 'logs', label: 'Logs' },
          ]}
        />

        <div className="pt-5 flex-1">
          <EmptyTab label="Thread activity" />
        </div>

        <Pagination page={1} totalPages={1} />
      </section>
    </div>
  );
}

function ThreadStatusDropdown({
  threadId,
  value,
}: {
  threadId: string;
  value: ThreadAdminStatus;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleChange = async (newStatus: string) => {
    if (newStatus === value || isPending) return;
    if (!isMutableThreadStatus(newStatus)) {
      alert('Invalid status');
      return;
    }
    setIsPending(true);
    try {
      await updateThreadStatus(threadId, newStatus);
      router.refresh();
    } catch (err) {
      alert(`Status update failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <select
        className="inline-flex items-center rounded-full border border-ink-200 bg-white pl-4 pr-8 py-1.5 text-sm appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        value={value}
        disabled={isPending}
        onChange={(e) => handleChange(e.target.value)}
      >
        {MUTABLE_THREAD_STATUSES.map((status) => (
          <option key={status} value={status}>
            {THREAD_STATUS_LABELS[status]}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-500"
      />
      {isPending && <span className="ml-2 text-[11px] text-ink-500">Saving…</span>}
    </div>
  );
}

function MetaField({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-ink-500">{label}</dt>
      <dd className="mt-1 text-ink-900">{children ?? value}</dd>
    </div>
  );
}

function EmptyTab({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-ink-500 text-sm">
      <MoreVertical size={20} className="mb-2 opacity-40" />
      {label} is not wired up yet.
    </div>
  );
}
