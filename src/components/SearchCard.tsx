'use client';

import { Download } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * The filter/search block shown above each list page in the Figma —
 * a rounded card with a title, a total count, an "Export CSV" button,
 * and a grid of pill-shaped inputs with a dark "Search" button on the
 * right.
 */
export function SearchCard({
  title,
  total,
  label = 'users',
  onSearch,
  onExport,
  children,
}: {
  title: string;
  total: number | string;
  label?: string;
  onSearch?: () => void;
  onExport?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white px-6 py-5">
      <div className="flex items-center gap-4 mb-4">
        <h2 className="font-bold text-ink-900">{title}</h2>
        <span className="text-sm text-ink-700">
          Total <span className="text-brand-600 font-semibold">{total}</span> {label}
        </span>
        <button
          onClick={onExport}
          className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-ink-50 border border-ink-200 px-3 py-1.5 text-sm text-ink-700 hover:bg-ink-100"
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid flex-1 min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {children}
        </div>
        <button
          onClick={onSearch}
          className="btn btn-pill-dark px-8 py-2.5 shrink-0"
        >
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
    <div>
      <label className="block text-xs text-ink-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
