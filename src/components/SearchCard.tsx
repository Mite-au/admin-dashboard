'use client';

import { Download, Search } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * The filter block above each list page: a titled panel holding the result
 * count, an export affordance, a grid of filter inputs, and the submit.
 *
 * The count is the one place per page where brand orange is used as data
 * emphasis — everywhere else orange is reserved for wayfinding.
 */
export function SearchCard({
  title,
  total,
  label = 'users',
  onSearch,
  onExport,
  exportLabel = 'Export CSV',
  children,
}: {
  title: string;
  total: number | string;
  label?: string;
  onSearch?: () => void;
  onExport?: () => void;
  /** Override when the export is narrower than it sounds, e.g. "Export page (15)". */
  exportLabel?: string;
  children: ReactNode;
}) {
  return (
    <div className="card-inner px-5 py-5">
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 className="text-[0.9375rem] font-semibold text-ink-900">{title}</h2>
        <span className="h-3.5 w-px bg-ink-200" aria-hidden="true" />
        <span className="text-data text-ink-500">
          <span className="tnum font-semibold text-brand-600">{total}</span> {label}
        </span>
        {onExport && (
          <button type="button" onClick={onExport} className="btn-icon ml-auto">
            <Download size={14} strokeWidth={1.9} />
            {exportLabel}
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="grid min-w-0 flex-1 grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2 lg:grid-cols-4">
          {children}
        </div>
        <button onClick={onSearch} className="btn btn-pill-dark shrink-0 px-7 py-2.5">
          <Search size={15} strokeWidth={2} />
          Search
        </button>
      </div>
    </div>
  );
}

export function SearchField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label className="label-micro mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}
