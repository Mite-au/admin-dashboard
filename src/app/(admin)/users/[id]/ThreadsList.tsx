'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, Users } from 'lucide-react';
import { EmptyState } from '@/components/ui';
import { formatDateTime, formatNumber, formatRelative } from '@/lib/format';
import { formatThreadType, splitThreadName } from '@/lib/threadModel';
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
            <th>Region</th>
            <th>Type</th>
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
                {/* `/admin/users/:id/threads` sends no region code, so the
                    region is whatever the "<Region> > <Topic>" name carries. */}
                <td>{regionName || '—'}</td>
                <td>{formatThreadType(thread.type)}</td>
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
