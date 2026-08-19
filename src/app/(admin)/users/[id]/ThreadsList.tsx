'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { ChevronRight, Users } from 'lucide-react';
import { EmptyState } from '@/components/ui';
import { formatDateTime, formatNumber, formatRelative } from '@/lib/format';
import {
  getThreadInterestKey,
  getThreadModelLabel,
  getThreadRegionCode,
  splitThreadName,
} from '@/lib/threadModel';
import type { AdminUserThread } from '@/lib/types';
import { TableScroll } from './ActivityChrome';

/** Community threads this member has joined. */
export function ThreadsList({ threads }: { threads: AdminUserThread[] }) {
  const router = useRouter();

  if (threads.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Not in any threads"
        description="This member has not joined a suburb or interest thread yet."
      />
    );
  }

  const openRow = (e: React.MouseEvent<HTMLTableRowElement>, id: string) => {
    if ((e.target as HTMLElement).closest('a, button')) return;
    router.push(`/threads/${id}`);
  };

  return (
    <TableScroll>
      <table className="data-table">
        <thead>
          <tr>
            <th>Thread</th>
            <th>Model</th>
            <th>Region</th>
            <th>Interest</th>
            <th className="text-right">Members</th>
            <th>Last active</th>
            <th className="w-10" aria-label="Open" />
          </tr>
        </thead>
        <tbody>
          {threads.map((thread) => {
            const { topicName, regionName } = splitThreadName(thread.name);
            return (
              <tr
                key={thread.id}
                onClick={(e) => openRow(e, thread.id)}
                className="group cursor-pointer"
              >
                <td className="max-w-[14rem] truncate">
                  <Link href={`/threads/${thread.id}`} className="rounded-sm group-hover:underline">
                    {topicName || `Thread ${thread.id}`}
                  </Link>
                </td>
                <td>
                  <ThreadModelChip thread={thread} />
                </td>
                <td>{regionName || getThreadRegionCode(thread) || '—'}</td>
                <td>{getThreadInterestKey(thread) || '—'}</td>
                <td className="tnum text-right text-ink-900">
                  {formatNumber(thread.memberCount)}
                </td>
                <td title={formatDateTime(thread.lastActiveAt)}>
                  {formatRelative(thread.lastActiveAt)}
                </td>
                <td className="w-10 text-right">
                  <ChevronRight
                    size={16}
                    strokeWidth={2}
                    aria-hidden="true"
                    className="inline-block text-ink-300 transition-colors group-hover:text-ink-600"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </TableScroll>
  );
}

/**
 * Which thread model a row belongs to. Only "Legacy" gets a tint — it means
 * the row doesn't match either supported shape, which is a data issue worth
 * noticing. The two healthy models are peers and stay neutral.
 */
function ThreadModelChip({ thread }: { thread: AdminUserThread }) {
  const label = getThreadModelLabel(thread);
  const isLegacy = label === 'Legacy';

  return (
    <span
      className={clsx(
        'inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-2xs font-semibold',
        isLegacy ? 'bg-warning-50 text-warning-700' : 'bg-ink-100 text-ink-700',
      )}
    >
      {label}
    </span>
  );
}
