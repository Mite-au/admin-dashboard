'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { ChevronRight, ImageOff, SearchX } from 'lucide-react';
import { SearchCard, SearchField } from '@/components/SearchCard';
import { Pagination } from '@/components/Pagination';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, EmptyState } from '@/components/ui';
import { formatDateTime, formatMoney, formatRelative, isImageSrc } from '@/lib/format';
import type { PostFilters } from '@/lib/fetchers';
import type { AdminPost, Paged } from '@/lib/types';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'sold', label: 'Sold' },
  { value: 'paused', label: 'Paused' },
  { value: 'archived', label: 'Archived' },
] as const;

function formatCondition(condition: string | null | undefined) {
  if (!condition) return '—';
  return condition.replace(/[_-]/g, ' ');
}

export function ListingsClient({
  data,
  filters,
}: {
  data: Paged<AdminPost>;
  filters: PostFilters;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(filters.title ?? '');
  const [priceMin, setPriceMin] = useState(
    filters.priceMin !== undefined ? String(filters.priceMin) : '',
  );
  const [priceMax, setPriceMax] = useState(
    filters.priceMax !== undefined ? String(filters.priceMax) : '',
  );
  const [category, setCategory] = useState(filters.category ?? '');
  const [memberId, setMemberId] = useState(filters.memberId ?? '');
  const [status, setStatus] = useState(filters.status ?? '');

  // The category list is derived from the rows on screen, so the active
  // filter has to be unioned in — otherwise filtering to a category that
  // isn't on the current page resets the select to "All" on every render.
  const categories = Array.from(
    new Set([...data.items.map((p) => p.category).filter(Boolean), category].filter(Boolean)),
  ).sort();

  const hasFilters = Boolean(title || priceMin || priceMax || category || memberId || status);

  const pushFilters = (next: Partial<Record<string, string | number | undefined>>) => {
    const merged: Record<string, string> = {};
    const final = {
      title,
      priceMin: priceMin || undefined,
      priceMax: priceMax || undefined,
      category,
      memberId,
      status,
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

  const clearFilters = () => {
    setTitle('');
    setPriceMin('');
    setPriceMax('');
    setCategory('');
    setMemberId('');
    setStatus('');
    startTransition(() => router.replace(pathname));
  };

  const openRow = (e: React.MouseEvent<HTMLTableRowElement>, id: string) => {
    if ((e.target as HTMLElement).closest('a, button, input, select')) return;
    router.push(`/listings/${id}`);
  };

  const totalPages = Math.max(1, Math.ceil(data.total / Math.max(1, data.pageSize)));

  return (
    <div className="space-y-6 px-8 pb-8">
      <form onSubmit={onSearch}>
        <SearchCard title="Listing search" total={data.total} label="listings">
          <SearchField label="Item title">
            <input
              className="pill-input"
              placeholder="Desk lamp"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </SearchField>
          <SearchField label="Price range">
            <div className="flex items-center gap-2">
              <input
                className="pill-input tnum"
                type="number"
                min={0}
                inputMode="numeric"
                aria-label="Minimum price"
                placeholder="Min"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
              />
              <span aria-hidden="true" className="text-ink-400">
                –
              </span>
              <input
                className="pill-input tnum"
                type="number"
                min={0}
                inputMode="numeric"
                aria-label="Maximum price"
                placeholder="Max"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
              />
            </div>
          </SearchField>
          <SearchField label="Category">
            <select
              className="pill-select"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                pushFilters({ category: e.target.value, page: 1 });
              }}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </SearchField>
          <SearchField label="Status">
            <select
              className="pill-select"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                pushFilters({ status: e.target.value, page: 1 });
              }}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
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

      <Card bleed>
        {data.items.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title={hasFilters ? 'No listings match these filters' : 'No listings yet'}
            description={
              hasFilters
                ? 'Try a shorter title, a wider price range, or clear the category.'
                : 'Items appear here as soon as a member publishes one.'
            }
            action={
              hasFilters ? (
                <button type="button" onClick={clearFilters} className="btn btn-pill-ghost">
                  Clear filters
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div
              aria-busy={isPending}
              className={clsx(
                'scroll-slim overflow-x-auto transition-opacity duration-150',
                isPending && 'opacity-60',
              )}
            >
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="w-14">Photo</th>
                    <th>Item title</th>
                    <th>Item ID</th>
                    <th>Seller</th>
                    <th>Category</th>
                    <th>Condition</th>
                    <th className="text-right">Price</th>
                    <th>Created</th>
                    <th className="text-right">Status</th>
                    <th className="w-10" aria-label="Open" />
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((p) => (
                    <tr
                      key={p.id}
                      onClick={(e) => openRow(e, p.id)}
                      className="group cursor-pointer"
                    >
                      <td className="w-14">
                        <Thumbnail src={p.photos?.[0]} />
                      </td>
                      {/* The photo owns the first column, so the identity
                          styling `.data-table` gives it has to be restated
                          here on the title. */}
                      <td className="max-w-[18rem] truncate font-medium text-ink-900">
                        <Link
                          href={`/listings/${p.id}`}
                          className="rounded-sm group-hover:underline"
                        >
                          {p.title || 'Untitled listing'}
                        </Link>
                      </td>
                      <td className="tnum">i{p.id}</td>
                      <td>
                        {p.seller ? (
                          <Link
                            href={`/users/${p.seller.id}`}
                            className="rounded-sm hover:text-ink-900 hover:underline"
                          >
                            {p.seller.name || `m${p.seller.id}`}
                          </Link>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>{p.category || '—'}</td>
                      <td className="capitalize">{formatCondition(p.condition)}</td>
                      <td className="tnum text-right text-ink-900">
                        {formatMoney(p.price, p.currency)}
                      </td>
                      <td title={formatDateTime(p.createdAt)}>{formatRelative(p.createdAt)}</td>
                      <td className="text-right">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="w-10 text-right">
                        <ChevronRight
                          size={16}
                          strokeWidth={2}
                          aria-hidden="true"
                          className="inline-block text-ink-300 transition-colors group-hover:text-ink-600"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-ink-100 px-5">
              <Pagination
                page={data.page}
                totalPages={totalPages}
                total={data.total}
                pageSize={data.pageSize}
                onChange={(p) => pushFilters({ page: p })}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

function Thumbnail({ src }: { src?: string | null }) {
  return (
    <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-control bg-ink-50 ring-1 ring-ink-100">
      {isImageSrc(src) ? (
        <Image src={src} alt="" fill sizes="40px" className="object-cover" />
      ) : (
        <ImageOff size={14} strokeWidth={1.8} aria-hidden="true" className="text-ink-300" />
      )}
    </span>
  );
}
