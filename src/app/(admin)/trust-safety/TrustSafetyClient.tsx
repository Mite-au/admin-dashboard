'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Download, ShieldCheck, SearchX } from 'lucide-react';
import { SearchCard, SearchField } from '@/components/SearchCard';
import { Pagination } from '@/components/Pagination';
import { StatusBadge } from '@/components/StatusBadge';
import { exportToCsv } from '@/components/ExportCsvButton';
import { Card, EmptyState } from '@/components/ui';
import { formatDateTime, formatNumber, formatRelative } from '@/lib/format';
import type { ReportFilters } from '@/lib/fetchers';
import type {
  AdminReport,
  AdminReportStatus,
  AdminReportTargetType,
  Paged,
} from '@/lib/types';
import {
  REPORT_TARGET_TYPES,
  TargetTypeChip,
  formatReportReason,
  targetHref,
  targetMeta,
} from './ReportTarget';

type ReportTargetTypeFilterValue = AdminReportTargetType | '';
type ReportStatusFilterValue = AdminReportStatus | '';

const TARGET_TYPE_OPTIONS: ReadonlyArray<{ value: ReportTargetTypeFilterValue; label: string }> = [
  { value: '', label: 'All targets' },
  ...REPORT_TARGET_TYPES.map((value) => ({ value, label: targetMeta(value).label })),
];

const STATUS_OPTIONS: ReadonlyArray<{ value: ReportStatusFilterValue; label: string }> = [
  { value: '', label: 'All statuses' },
  { value: 'open', label: 'Open' },
  { value: 'resolved', label: 'Resolved' },
] as const;

const CSV_COLUMNS = [
  { key: 'reportId', label: 'Report ID' },
  { key: 'type', label: 'Target type' },
  { key: 'target', label: 'Target' },
  { key: 'reporter', label: 'Reporter' },
  { key: 'reason', label: 'Reason' },
  { key: 'status', label: 'Status' },
  { key: 'date', label: 'Reported at' },
] as const;

export function TrustSafetyClient({
  data,
  filters,
}: {
  data: Paged<AdminReport>;
  filters: ReportFilters;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const [targetType, setTargetType] = useState<ReportTargetTypeFilterValue>(
    filters.targetType ?? '',
  );
  const [status, setStatus] = useState<ReportStatusFilterValue>(filters.status ?? '');

  const rows = data.items;
  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));
  const hasFilters = Boolean(filters.targetType || filters.status);

  const pushFilters = (next: Partial<ReportFilters>) => {
    const merged: Record<string, string> = {};
    const final = {
      targetType: targetType === '' ? undefined : targetType,
      status: status === '' ? undefined : status,
      page: filters.page,
      ...next,
    };
    // Empty selections were already mapped to `undefined` above, so there is
    // no '' case left to strip here.
    for (const [k, v] of Object.entries(final)) {
      if (v === undefined || v === null) continue;
      merged[k] = String(v);
    }
    const qs = new URLSearchParams(merged).toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname));
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    pushFilters({ page: 1 });
  };

  const clearFilters = () => {
    setTargetType('');
    setStatus('');
    startTransition(() => router.replace(pathname));
  };

  /** Current page only — there is no bulk export endpoint behind this. */
  const handleExport = () => {
    const csvRows = rows.map((r) => ({
      reportId: r.id,
      type: targetMeta(r.targetType).label,
      target: r.targetTitle || r.targetId,
      reporter: r.reporterName,
      reason: formatReportReason(r.reason),
      status: r.status,
      date: formatDateTime(r.createdAt),
    }));
    exportToCsv(
      csvRows,
      [...CSV_COLUMNS],
      `reports-page-${data.page}-${new Date().toISOString().slice(0, 10)}.csv`,
    );
  };

  return (
    <div className="space-y-6 px-8 pb-8">
      <form onSubmit={onSearch}>
        <SearchCard title="Report Search" total={formatNumber(data.total)} label="reports">
          <SearchField label="Target type">
            <select
              className="pill-select"
              value={targetType}
              onChange={(e) => {
                const next = e.target.value as ReportTargetTypeFilterValue;
                setTargetType(next);
                pushFilters({ targetType: next === '' ? undefined : next, page: 1 });
              }}
            >
              {TARGET_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </SearchField>
          <SearchField label="Status">
            <select
              className="pill-select"
              value={status}
              onChange={(e) => {
                const next = e.target.value as ReportStatusFilterValue;
                setStatus(next);
                pushFilters({ status: next === '' ? undefined : next, page: 1 });
              }}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </SearchField>
        </SearchCard>
      </form>

      <Card
        bleed
        title="Reports"
        actions={
          rows.length > 0 ? (
            <button
              type="button"
              onClick={handleExport}
              className="btn-icon"
              title={`Downloads the ${rows.length} report${rows.length === 1 ? '' : 's'} shown on this page. Other pages are not included.`}
            >
              <Download size={14} strokeWidth={1.9} />
              Export page
            </button>
          ) : undefined
        }
      >
        {rows.length === 0 ? (
          hasFilters ? (
            <EmptyState
              icon={SearchX}
              title="No matching reports"
              description="No report matches this combination of target type and status."
              action={
                <button type="button" onClick={clearFilters} className="btn btn-pill-ghost">
                  Clear filters
                </button>
              }
            />
          ) : (
            <EmptyState
              icon={ShieldCheck}
              title="Nothing has been reported"
              description="When a member reports a listing, another member, or a message, it lands here for review."
            />
          )
        ) : (
          <div className="scroll-slim overflow-x-auto">
            <table className="data-table">
              <caption className="sr-only">
                Member reports, page {data.page} of {totalPages}
              </caption>
              <thead>
                <tr>
                  <th>Target</th>
                  <th>Type</th>
                  <th>Reported</th>
                  <th>Reason</th>
                  <th>Reporter</th>
                  <th>Report ID</th>
                  <th className="pr-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const href = targetHref(r);
                  return (
                    <tr
                      key={r.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/trust-safety/${r.id}`)}
                    >
                      <td>
                        {href ? (
                          <Link
                            href={href}
                            onClick={(e) => e.stopPropagation()}
                            title={`Open the reported ${targetMeta(r.targetType).label.toLowerCase()}`}
                            className="block max-w-[16rem] truncate font-medium text-ink-900 hover:text-brand-600 hover:underline"
                          >
                            {r.targetTitle || r.targetId}
                          </Link>
                        ) : (
                          // Market listings and chat messages have no admin
                          // page, so the cell identifies the target and stops.
                          <span
                            title={r.targetId ? `${targetMeta(r.targetType).label} ${r.targetId}` : undefined}
                            className="block max-w-[16rem] truncate font-medium text-ink-900"
                          >
                            {r.targetTitle || r.targetId || '—'}
                          </span>
                        )}
                      </td>
                      <td>
                        <TargetTypeChip type={r.targetType} />
                      </td>
                      <td>
                        <span suppressHydrationWarning title={formatDateTime(r.createdAt)}>
                          {formatRelative(r.createdAt)}
                        </span>
                      </td>
                      <td className="max-w-[14rem] truncate" title={r.reason || undefined}>
                        {formatReportReason(r.reason)}
                      </td>
                      <td className="max-w-[12rem] truncate">{r.reporterName || '—'}</td>
                      <td>
                        <Link
                          href={`/trust-safety/${r.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-ink-500 hover:text-brand-600 hover:underline"
                        >
                          {r.id}
                        </Link>
                      </td>
                      <td className="pr-5 text-right">
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Pagination
        page={data.page}
        totalPages={totalPages}
        total={data.total}
        pageSize={data.pageSize}
        onChange={(p) => pushFilters({ page: p })}
      />
    </div>
  );
}
