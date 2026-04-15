'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { TableToolbar } from '@/components/TableToolbar';
import { Pagination } from '@/components/Pagination';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate, formatMoney } from '@/lib/format';
import type { AdminPost, Paged } from '@/lib/types';

type Tab = 'all' | 'published' | 'sold' | 'paused' | 'archived' | 'reported';

const tabs: { label: string; value: Tab }[] = [
  { label: 'All', value: 'all' },
  { label: 'Published', value: 'published' },
  { label: 'Sold', value: 'sold' },
  { label: 'Paused', value: 'paused' },
  { label: 'Archived', value: 'archived' },
  { label: 'Reported', value: 'reported' },
];

export function ListingsClient({ data }: { data: Paged<AdminPost> }) {
  const [tab, setTab] = useState<Tab>('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(data.page);

  const rows = useMemo(() => {
    return data.items.filter((p) => {
      if (tab === 'reported') return p.reportsCount > 0;
      if (tab !== 'all' && p.status !== tab) return false;
      if (q && !(`${p.title} ${p.seller.name}`.toLowerCase().includes(q.toLowerCase()))) return false;
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
        placeholder="Search title or seller…"
      />
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th className="w-10">#</th>
              <th>Title</th>
              <th>Seller</th>
              <th>Category</th>
              <th>Condition</th>
              <th>Price</th>
              <th>Status</th>
              <th>Reports</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => (
              <tr key={p.id}>
                <td className="text-ink-500">{(page - 1) * data.pageSize + i + 1}</td>
                <td className="font-medium text-ink-900">
                  <Link href={`/listings/${p.id}`} className="hover:underline">{p.title}</Link>
                </td>
                <td><Link href={`/users/${p.seller.id}`} className="hover:underline">{p.seller.name}</Link></td>
                <td>{p.category}</td>
                <td className="capitalize">{p.condition.replace('-', ' ')}</td>
                <td>{formatMoney(p.price, p.currency)}</td>
                <td><StatusBadge status={p.status} /></td>
                <td className={p.reportsCount ? 'text-danger font-medium' : ''}>{p.reportsCount || '—'}</td>
                <td>{formatDate(p.createdAt)}</td>
                <td>
                  <Link href={`/listings/${p.id}`} className="text-brand-700 text-sm hover:underline">View →</Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={10} className="text-center text-ink-500 py-8">No listings match your filters.</td></tr>
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
