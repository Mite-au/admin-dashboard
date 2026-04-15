'use client';

import { useMemo, useState } from 'react';
import { TableToolbar } from '@/components/TableToolbar';
import { Pagination } from '@/components/Pagination';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate, formatNumber } from '@/lib/format';
import type { AdminThread, Paged } from '@/lib/types';

type Tab = 'all' | 'active' | 'flagged' | 'archived';

const tabs: { label: string; value: Tab }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Flagged', value: 'flagged' },
  { label: 'Archived', value: 'archived' },
];

export function ThreadsClient({ data }: { data: Paged<AdminThread> }) {
  const [tab, setTab] = useState<Tab>('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(data.page);

  const rows = useMemo(
    () =>
      data.items.filter((t) => {
        if (tab !== 'all' && t.status !== tab) return false;
        if (q && !t.name.toLowerCase().includes(q.toLowerCase())) return false;
        return true;
      }),
    [data.items, tab, q],
  );

  return (
    <div className="card space-y-4">
      <TableToolbar<Tab>
        statusValue={tab}
        statusOptions={tabs}
        onStatusChange={setTab}
        onSearch={setQ}
        placeholder="Search thread…"
      />
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Members</th>
              <th>Messages</th>
              <th>Created</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id}>
                <td className="font-medium text-ink-900">{t.name}</td>
                <td className="capitalize">{t.type}</td>
                <td>{formatNumber(t.memberCount)}</td>
                <td>{formatNumber(t.messageCount)}</td>
                <td>{formatDate(t.createdAt)}</td>
                <td><StatusBadge status={t.status} /></td>
                <td>
                  <div className="flex gap-2 text-sm">
                    <button className="text-brand-700 hover:underline">Review</button>
                    <button className="text-danger hover:underline">Archive</button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={7} className="text-center text-ink-500 py-8">No threads match your filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        totalPages={Math.max(1, Math.ceil(data.total / data.pageSize))}
        onChange={setPage}
      />
    </div>
  );
}
