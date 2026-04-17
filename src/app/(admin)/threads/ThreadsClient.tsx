'use client';

import { useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SearchCard, SearchField } from '@/components/SearchCard';
import { Pagination } from '@/components/Pagination';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate, formatNumber } from '@/lib/format';
import type { AdminThread, Paged } from '@/lib/types';
import type { ThreadFilters } from '@/lib/fetchers';

export function ThreadsClient({
  data,
  filters,
}: {
  data: Paged<AdminThread>;
  filters: ThreadFilters;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const [name, setName] = useState(filters.name ?? '');
  const [type, setType] = useState(filters.type ?? '');
  const [minMembers, setMinMembers] = useState(
    filters.minMembers !== undefined ? String(filters.minMembers) : '',
  );
  const [memberId, setMemberId] = useState(filters.memberId ?? '');

  const pushFilters = (next: Partial<ThreadFilters>) => {
    const merged: Record<string, string> = {};
    const final: Record<string, string | number | undefined> = {
      name,
      type,
      minMembers: minMembers === '' ? undefined : Number(minMembers),
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

  const rows = data.items;

  return (
    <div className="px-8 pb-8 space-y-6">
      <form onSubmit={onSearch}>
        <SearchCard title="Thread Search" total={data.total} label="threads">
          <SearchField label="Name">
            <input
              className="pill-input"
              placeholder="Thread name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </SearchField>
          <SearchField label="Type">
            <select
              className="pill-select"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="">All types</option>
              <option value="suburb">Suburb</option>
              <option value="interest">Interest</option>
            </select>
          </SearchField>
          <SearchField label="Min members">
            <input
              className="pill-input"
              placeholder="0"
              inputMode="numeric"
              value={minMembers}
              onChange={(e) => setMinMembers(e.target.value)}
            />
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
            <th>Name</th>
            <th>Type</th>
            <th className="text-right">Members</th>
            <th className="text-right">Messages</th>
            <th>Created</th>
            <th className="text-right pr-6">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.id}>
              <td>
                <input type="checkbox" className="h-4 w-4 rounded border-ink-300" />
              </td>
              <td className="font-medium">{t.name}</td>
              <td className="text-ink-700 capitalize">{t.type}</td>
              <td className="text-right">{formatNumber(t.memberCount)}</td>
              <td className="text-right">{formatNumber(t.messageCount)}</td>
              <td className="text-ink-700">{formatDate(t.createdAt)}</td>
              <td className="text-right pr-6">
                <StatusBadge status={t.status} />
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} className="text-center text-ink-500 py-10">
                No threads match your filters.
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
