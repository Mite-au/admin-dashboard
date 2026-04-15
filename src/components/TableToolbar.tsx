'use client';

import { Search, Download, SlidersHorizontal } from 'lucide-react';
import { FilterPills } from './FilterPills';

export function TableToolbar<T extends string>({
  statusValue,
  statusOptions,
  onStatusChange,
  onSearch,
  placeholder = 'Search…',
}: {
  statusValue: T;
  statusOptions: { label: string; value: T; count?: number }[];
  onStatusChange: (v: T) => void;
  onSearch?: (q: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <FilterPills value={statusValue} onChange={onStatusChange} options={statusOptions} />
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
          <input
            onChange={(e) => onSearch?.(e.target.value)}
            placeholder={placeholder}
            className="w-60 pl-8 pr-3 py-2 rounded-lg border border-ink-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
        <button className="btn btn-ghost border border-ink-100"><SlidersHorizontal size={14} /> Filter</button>
        <button className="btn btn-ghost border border-ink-100"><Download size={14} /> Export</button>
      </div>
    </div>
  );
}
