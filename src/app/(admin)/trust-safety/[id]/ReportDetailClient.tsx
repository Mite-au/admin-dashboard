'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowUpRight, CheckCircle2, RotateCcw } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { Card } from '@/components/ui';
import { formatDateTime, formatRelative } from '@/lib/format';
import { updateReportStatusResult } from '@/lib/actions';
import type { AdminReport, AdminReportStatus } from '@/lib/types';
import {
  TargetTypeChip,
  formatReportReason,
  reporterHref,
  targetHref,
  targetMeta,
} from '../ReportTarget';

export function ReportDetailClient({ report }: { report: AdminReport }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const target = targetHref(report);
  const reporter = reporterHref(report);
  const { label: targetLabel } = targetMeta(report.targetType);
  const isOpen = report.status === 'open';

  const changeStatus = (next: AdminReportStatus) => {
    setError(null);
    startTransition(async () => {
      const result = await updateReportStatusResult(report.id, next);
      if (!result.ok) {
        // The backend's own sentence, next to the button that failed.
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6 px-8 pb-8 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-7">
        {/* The subtitle is absolute-only: a relative string in a plain-text
            prop can't carry `suppressHydrationWarning`, and it would drift
            between the server render and hydration. */}
        <Card
          title="What was reported"
          subtitle={`Filed ${formatDateTime(report.createdAt)}`}
          actions={<StatusBadge status={report.status} />}
        >
          <div className="space-y-5">
            <div>
              <p className="label-micro mb-1.5">Reason</p>
              <p
                title={report.reason || undefined}
                className="text-[0.9375rem] font-semibold leading-snug text-ink-900"
              >
                {report.reason ? formatReportReason(report.reason) : 'No reason was selected.'}
              </p>
            </div>

            <div className="rounded-panel bg-ink-50 p-4">
              <p className="label-micro mb-2">Reporter&rsquo;s description</p>
              {report.details?.trim() ? (
                <p className="whitespace-pre-wrap text-data leading-relaxed text-ink-900">
                  {report.details}
                </p>
              ) : (
                <p className="text-data text-ink-500">
                  The reporter didn&rsquo;t add anything beyond the reason above.
                </p>
              )}
            </div>

            <dl className="grid grid-cols-1 gap-4 border-t border-ink-100 pt-5 sm:grid-cols-2">
              <Field label="Report ID">
                <span className="font-mono text-2xs text-ink-700">{report.id}</span>
              </Field>
              <Field label="Reported at">
                <span suppressHydrationWarning title={formatDateTime(report.createdAt)}>
                  {formatRelative(report.createdAt)}
                </span>
              </Field>
            </dl>
          </div>
        </Card>
      </div>

      <div className="space-y-6 lg:col-span-5">
        <Card title="Target" actions={<TargetTypeChip type={report.targetType} />}>
          <p className="break-words text-data font-medium text-ink-900">
            {report.targetTitle || report.targetId || '—'}
          </p>
          {report.targetTitle && report.targetId && (
            <p className="mt-1 font-mono text-2xs text-ink-500">{report.targetId}</p>
          )}
          <div className="mt-4">
            {target ? (
              <Link href={target} className="btn btn-pill-ghost">
                Open {targetLabel.toLowerCase()}
                <ArrowUpRight size={14} strokeWidth={2} aria-hidden="true" />
              </Link>
            ) : (
              <p className="text-data text-ink-500">
                This target has no admin page to open.
              </p>
            )}
          </div>
        </Card>

        <Card title="Reporter">
          <p className="break-words text-data font-medium text-ink-900">
            {report.reporterName || 'Unknown reporter'}
          </p>
          <div className="mt-4">
            {reporter ? (
              <Link href={reporter} className="btn btn-pill-ghost">
                Open reporter
                <ArrowUpRight size={14} strokeWidth={2} aria-hidden="true" />
              </Link>
            ) : (
              <p className="text-data text-ink-500">This reporter has no linked account.</p>
            )}
          </div>
        </Card>

        <Card
          title="Resolution"
          subtitle={
            isOpen
              ? 'Resolving records that this report has been dealt with.'
              : 'Reopen if the same report needs another look.'
          }
        >
          {isOpen ? (
            <button
              type="button"
              disabled={isPending}
              onClick={() => changeStatus('resolved')}
              className="btn btn-pill-dark w-full px-5 py-2.5"
            >
              <CheckCircle2 size={16} strokeWidth={2} aria-hidden="true" />
              {isPending ? 'Resolving…' : 'Mark resolved'}
            </button>
          ) : (
            <button
              type="button"
              disabled={isPending}
              onClick={() => changeStatus('open')}
              className="btn btn-pill-ghost w-full px-5 py-2.5"
            >
              <RotateCcw size={16} strokeWidth={2} aria-hidden="true" />
              {isPending ? 'Reopening…' : 'Reopen report'}
            </button>
          )}

          {error && (
            <p
              role="alert"
              className="mt-3 flex items-start gap-1.5 text-data font-medium text-danger-700"
            >
              <AlertCircle
                size={14}
                strokeWidth={2}
                className="mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <span>{error}</span>
            </p>
          )}

          <p className="mt-3 text-2xs text-ink-500">
            Status changes here don&rsquo;t action the {targetLabel.toLowerCase()} itself — do
            that on its own page.
          </p>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="label-micro">{label}</dt>
      <dd className="mt-1 break-words text-data text-ink-900">{children}</dd>
    </div>
  );
}
