'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { TableToolbar } from '@/components/TableToolbar';
import { Pagination } from '@/components/Pagination';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDateTime, formatMoney } from '@/lib/format';
import type { AdminTransaction, Paged } from '@/lib/types';

type Tab = 'all' | 'pending' | 'completed' | 'cancelled' | 'disputed';

const tabs: { label: string; value: Tab }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Disputed', value: 'disputed' },
];

export function TransactionsClient({ data }: { data: Paged<AdminTransaction> }) {
  const [tab, setTab] = useState<Tab>('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(data.page);

  const rows = useMemo(
    () =>
      data.items.filter((t) => {
        if (tab !== 'all' && t.status !== tab) return false;
        if (q && !(`${t.postTitle} ${t.buyer} ${t.seller}`.toLowerCase().includes(q.toLowerCase())))
          return false;
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
        placeholder="Search item, buyer or seller…"
      />
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Item</th>
              <th>Buyer</th>
              <th>Seller</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id}>
                <td className="text-ink-500">{t.id}</td>
                <td className="font-medium"><Link href={`/listings/${t.postId}`} className="hover:underline">{t.postTitle}</Link></td>
                <td>{t.buyer}</td>
                <td>{t.seller}</td>
                <td>{formatMoney(t.amount, t.currency)}</td>
                <td><StatusBadge status={t.status} /></td>
                <td>{formatDateTime(t.createdAt)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={7} className="text-center text-ink-500 py-8">No transactions match your filters.</td></tr>
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
