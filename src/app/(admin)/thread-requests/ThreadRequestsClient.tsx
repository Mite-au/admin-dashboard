'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  AlertCircle,
  CheckCheck,
  CheckCircle2,
  ClipboardList,
  Inbox,
  XCircle,
} from 'lucide-react';
import { ConfirmModal } from '@/components/ConfirmModal';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, EmptyState, Tabs } from '@/components/ui';
import { formatDateTime, formatRelative } from '@/lib/format';
import { reviewThreadRequestResult } from '@/lib/actions';
import type { AdminThreadRequest, ThreadRequestStatus } from '@/lib/types';

export type QueueTab = ThreadRequestStatus | 'ALL';

type ReviewStatus = Extract<ThreadRequestStatus, 'APPROVED' | 'REJECTED'>;

const TAB_LABELS: Record<QueueTab, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  ALL: 'All',
};

const TAB_ORDER: QueueTab[] = ['PENDING', 'APPROVED', 'REJECTED', 'ALL'];

const NOTE_MAX_LENGTH = 500;

export function ThreadRequestsClient({
  requests,
  tab,
}: {
  requests: AdminThreadRequest[];
  tab: QueueTab;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, startNavigation] = useTransition();
  const [isReviewing, startReview] = useTransition();

  const [selectedId, setSelectedId] = useState<string | null>(requests[0]?.id ?? null);
  const [reviewNote, setReviewNote] = useState('');
  const [pendingAction, setPendingAction] = useState<ReviewStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<ReviewStatus | null>(null);

  // After a decision the reviewed request drops out of the refreshed list and
  // the selection advances to the next one — which is what makes this feel
  // like a queue rather than a table you have to re-click after every action.
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
    setError(null);
  }, [selectedId]);

  const selected = requests.find((request) => request.id === selectedId) ?? null;

  const handleTabChange = (next: string) => {
    if (next === tab) return;
    startNavigation(() => router.replace(`${pathname}?status=${next}`));
  };

  const runReview = (next: ReviewStatus) => {
    if (!selected) return;
    const note = reviewNote.trim();
    setError(null);
    setPendingAction(next);
    startReview(async () => {
      const result = await reviewThreadRequestResult(
        selected.id,
        next,
        note === '' ? undefined : note,
      );
      if (!result.ok) {
        // The real parsed backend sentence — surfaced beside the buttons that
        // caused it rather than in an alert() the admin has to dismiss.
        setError(result.error);
        setPendingAction(null);
        return;
      }
      router.refresh();
    });
  };

  const tabs = TAB_ORDER.map((id) => ({
    id,
    label: TAB_LABELS[id],
    // Only the open tab's count is knowable: the fetcher returns one status at
    // a time, so a number on the other tabs would be invented.
    count: id === tab ? requests.length : undefined,
  }));

  const hasRows = requests.length > 0;

  return (
    <div className="space-y-6 px-8 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs tabs={tabs} active={tab} onChange={handleTabChange} />
        {isNavigating && <span className="text-data text-ink-500">Loading…</span>}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <Card
          bleed
          title={tab === 'ALL' ? 'All requests' : `${TAB_LABELS[tab]} requests`}
          className={hasRows ? 'xl:col-span-7' : 'xl:col-span-12'}
        >
          {hasRows ? (
            <div className="scroll-slim overflow-x-auto">
              <table className="data-table">
                <caption className="sr-only">
                  {TAB_LABELS[tab]} thread requests. Selecting a row shows it in the review
                  panel.
                </caption>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Requested</th>
                    <th>Region</th>
                    <th>Interest</th>
                    <th>Requester</th>
                    {tab === 'ALL' && <th className="pr-5 text-right">Status</th>}
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => {
                    const isSelected = request.id === selectedId;
                    return (
                      <tr
                        key={request.id}
                        aria-current={isSelected ? 'true' : undefined}
                        onClick={() => setSelectedId(request.id)}
                        className={isSelected ? 'cursor-pointer bg-ink-50' : 'cursor-pointer'}
                      >
                        <td
                          className={
                            // Side-specific colour only: a plain `border-brand-500`
                            // would repaint the row's bottom hairline too.
                            isSelected
                              ? 'border-l-2 border-l-brand-500'
                              : 'border-l-2 border-l-transparent'
                          }
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedId(request.id)}
                            className="block max-w-[16rem] truncate text-left font-medium text-ink-900 hover:text-brand-600"
                          >
                            {request.title}
                          </button>
                        </td>
                        <td>
                          <span
                            suppressHydrationWarning
                            title={formatDateTime(request.createdAt)}
                          >
                            {formatRelative(request.createdAt)}
                          </span>
                        </td>
                        <td>
                          <CodeChip value={request.regionCode} />
                        </td>
                        <td>
                          <CodeChip value={request.interestKey} />
                        </td>
                        <td className="max-w-[12rem] truncate">{requesterLabel(request)}</td>
                        {tab === 'ALL' && (
                          <td className="pr-5 text-right">
                            <StatusBadge status={request.status} />
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <QueueEmptyState tab={tab} />
          )}
        </Card>

        {hasRows && (
          <div className="xl:col-span-5">
            <div className="sticky top-5">
              {selected ? (
                <ReviewPanel
                  request={selected}
                  reviewNote={reviewNote}
                  onNoteChange={setReviewNote}
                  isReviewing={isReviewing}
                  pendingAction={pendingAction}
                  error={error}
                  onRequestDecision={setConfirming}
                />
              ) : (
                <Card title="Review">
                  <EmptyState
                    icon={ClipboardList}
                    title="No request selected"
                    description="Pick a row to read why it was filed and act on it."
                  />
                </Card>
              )}
            </div>
          </div>
        )}
      </div>

      {/*
        The modal is a gate, not a progress indicator: confirming closes it and
        the transition starts underneath, so the pending state stays on the
        panel buttons where attention returns.
      */}
      <ConfirmModal
        open={confirming !== null && selected !== null}
        variant={confirming === 'REJECTED' ? 'danger' : 'default'}
        title={confirming === 'REJECTED' ? 'Reject this request?' : 'Approve this request?'}
        body={
          selected
            ? confirming === 'REJECTED'
              ? `"${selected.title}" will be closed without a thread being created. The requester can't reopen it.`
              : `A thread for "${selected.title}" will be created and the request closed.`
            : undefined
        }
        note={
          reviewNote.trim()
            ? `Note saved with the decision: "${reviewNote.trim()}"`
            : 'No review note will be saved.'
        }
        confirmLabel={confirming === 'REJECTED' ? 'Reject request' : 'Approve request'}
        cancelLabel="Cancel"
        onClose={() => setConfirming(null)}
        onConfirm={() => {
          const next = confirming;
          setConfirming(null);
          if (next) runReview(next);
        }}
      />
    </div>
  );
}

function ReviewPanel({
  request,
  reviewNote,
  onNoteChange,
  isReviewing,
  pendingAction,
  error,
  onRequestDecision,
}: {
  request: AdminThreadRequest;
  reviewNote: string;
  onNoteChange: (value: string) => void;
  isReviewing: boolean;
  pendingAction: ReviewStatus | null;
  error: string | null;
  onRequestDecision: (status: ReviewStatus) => void;
}) {
  const isPendingReview = request.status === 'PENDING';
  // Region-scoped threads are keyed on the region code; without one there is
  // nothing to create, so the block is shown up front instead of after a
  // rejected round trip.
  const canApprove = Boolean(request.regionCode);

  return (
    <Card title="Review" subtitle={`Request ${request.id}`}>
      <div className="space-y-5">
        <div>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-[0.9375rem] font-semibold leading-snug text-ink-900">
              {request.title}
            </h3>
            <StatusBadge status={request.status} />
          </div>
          <p className="mt-1.5 text-data text-ink-500">
            Asked for by{' '}
            {request.requester?.id ? (
              <Link
                href={`/users/${request.requester.id}`}
                className="font-medium text-brand-600 hover:underline"
              >
                {requesterLabel(request)}
              </Link>
            ) : (
              <span className="font-medium text-ink-700">{requesterLabel(request)}</span>
            )}{' '}
            <span suppressHydrationWarning title={formatDateTime(request.createdAt)}>
              {formatRelative(request.createdAt)}
            </span>
          </p>
        </div>

        <div className="rounded-panel bg-ink-50 p-4">
          <p className="label-micro mb-2">Reason given</p>
          <p className="whitespace-pre-wrap text-data leading-relaxed text-ink-900">
            {request.reason?.trim() ? request.reason : 'No reason was supplied.'}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
          <Field label="Region code">
            <CodeChip value={request.regionCode} />
          </Field>
          <Field label="Interest key">
            <CodeChip value={request.interestKey} />
          </Field>
          {request.suburbCode && (
            <Field label="Legacy suburb code">
              <CodeChip value={request.suburbCode} />
            </Field>
          )}
        </dl>

        {isPendingReview ? (
          <div className="space-y-3 border-t border-ink-100 pt-5">
            <div>
              <label htmlFor="review-note" className="label-micro mb-1.5 block">
                Review note (optional)
              </label>
              <textarea
                id="review-note"
                value={reviewNote}
                maxLength={NOTE_MAX_LENGTH}
                disabled={isReviewing}
                onChange={(e) => onNoteChange(e.target.value)}
                placeholder="Why this was approved or turned down"
                className="min-h-20 w-full rounded-panel border border-ink-200 bg-white px-4 py-3 text-data
                           text-ink-900 placeholder:text-ink-400 transition-colors duration-150
                           hover:border-ink-300 disabled:cursor-not-allowed disabled:bg-ink-50"
              />
              <p className="tnum mt-1 text-2xs text-ink-500">
                {reviewNote.length}/{NOTE_MAX_LENGTH} — saved with the decision.
              </p>
            </div>

            {!canApprove && (
              <p className="flex items-start gap-1.5 rounded-control bg-warning-50 px-3 py-2 text-data text-warning-700">
                <AlertCircle size={14} strokeWidth={2} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span>This request has no region code, so there is no thread to create yet.</span>
              </p>
            )}

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                className="btn btn-pill-dark px-5 py-2.5"
                disabled={isReviewing || !canApprove}
                onClick={() => onRequestDecision('APPROVED')}
              >
                <CheckCircle2 size={16} strokeWidth={2} aria-hidden="true" />
                {isReviewing && pendingAction === 'APPROVED' ? 'Approving…' : 'Approve'}
              </button>
              <button
                type="button"
                className="btn rounded-full border border-danger-100 bg-white px-5 py-2.5 font-medium
                           text-danger-700 transition-colors duration-150 hover:bg-danger-50"
                disabled={isReviewing}
                onClick={() => onRequestDecision('REJECTED')}
              >
                <XCircle size={16} strokeWidth={2} aria-hidden="true" />
                {isReviewing && pendingAction === 'REJECTED' ? 'Rejecting…' : 'Reject'}
              </button>
            </div>

            {error && (
              <p
                role="alert"
                className="flex items-start gap-1.5 text-data font-medium text-danger-700"
              >
                <AlertCircle size={14} strokeWidth={2} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3 border-t border-ink-100 pt-5">
            <p className="label-micro">Decision</p>
            <p className="text-data text-ink-700">
              {request.status === 'APPROVED' ? 'Approved' : 'Rejected'}
              {request.reviewedAt && (
                <>
                  {' '}
                  <span suppressHydrationWarning title={formatDateTime(request.reviewedAt)}>
                    {formatRelative(request.reviewedAt)}
                  </span>
                </>
              )}
              .
            </p>
            {request.reviewNote && (
              <p className="whitespace-pre-wrap rounded-panel bg-ink-50 p-4 text-data text-ink-900">
                {request.reviewNote}
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

function QueueEmptyState({ tab }: { tab: QueueTab }) {
  if (tab === 'PENDING') {
    return (
      <EmptyState
        icon={CheckCheck}
        title="Queue clear"
        description="Nothing is waiting on a decision. New requests land here when a member asks for a thread that doesn't exist yet."
        action={
          <Link href="/thread-requests?status=ALL" className="btn btn-pill-ghost">
            See past decisions
          </Link>
        }
      />
    );
  }

  const copy: Record<Exclude<QueueTab, 'PENDING'>, { title: string; description: string }> = {
    APPROVED: {
      title: 'Nothing approved yet',
      description: 'Requests you approve — and the threads they create — will be listed here.',
    },
    REJECTED: {
      title: 'Nothing rejected yet',
      description: 'Requests you turn down will be listed here alongside the note you left.',
    },
    ALL: {
      title: 'No requests yet',
      description: 'No member has asked for a new thread. Requests arrive from the app.',
    },
  };

  const { title, description } = copy[tab];
  return <EmptyState icon={Inbox} title={title} description={description} />;
}

function requesterLabel(request: AdminThreadRequest): string {
  const requester = request.requester;
  return requester?.displayName || requester?.email || requester?.id || 'Unknown requester';
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="label-micro">{label}</dt>
      <dd className="mt-1 break-words text-data text-ink-900">{children}</dd>
    </div>
  );
}

/** A machine key shown as the exact string an admin may need to copy. */
function CodeChip({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="text-ink-400">—</span>;
  return (
    <span className="inline-flex max-w-[12rem] truncate rounded-control border border-ink-100 bg-ink-50 px-1.5 py-0.5 font-mono text-2xs text-ink-700">
      {value}
    </span>
  );
}
