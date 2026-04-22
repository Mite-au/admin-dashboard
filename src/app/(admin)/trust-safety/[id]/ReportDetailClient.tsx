'use client';

import Link from 'next/link';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate } from '@/lib/format';
import type { AdminReport } from '@/lib/types';

export function ReportDetailClient({ report }: { report: AdminReport }) {
  const targetHref =
    report.targetType === 'post'
      ? `/listings/${report.targetId}`
      : `/users/${report.targetId}`;

  const reporterHref = `/users/${report.reporterId}`;

  return (
    <div className="px-8 pb-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* ── Report info card ─────────────────────────────────────────────── */}
      <section className="card-inner lg:col-span-5 p-6 space-y-6">
        <h2 className="text-base font-semibold text-ink-900">Report Information</h2>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 text-sm">
          <MetaField label="Report ID" value={report.id} />
          <MetaField label="Type">
            <span
              className={
                'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ' +
                (report.targetType === 'post'
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-purple-50 text-purple-700')
              }
            >
              {report.targetType === 'post' ? 'Post' : 'User'}
            </span>
          </MetaField>
          <MetaField label="Reason" value={report.reason} />
          <MetaField label="Status">
            <StatusBadge status={report.status === 'open' ? 'in progress' : 'complete'} />
          </MetaField>
          <MetaField label="Created At" value={formatDate(report.createdAt)} />
          <MetaField label="Details" value={report.details ?? '—'} />
        </dl>
      </section>

      {/* ── Target + Reporter card ───────────────────────────────────────── */}
      <section className="card-inner lg:col-span-4 p-6 space-y-6">
        <div>
          <h2 className="text-base font-semibold text-ink-900 mb-4">Target</h2>
          <dl className="grid grid-cols-1 gap-y-4 text-sm">
            <MetaField label="Type" value={report.targetType === 'post' ? 'Post' : 'User'} />
            <MetaField label="Title / ID" value={report.targetTitle ?? report.targetId} />
            <MetaField label="Link">
              <Link
                href={targetHref}
                className="text-brand-600 hover:underline break-all"
              >
                {targetHref}
              </Link>
            </MetaField>
          </dl>
        </div>

        <div className="border-t border-ink-100 pt-5">
          <h2 className="text-base font-semibold text-ink-900 mb-4">Reporter</h2>
          <dl className="grid grid-cols-1 gap-y-4 text-sm">
            <MetaField label="Name" value={report.reporterName} />
            <MetaField label="Link">
              <Link
                href={reporterHref}
                className="text-brand-600 hover:underline break-all"
              >
                {reporterHref}
              </Link>
            </MetaField>
          </dl>
        </div>
      </section>

      {/* ── Actions card ─────────────────────────────────────────────────── */}
      <section className="card-inner lg:col-span-3 p-6 space-y-3">
        <h2 className="text-base font-semibold text-ink-900 mb-4">Actions</h2>
        <Link
          href={targetHref}
          className="block w-full rounded-full border border-ink-200 px-4 py-2 text-sm text-center text-ink-700 hover:bg-ink-50 transition-colors"
        >
          View Target
        </Link>
        <Link
          href={reporterHref}
          className="block w-full rounded-full border border-ink-200 px-4 py-2 text-sm text-center text-ink-700 hover:bg-ink-50 transition-colors"
        >
          View Reporter
        </Link>
        <button
          type="button"
          disabled
          onClick={() => alert('Resolve is not yet available.')}
          className="block w-full rounded-full border border-ink-200 px-4 py-2 text-sm text-center text-ink-400 bg-ink-50 cursor-not-allowed"
        >
          Resolve
        </button>
      </section>
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
      <dt className="text-xs text-ink-500 mb-1">{label}</dt>
      <dd className="text-sm text-ink-900 break-words">{children ?? value}</dd>
    </div>
  );
}
