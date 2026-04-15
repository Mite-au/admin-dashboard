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
  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1);
  return (
    <div className="flex items-center justify-center gap-1 py-4">
      <button className="btn btn-ghost px-2" onClick={() => onChange?.(Math.max(1, page - 1))}>
        <ChevronLeft size={16} />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange?.(p)}
          className={clsx(
            'h-8 w-8 rounded-md text-sm',
            p === page ? 'bg-brand-600 text-white' : 'text-ink-700 hover:bg-ink-100'
          )}
        >
          {p}
        </button>
      ))}
      <button
        className="btn btn-ghost px-2"
        onClick={() => onChange?.(Math.min(totalPages, page + 1))}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
