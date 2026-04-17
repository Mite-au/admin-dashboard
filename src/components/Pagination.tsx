'use client';

import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange?: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const pages = buildPageList(page, totalPages);

  return (
    <div className="flex items-center justify-center gap-2 py-6">
      <button
        aria-label="Previous"
        onClick={() => onChange?.(Math.max(1, page - 1))}
        className="h-8 w-8 rounded-lg text-ink-500 hover:bg-ink-50 inline-flex items-center justify-center"
      >
        <ChevronLeft size={16} />
      </button>
      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`e-${i}`} className="h-8 w-8 inline-flex items-center justify-center text-ink-400">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange?.(p)}
            className={clsx(
              'h-8 w-8 rounded-lg text-sm inline-flex items-center justify-center',
              p === page
                ? 'bg-ink-800 text-white font-semibold'
                : 'text-ink-700 hover:bg-ink-50',
            )}
          >
            {p}
          </button>
        ),
      )}
      <button
        aria-label="Next"
        onClick={() => onChange?.(Math.min(totalPages, page + 1))}
        className="h-8 w-8 rounded-lg text-ink-500 hover:bg-ink-50 inline-flex items-center justify-center"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

/** Returns a compact page list — always shows up to 10 pages inline if possible,
 *  otherwise collapses with `…`. */
function buildPageList(current: number, total: number): (number | '…')[] {
  if (total <= 10) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const out: (number | '…')[] = [1];
  const start = Math.max(2, current - 2);
  const end = Math.min(total - 1, current + 2);
  if (start > 2) out.push('…');
  for (let p = start; p <= end; p++) out.push(p);
  if (end < total - 1) out.push('…');
  out.push(total);
  return out;
}
