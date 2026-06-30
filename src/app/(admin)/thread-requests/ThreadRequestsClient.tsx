'use client';

import { useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { CheckCircle2, XCircle } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate } from '@/lib/format';
import { reviewThreadRequest } from '@/lib/actions';
import type { ThreadRequestFilters } from '@/lib/fetchers';
import type { AdminThreadRequest, ThreadRequestStatus } from '@/lib/types';

const STATUS_OPTIONS: ReadonlyArray<{ value: ThreadRequestStatus; label: string }> = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

type ReviewStatus = Extract<ThreadRequestStatus, 'APPROVED' | 'REJECTED'>;

export function ThreadRequestsClient({
  requests,
  filters,
}: {
  requests: AdminThreadRequest[];
  filters: ThreadRequestFilters;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const [status, setStatus] = useState<ThreadRequestStatus>(
    (filters.status as ThreadRequestStatus | undefined) ?? 'PENDING',
  );
  const [selectedId, setSelectedId] = useState<string | null>(requests[0]?.id ?? null);
  const [reviewNote, setReviewNote] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);

  useEffect(() => {
    if (requests.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !requests.some((request) => request.id === selectedId)) {
      setSelectedId(requests[0].id);
    }
  }, [requests, selectedId]);

  useEffect(() => {
    setReviewNote('');
  }, [selectedId]);

  const selected = requests.find((request) => request.id === selectedId) ?? null;

  const pushFilters = (nextStatus: ThreadRequestStatus) => {
    const qs = new URLSearchParams({ status: nextStatus }).toString();
    startTransition(() => router.replace(`${pathname}?${qs}`));
  };

  const handleStatusChange = (nextStatus: ThreadRequestStatus) => {
    setStatus(nextStatus);
    pushFilters(nextStatus);
  };

  const handleReview = async (nextStatus: ReviewStatus) => {
    if (!selected || isReviewing) return;
    if (nextStatus === 'APPROVED' && !selected.regionCode) {
      alert('Cannot approve this request until it has a regionCode.');
      return;
    }

    setIsReviewing(true);
    try {
      await reviewThreadRequest(
        selected.id,
        nextStatus,
        reviewNote.trim() === '' ? undefined : reviewNote.trim(),
      );
      router.refresh();
    } catch (err) {
      alert(`Review failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsReviewing(false);
    }
  };

  return (
    <div className="px-8 pb-8 space-y-6">
      <div className="rounded-2xl border border-ink-100 bg-white px-6 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-bold text-ink-900">Request Review</h2>
            <p className="mt-1 text-sm text-ink-700">
              Total <span className="font-semibold text-brand-600">{requests.length}</span>{' '}
              requests
            </p>
          </div>
          <label className="block w-full max-w-xs text-xs text-ink-700">
            Status
            <select
              className="pill-select mt-1.5"
              value={status}
              onChange={(e) => handleStatusChange(e.target.value as ThreadRequestStatus)}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <section className="xl:col-span-8">
          <table className="data-table">
            <thead>
              <tr>
                <th>Created</th>
                <th>Title</th>
                <th>Region</th>
                <th>Interest</th>
                <th>Requester</th>
                <th className="text-right pr-6">Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr
                  key={request.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedId(request.id)}
                >
                  <td className="text-ink-700">{formatDate(request.createdAt)}</td>
                  <td className="font-medium text-ink-900">{request.title}</td>
                  <td className="text-ink-700">{request.regionCode ?? '—'}</td>
                  <td className="text-ink-700">{request.interestKey ?? '—'}</td>
                  <td className="text-ink-700">
                    {request.requester.displayName ?? request.requester.email ?? request.requester.id}
                  </td>
                  <td className="text-right pr-6">
                    <StatusBadge status={request.status} />
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-ink-500">
                    No thread requests match this status.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="card-inner p-6 xl:col-span-4">
          {selected ? (
            <ThreadRequestDetail
              request={selected}
              reviewNote={reviewNote}
              setReviewNote={setReviewNote}
              isReviewing={isReviewing}
              onReview={handleReview}
            />
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-ink-500">
              Select a request to review.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ThreadRequestDetail({
  request,
  reviewNote,
  setReviewNote,
  isReviewing,
  onReview,
}: {
  request: AdminThreadRequest;
  reviewNote: string;
  setReviewNote: (value: string) => void;
  isReviewing: boolean;
  onReview: (status: ReviewStatus) => void;
}) {
  const requester = request.requester.displayName ?? request.requester.email ?? request.requester.id;

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-500">Request detail</p>
        <h2 className="text-lg font-semibold text-ink-900">{request.title}</h2>
      </div>

      <dl className="grid grid-cols-1 gap-4 text-sm">
        <MetaField label="Request ID" value={request.id} />
        <MetaField label="Region code" value={request.regionCode ?? '—'} />
        <MetaField label="Interest key" value={request.interestKey ?? '—'} />
        {request.suburbCode && <MetaField label="Legacy suburb code" value={request.suburbCode} />}
        <MetaField label="Requester" value={requester} />
        <MetaField label="Created" value={formatDate(request.createdAt)} />
        <MetaField label="Status">
          <StatusBadge status={request.status} />
        </MetaField>
        {request.reviewedAt && <MetaField label="Reviewed" value={formatDate(request.reviewedAt)} />}
        {request.reviewNote && <MetaField label="Review note" value={request.reviewNote} />}
      </dl>

      <div className="rounded-xl border border-ink-200 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-500">Reason</p>
        <p className="mt-2 whitespace-pre-wrap text-sm text-ink-900">{request.reason}</p>
      </div>

      {request.status === 'PENDING' && (
        <div className="space-y-3">
          <label className="block text-xs text-ink-700">
            Review note
            <textarea
              className="mt-1.5 min-h-24 w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-ink-400 focus:outline-none focus:ring-2 focus:ring-ink-200"
              maxLength={500}
              placeholder="Optional note"
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
            />
          </label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              className="btn btn-pill-dark px-5 py-2.5 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isReviewing}
              onClick={() => onReview('APPROVED')}
            >
              <CheckCircle2 size={16} />
              Approve
            </button>
            <button
              type="button"
              className="btn btn-pill-ghost px-5 py-2.5 text-danger disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isReviewing}
              onClick={() => onReview('REJECTED')}
            >
              <XCircle size={16} />
              Reject
            </button>
          </div>
        </div>
      )}
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
      <dd className="mt-1 break-words text-ink-900">{children ?? value}</dd>
    </div>
  );
}
