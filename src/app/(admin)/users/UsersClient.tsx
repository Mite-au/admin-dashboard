'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { TableToolbar } from '@/components/TableToolbar';
import { Pagination } from '@/components/Pagination';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate, formatNumber } from '@/lib/format';
import type { AdminUser, Paged } from '@/lib/types';

type Tab = 'all' | 'active' | 'suspended' | 'banned' | 'reported';

const tabs: { label: string; value: Tab }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'Banned', value: 'banned' },
  { label: 'Reported', value: 'reported' },
];

export function UsersClient({ data }: { data: Paged<AdminUser> }) {
  const [tab, setTab] = useState<Tab>('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(data.page);

  const rows = useMemo(() => {
    return data.items.filter((u) => {
      if (tab === 'reported') return u.reportsCount > 0;
      if (tab !== 'all' && u.status !== tab) return false;
      if (q && !(`${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase()))) return false;
      return true;
    });
  }, [data.items, tab, q]);

  return (
    <div className="card space-y-4">
      <TableToolbar<Tab>
        statusValue={tab}
        statusOptions={tabs}
        onStatusChange={setTab}
        onSearch={setQ}
        placeholder="Search name or email…"
      />
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th className="w-10">#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Registered</th>
              <th>Posts</th>
              <th>Reports</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u, i) => (
              <tr key={u.id}>
                <td className="text-ink-500">{(page - 1) * data.pageSize + i + 1}</td>
                <td className="font-medium text-ink-900">
                  <Link href={`/users/${u.id}`} className="hover:underline">{u.name}</Link>
                </td>
                <td>{u.email}</td>
                <td>{u.phone}</td>
                <td>{formatDate(u.createdAt)}</td>
                <td>{formatNumber(u.postsCount)}</td>
                <td className={u.reportsCount ? 'text-danger font-medium' : ''}>{u.reportsCount || '—'}</td>
                <td><StatusBadge status={u.status} /></td>
                <td>
                  <Link href={`/users/${u.id}`} className="text-brand-700 text-sm hover:underline">View →</Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={9} className="text-center text-ink-500 py-8">No users match your filters.</td></tr>
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
