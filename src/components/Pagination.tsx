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
