'use client';

import { useMemo, useState } from 'react';
import { SearchCard, SearchField } from '@/components/SearchCard';
import { Pagination } from '@/components/Pagination';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate, formatNumber } from '@/lib/format';
import type { AdminThread, Paged } from '@/lib/types';

export function ThreadsClient({ data }: { data: Paged<AdminThread> }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(data.page);

  const rows = useMemo(
    () =>
      data.items.filter((t) => {
        if (name && !t.name.toLowerCase().includes(name.toLowerCase())) return false;
        if (type && type !== 'all' && t.type !== type) return false;
        return true;
      }),
    [data.items, name, type],
  );

  return (
    <div className="px-8 pb-8 space-y-6">
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
          <input className="pill-input" placeholder="0" />
        </SearchField>
        <SearchField label="Member ID">
          <input className="pill-input" placeholder="m124324" />
        </SearchField>
      </SearchCard>

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
        page={page}
        totalPages={Math.max(1, Math.ceil(data.total / data.pageSize))}
        onChange={setPage}
      />
    </div>
  );
}
