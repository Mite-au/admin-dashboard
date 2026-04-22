'use client';

import { useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { SearchCard, SearchField } from '@/components/SearchCard';
import { Pagination } from '@/components/Pagination';
import { StatusBadge } from '@/components/StatusBadge';
import { exportToCsv } from '@/components/ExportCsvButton';
import { formatDate } from '@/lib/format';
import type { ReportFilters } from '@/lib/fetchers';
import type { AdminReport, Paged } from '@/lib/types';

const TARGET_TYPE_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'post', label: 'Post' },
  { value: 'user', label: 'User' },
] as const;

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'resolved', label: 'Resolved' },
] as const;

const CSV_COLUMNS = [
  { key: 'reportId',   label: 'Report ID' },
  { key: 'type',       label: 'Type' },
  { key: 'target',     label: 'Target' },
  { key: 'reporter',   label: 'Reporter' },
  { key: 'reason',     label: 'Reason' },
  { key: 'status',     label: 'Status' },
  { key: 'date',       label: 'Date' },
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

  const [targetType, setTargetType] = useState(filters.targetType ?? '');
  const [status, setStatus]         = useState(filters.status ?? '');

  const pushFilters = (next: Partial<ReportFilters>) => {
    const merged: Record<string, string> = {};
    const final = { targetType, status, page: filters.page, ...next };
    for (const [k, v] of Object.entries(final)) {
      if (v === undefined || v === null || v === '') continue;
      merged[k] = String(v);
    }
    const qs = new URLSearchParams(merged).toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname));
  };

  const handleExport = () => {
    const rows = data.items.map((r) => ({
      reportId: r.id,
      type:     r.targetType,
      target:   r.targetTitle ?? r.targetId,
      reporter: r.reporterName,
      reason:   r.reason,
      status:   r.status,
      date:     formatDate(r.createdAt),
    }));
    const filename = `reports-${new Date().toISOString().slice(0, 10)}.csv`;
    exportToCsv(rows, [...CSV_COLUMNS], filename);
  };

  return (
    <div className="px-8 pb-8 space-y-6">
      <SearchCard
        title="Report Search"
        total={data.total}
        label="reports"
        onExport={handleExport}
      >
        <SearchField label="Type">
          <div className="relative">
            <select
              className="pill-select pr-8"
              value={targetType}
              onChange={(e) => {
                setTargetType(e.target.value);
                pushFilters({ targetType: e.target.value, page: 1 });
              }}
            >
              {TARGET_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-500"
            />
          </div>
        </SearchField>
        <SearchField label="Status">
          <div className="relative">
            <select
              className="pill-select pr-8"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                pushFilters({ status: e.target.value, page: 1 });
              }}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-500"
            />
          </div>
        </SearchField>
      </SearchCard>

      <table className="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Report ID</th>
            <th>Type</th>
            <th>Target</th>
            <th>Reporter</th>
            <th>Reason</th>
            <th className="text-right pr-6">Status</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((r) => (
            <tr
              key={r.id}
              className="cursor-pointer"
              onClick={() => router.push(`/trust-safety/${r.id}`)}
            >
              <td className="text-ink-700">{formatDate(r.createdAt)}</td>
              <td className="text-ink-700">{r.id}</td>
              <td>
                <span
                  className={
                    'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ' +
                    (r.targetType === 'post'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-purple-50 text-purple-700')
                  }
                >
                  {r.targetType === 'post' ? 'Post' : 'User'}
                </span>
              </td>
              <td className="text-ink-900 font-medium">
                {r.targetTitle ?? r.targetId}
              </td>
              <td className="text-ink-700">{r.reporterName}</td>
              <td className="text-ink-700">{r.reason}</td>
              <td className="text-right pr-6">
                <StatusBadge status={r.status === 'open' ? 'in progress' : 'complete'} />
              </td>
            </tr>
          ))}
          {data.items.length === 0 && (
            <tr>
              <td colSpan={7} className="text-center text-ink-500 py-10">
                No reports match your filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <Pagination
        page={data.page}
        totalPages={Math.max(1, Math.ceil(data.total / data.pageSize))}
        onChange={(p) => pushFilters({ page: p })}
      />
    </div>
  );
}
