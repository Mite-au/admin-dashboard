'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, MessageSquareText, Users } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, EmptyState, StatCard } from '@/components/ui';
import {
  formatDate,
  formatDateTime,
  formatNumber,
  formatRelative,
  isImageSrc,
} from '@/lib/format';
import {
  formatThreadType,
  getThreadInterestKey,
  getThreadRegionCode,
  getThreadSuburbCode,
  splitThreadName,
} from '@/lib/threadModel';
import { updateThreadStatusResult } from '@/lib/actions';
import type { AdminThreadDetail, ThreadAdminStatus } from '@/lib/types';
import { CodeChip, ThreadModelChip } from '../ThreadChips';

const MUTABLE_THREAD_STATUSES = ['active', 'flagged', 'archived', 'hidden'] as const;
type MutableThreadStatus = (typeof MUTABLE_THREAD_STATUSES)[number];

const THREAD_STATUS_LABELS: Record<MutableThreadStatus, string> = {
  active: 'Active',
  flagged: 'Flagged',
  archived: 'Archived',
  hidden: 'Hidden',
};

const MUTABLE_THREAD_STATUS_SET = new Set<string>(MUTABLE_THREAD_STATUSES);

function isMutableThreadStatus(value: string): value is MutableThreadStatus {
  return MUTABLE_THREAD_STATUS_SET.has(value);
}

export function ThreadDetailClient({ thread }: { thread: AdminThreadDetail }) {
  const regionCode = getThreadRegionCode(thread);
  const suburbCode = getThreadSuburbCode(thread);
  const interestKey = getThreadInterestKey(thread);
  const { regionName } = splitThreadName(thread.name);
  const coverImage = thread.coverImage ?? thread.cover_image ?? null;

  return (
    <div className="space-y-6 px-8 pb-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Members" value={formatNumber(thread.memberCount)} />
        <StatCard label="Messages" value={formatNumber(thread.messageCount)} />
        <StatCard
          label="Last active"
          value={thread.lastActiveAt ? formatRelative(thread.lastActiveAt) : '—'}
          hint={
            thread.lastActiveAt ? formatDateTime(thread.lastActiveAt) : 'No activity recorded'
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-5">
          <Card title="Identity">
            {isImageSrc(coverImage) && (
              <div className="relative mb-5 aspect-[16/7] w-full overflow-hidden rounded-panel bg-ink-100">
                <Image
                  src={coverImage}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 32rem, 100vw"
                  className="object-cover"
                />
              </div>
            )}

            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <MetaField label="Model">
                <ThreadModelChip thread={thread} />
              </MetaField>
              <MetaField label="Raw type" value={formatThreadType(thread.type)} />
              <MetaField label="Region code">
                <CodeChip value={regionCode} />
              </MetaField>
              <MetaField label="Interest key">
                <CodeChip value={interestKey} />
              </MetaField>
              {suburbCode && (
                <MetaField label="Legacy suburb code">
                  <CodeChip value={suburbCode} />
                </MetaField>
              )}
              <MetaField label="Thread ID">
                <CodeChip value={thread.id} />
              </MetaField>
              {thread.slug && (
                <MetaField label="Slug">
                  <CodeChip value={thread.slug} />
                </MetaField>
              )}
              <MetaField label="Created">
                <span title={formatDateTime(thread.createdAt)}>
                  {formatDate(thread.createdAt)}
                </span>
              </MetaField>
              <MetaField label="Full name" className="sm:col-span-2" value={thread.name} />
            </dl>

            <div className="mt-5 border-t border-ink-100 pt-5">
              <p className="label-micro mb-2">Description</p>
              {thread.description ? (
                <p className="whitespace-pre-wrap text-data leading-relaxed text-ink-700">
                  {thread.description}
                </p>
              ) : (
                <p className="text-data text-ink-400">
                  No description set — members see the thread name only.
                </p>
              )}
            </div>
          </Card>

          <ModerationCard threadId={thread.id} status={thread.status} />
        </div>

        <div className="space-y-6 lg:col-span-7">
          <Card
            title="Members"
            subtitle={`${formatNumber(thread.memberCount)} joined${regionName ? ` from ${regionName}` : ''}`}
          >
            <EmptyState
              icon={Users}
              title="Roster not exposed by the admin API"
              description="The thread returns a member count but not who those members are. To check which threads one person belongs to, filter the thread list by their Member ID."
            />
          </Card>

          <Card
            title="Messages"
            subtitle={`${formatNumber(thread.messageCount)} sent in this thread`}
          >
            <EmptyState
              icon={MessageSquareText}
              title="Message history isn't available here"
              description="Thread contents aren't returned to the admin dashboard. Moderate through the thread's admin status above, or work the reports members have filed."
              action={
                <Link href="/trust-safety" className="btn btn-pill-ghost">
                  Open Trust &amp; Safety
                </Link>
              }
            />
          </Card>
        </div>
      </div>
    </div>
  );
}

/**
 * The one mutation on this page. Failure is shown next to the control that
 * caused it, carrying the backend's own sentence — an admin who just tried to
 * hide a thread needs to know whether it actually happened.
 */
function ModerationCard({
  threadId,
  status,
}: {
  threadId: string;
  status: ThreadAdminStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleChange = (raw: string) => {
    if (raw === status || !isMutableThreadStatus(raw)) return;
    setError(null);
    startTransition(async () => {
      const result = await updateThreadStatusResult(threadId, raw);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <Card title="Moderation" subtitle="Applies immediately across the app.">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="label-micro">Current</span>
          <StatusBadge status={status} />
        </div>
        {isPending && <span className="text-2xs text-ink-500">Saving…</span>}
      </div>

      <div className="mt-4">
        <label htmlFor="thread-admin-status" className="label-micro mb-1.5 block">
          Change status
        </label>
        <select
          id="thread-admin-status"
          className="pill-select max-w-xs"
          value={status}
          disabled={isPending}
          onChange={(e) => handleChange(e.target.value)}
        >
          {MUTABLE_THREAD_STATUSES.map((option) => (
            <option key={option} value={option}>
              {THREAD_STATUS_LABELS[option]}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p role="alert" className="mt-3 flex items-start gap-1.5 text-data text-danger-700">
          <AlertCircle size={14} strokeWidth={2} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </Card>
  );
}

function MetaField({
  label,
  value,
  children,
  className,
}: {
  label: string;
  value?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="label-micro">{label}</dt>
      <dd className="mt-1 break-words text-data text-ink-900">{children ?? value ?? '—'}</dd>
    </div>
  );
}
