'use client';

import { useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';
import { SearchCard, SearchField } from '@/components/SearchCard';
import { Pagination } from '@/components/Pagination';
import { StatusBadge } from '@/components/StatusBadge';
import { exportToCsv } from '@/components/ExportCsvButton';
import { formatDate, formatMoney, isImageSrc } from '@/lib/format';
import type { PostFilters } from '@/lib/fetchers';
import type { AdminPost, Paged } from '@/lib/types';

const CSV_COLUMNS = [
  { key: 'itemId',    label: 'Item ID' },
  { key: 'title',     label: 'Item title' },
  { key: 'category',  label: 'Category' },
  { key: 'price',     label: 'Price' },
  { key: 'condition', label: 'Condition' },
  { key: 'status',    label: 'Status' },
  { key: 'date',      label: 'Date' },
] as const;

export function ListingsClient({
  data,
  filters,
}: {
  data: Paged<AdminPost>;
  filters: PostFilters;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const [title, setTitle]       = useState(filters.title ?? '');
  const [priceMin, setPriceMin] = useState(
    filters.priceMin !== undefined ? String(filters.priceMin) : '',
  );
  const [priceMax, setPriceMax] = useState(
    filters.priceMax !== undefined ? String(filters.priceMax) : '',
  );
  const [category, setCategory] = useState(filters.category ?? '');
  const [memberId, setMemberId] = useState(filters.memberId ?? '');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const categories = Array.from(new Set(data.items.map((p) => p.category)));

  const pushFilters = (next: Partial<Record<string, string | number | undefined>>) => {
    const merged: Record<string, string> = {};
    const final = {
      title,
      priceMin: priceMin || undefined,
      priceMax: priceMax || undefined,
      category,
      memberId,
      page: filters.page,
      ...next,
    };
    for (const [k, v] of Object.entries(final)) {
      if (v === undefined || v === null || v === '') continue;
      merged[k] = String(v);
    }
    const qs = new URLSearchParams(merged).toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname));
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    pushFilters({ page: 1 });
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExport = () => {
    const rows = data.items.map((p) => ({
      itemId:    `i${p.id}`,
      title:     p.title,
      category:  p.category,
      price:     `${p.price} ${p.currency}`,
      condition: p.condition,
      status:    p.status,
      date:      formatDate(p.createdAt),
    }));
    const filename = `listings-${new Date().toISOString().slice(0, 10)}.csv`;
    exportToCsv(rows, [...CSV_COLUMNS], filename);
  };

  return (
    <div className="px-8 pb-8 space-y-6">
      <form onSubmit={onSearch}>
        <SearchCard
          title="Listing Search"
          total={data.total}
          label="listings"
          onExport={handleExport}
        >
          <SearchField label="Item title">
            <input
              className="pill-input"
              placeholder="Item title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </SearchField>
          <SearchField label="Price">
            <div className="flex items-center gap-2">
              <input
                className="pill-input"
                placeholder="Min"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
              />
              <span className="text-ink-500">-</span>
              <input
                className="pill-input"
                placeholder="Max"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
              />
            </div>
          </SearchField>
          <SearchField label="Category">
            <div className="relative">
              <select
                className="pill-select pr-8"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Category</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-500"
              />
            </div>
          </SearchField>
          <SearchField label="Member ID">
            <input
              className="pill-input"
              placeholder="m124324"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
            />
          </SearchField>
        </SearchCard>
      </form>

      <table className="data-table">
        <thead>
          <tr>
            <th className="w-10"></th>
            <th className="w-20">Images</th>
            <th>Timestamp</th>
            <th>Member ID</th>
            <th>Item title</th>
            <th>Description</th>
            <th className="text-right">Price</th>
            <th>Category</th>
            <th className="text-right pr-6">Condition</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((p) => (
            <tr
              key={p.id}
              className="cursor-pointer"
              onClick={() => router.push(`/listings/${p.id}`)}
            >
              <td onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-ink-300"
                  checked={selected.has(p.id)}
                  onChange={() => toggle(p.id)}
                />
              </td>
              <td>
                <div className="h-10 w-10 rounded-md bg-ink-100 overflow-hidden relative">
                  {isImageSrc(p.photos[0]) && (
                    <Image src={p.photos[0]} alt="" fill sizes="40px" className="object-cover" />
                  )}
                </div>
              </td>
              <td className="text-ink-700">
                <div>{formatDate(p.createdAt)}</div>
                <div className="text-xs text-ink-500">
                  {new Date(p.createdAt).toLocaleTimeString('en-AU', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </div>
              </td>
              <td className="text-ink-700">m{p.seller.id}</td>
              <td className="font-medium">{p.title}</td>
              <td className="text-ink-700 max-w-xs truncate">
                {p.description ?? '—'}
              </td>
              <td className="text-right">{formatMoney(p.price, p.currency)}</td>
              <td className="text-ink-700">{p.category}</td>
              <td className="text-right pr-6">
                <StatusBadge status={p.status} />
              </td>
            </tr>
          ))}
          {data.items.length === 0 && (
            <tr>
              <td colSpan={9} className="text-center text-ink-500 py-10">
                No listings match your filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <Pagination
        page={data.page}
        totalPages={Math.max(1, Math.ceil(data.total / data.pageSize))}
        onChange={(p) => pushFilters({ page: p })}
      />
    </div>
  );
}
