'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';
import { SearchCard, SearchField } from '@/components/SearchCard';
import { Pagination } from '@/components/Pagination';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate, formatMoney } from '@/lib/format';
import type { AdminPost, Paged } from '@/lib/types';

export function ListingsClient({ data }: { data: Paged<AdminPost> }) {
  const [title, setTitle] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [category, setCategory] = useState('');
  const [memberId, setMemberId] = useState('');
  const [page, setPage] = useState(data.page);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const rows = useMemo(() => {
    return data.items.filter((p) => {
      if (title && !p.title.toLowerCase().includes(title.toLowerCase())) return false;
      if (priceMin && p.price < Number(priceMin)) return false;
      if (priceMax && p.price > Number(priceMax)) return false;
      if (category && category !== 'all' && p.category !== category) return false;
      if (memberId && !p.seller.id.includes(memberId)) return false;
      return true;
    });
  }, [data.items, title, priceMin, priceMax, category, memberId]);

  const categories = Array.from(new Set(data.items.map((p) => p.category)));

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="px-8 pb-8 space-y-6">
      <SearchCard title="Listing Search" total={data.total} label="listings">
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
          {rows.map((p) => (
            <tr key={p.id}>
              <td>
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-ink-300"
                  checked={selected.has(p.id)}
                  onChange={() => toggle(p.id)}
                />
              </td>
              <td>
                <div className="h-10 w-10 rounded-md bg-ink-100 overflow-hidden relative">
                  {p.photos[0] && (
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
              <td className="font-medium">
                <Link href={`/listings/${p.id}`} className="hover:underline">
                  {p.title}
                </Link>
              </td>
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
          {rows.length === 0 && (
            <tr>
              <td colSpan={9} className="text-center text-ink-500 py-10">
                No listings match your filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <Pagination
        page={page}
        totalPages={Math.max(1, Math.ceil(data.total / data.pageSize))}
        onChange={setPage}
      />
    </div>
  );
}
