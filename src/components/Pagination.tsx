'use client';

import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatNumber } from '@/lib/format';

export function Pagination({
  page,
  totalPages,
  onChange,
  total,
  pageSize,
}: {
  page: number;
  totalPages: number;
  onChange?: (p: number) => void;
  /** Row count across all pages. With `pageSize`, renders a "1–15 of 240" summary. */
  total?: number;
  /** Rows per page. Only used for the summary. */
  pageSize?: number;
}) {
  const showSummary = typeof total === 'number' && typeof pageSize === 'number' && pageSize > 0;

  // A single page of results still deserves its summary; it just has no controls.
  if (totalPages <= 1 && !showSummary) return null;

  const pages = buildPageList(page, totalPages);
  const first = total === 0 ? 0 : (page - 1) * (pageSize ?? 0) + 1;
  const last = Math.min(page * (pageSize ?? 0), total ?? 0);

  return (
    <nav
      aria-label="Pagination"
      className={clsx(
        'flex flex-wrap items-center gap-x-4 gap-y-2 py-5',
        showSummary ? 'justify-between' : 'justify-center',
      )}
    >
      {showSummary && (
        <p className="tnum text-data text-ink-500">
          {total === 0 ? (
            'No results'
          ) : (
            <>
              <span className="font-semibold text-ink-700">
                {formatNumber(first)}–{formatNumber(last)}
              </span>{' '}
              of {formatNumber(total)}
            </>
          )}
        </p>
      )}

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <PageArrow
            label="Previous page"
            disabled={page <= 1}
            onClick={() => onChange?.(Math.max(1, page - 1))}
          >
            <ChevronLeft size={16} strokeWidth={2} />
          </PageArrow>

          {pages.map((p, i) =>
            p === '…' ? (
              <span
                key={`gap-${i}`}
                aria-hidden="true"
                className="inline-flex h-8 w-8 items-center justify-center text-ink-400"
              >
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onChange?.(p)}
                aria-label={`Page ${p}`}
                aria-current={p === page ? 'page' : undefined}
                className={clsx(
                  'tnum inline-flex h-8 min-w-8 items-center justify-center rounded-control px-2 text-data',
                  'transition-colors duration-150',
                  p === page
                    ? 'bg-ink-900 font-semibold text-white'
                    : 'font-medium text-ink-600 hover:bg-ink-50 hover:text-ink-900',
                )}
              >
                {p}
              </button>
            ),
          )}

          <PageArrow
            label="Next page"
            disabled={page >= totalPages}
            onClick={() => onChange?.(Math.min(totalPages, page + 1))}
          >
            <ChevronRight size={16} strokeWidth={2} />
          </PageArrow>
        </div>
      )}
    </nav>
  );
}

function PageArrow({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-control border border-ink-200
                 bg-white text-ink-600 transition-colors duration-150
                 hover:border-ink-300 hover:bg-ink-50 hover:text-ink-900
                 disabled:cursor-not-allowed disabled:border-ink-100 disabled:bg-white disabled:text-ink-300"
    >
      {children}
    </button>
  );
}

/** Fixed 7-slot page list: bookends + either a 5-number run or
 *  ellipses that keep the control the same width on every page. */
function buildPageList(current: number, total: number): (number | '…')[] {
  const SLOTS = 7;
  if (total <= SLOTS) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, '…', total];
  }
  if (current >= total - 3) {
    return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, '…', current - 1, current, current + 1, '…', total];
}
