'use client';

import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { ChevronRight, Package, ShieldCheck, UserRound } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/ui';
import { formatDateTime, formatRelative } from '@/lib/format';
import type { AdminReport } from '@/lib/types';
import { TableScroll } from './ActivityChrome';

/** Reports filed against this member, or against what they posted. */
export function ReportsTable({ reports }: { reports: AdminReport[] }) {
  const router = useRouter();

  if (reports.length === 0) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="No reports against this account"
        description="Reports raised by other members about this user or their listings would show up here."
      />
    );
  }

  return (
    <TableScroll>
      <table className="data-table">
        <thead>
          <tr>
            <th>Target</th>
            <th>Report ID</th>
            <th>Type</th>
            <th>Reporter</th>
            <th>Reason</th>
            <th>Opened</th>
            <th className="text-right">Status</th>
            <th className="w-10" aria-label="Open" />
          </tr>
        </thead>
        <tbody>
          {reports.map((r) => (
            <tr
              key={r.id}
              onClick={() => router.push(`/trust-safety/${r.id}`)}
              className="group cursor-pointer"
            >
              <td className="max-w-[16rem] truncate group-hover:underline">
                {r.targetTitle ?? r.targetId}
              </td>
              <td className="tnum">{r.id}</td>
              <td>
                <TargetChip targetType={r.targetType} />
              </td>
              <td>{r.reporterName || '—'}</td>
              <td className="max-w-[14rem] truncate">{r.reason || '—'}</td>
              <td title={formatDateTime(r.createdAt)}>{formatRelative(r.createdAt)}</td>
              <td className="text-right">
                <StatusBadge status={r.status} />
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
          ))}
        </tbody>
      </table>
    </TableScroll>
  );
}

/**
 * Post vs user, carried by an icon and a word rather than a colour — the two
 * are peers, and tinting them would imply a severity difference that isn't
 * there. Severity is the status pill's job.
 */
function TargetChip({ targetType }: { targetType: AdminReport['targetType'] }) {
  const isPost = targetType === 'post';
  const Icon = isPost ? Package : UserRound;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full bg-ink-100 px-2 py-0.5',
        'text-2xs font-semibold text-ink-700',
      )}
    >
      <Icon size={11} strokeWidth={2} aria-hidden="true" />
      {isPost ? 'Post' : 'User'}
    </span>
  );
}
