'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, ShieldCheck } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/ui';
import { formatDateTime, formatRelative } from '@/lib/format';
import type { AdminReport } from '@/lib/types';
// The one target-type vocabulary, shared with the Trust & Safety queue. This
// tab used to carry a private two-way copy that labelled every non-post report
// "User" — including market and chat-message reports.
import { TargetTypeChip, formatReportReason } from '@/app/(admin)/trust-safety/ReportTarget';
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
              <td className="max-w-[16rem] truncate">
                <Link
                  href={`/trust-safety/${r.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded-sm group-hover:underline"
                >
                  {r.targetTitle || r.targetId || 'Untitled target'}
                </Link>
              </td>
              <td className="tnum">{r.id}</td>
              <td>
                <TargetTypeChip type={r.targetType} />
              </td>
              <td>{r.reporterName || '—'}</td>
              <td className="max-w-[14rem] truncate" title={r.reason || undefined}>
                {formatReportReason(r.reason)}
              </td>
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
