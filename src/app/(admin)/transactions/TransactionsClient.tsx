'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { SearchCard, SearchField } from '@/components/SearchCard';
import { Pagination } from '@/components/Pagination';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate, formatMoney } from '@/lib/format';
import type { AdminTransaction, Paged } from '@/lib/types';

export function TransactionsClient({ data }: { data: Paged<AdminTransaction> }) {
  const [postTitle, setPostTitle] = useState('');
  const [buyer, setBuyer] = useState('');
  const [seller, setSeller] = useState('');
  const [page, setPage] = useState(data.page);

  const rows = useMemo(
    () =>
      data.items.filter((t) => {
        if (postTitle && !t.postTitle.toLowerCase().includes(postTitle.toLowerCase()))
          return false;
        if (buyer && !t.buyer.toLowerCase().includes(buyer.toLowerCase())) return false;
        if (seller && !t.seller.toLowerCase().includes(seller.toLowerCase())) return false;
        return true;
      }),
    [data.items, postTitle, buyer, seller],
  );

  return (
    <div className="px-8 pb-8 space-y-6">
      <SearchCard title="Transaction Search" total={data.total} label="transactions">
        <SearchField label="Item title">
          <input
            className="pill-input"
            placeholder="Item title"
            value={postTitle}
            onChange={(e) => setPostTitle(e.target.value)}
          />
        </SearchField>
        <SearchField label="Buyer">
          <input
            className="pill-input"
            placeholder="Buyer name"
            value={buyer}
            onChange={(e) => setBuyer(e.target.value)}
          />
        </SearchField>
        <SearchField label="Seller">
          <input
            className="pill-input"
            placeholder="Seller name"
            value={seller}
            onChange={(e) => setSeller(e.target.value)}
          />
        </SearchField>
        <SearchField label="Transaction ID">
          <input className="pill-input" placeholder="t_000" />
        </SearchField>
      </SearchCard>

      <table className="data-table">
        <thead>
          <tr>
            <th className="w-10"></th>
            <th>Date</th>
            <th>Transaction ID</th>
            <th>Item</th>
            <th>Buyer</th>
            <th>Seller</th>
            <th className="text-right">Amount</th>
            <th className="text-right pr-6">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.id}>
              <td>
                <input type="checkbox" className="h-4 w-4 rounded border-ink-300" />
              </td>
              <td className="text-ink-700">{formatDate(t.createdAt)}</td>
              <td className="text-ink-700">t{t.id}</td>
              <td className="font-medium">
                <Link href={`/listings/${t.postId}`} className="hover:underline">
                  {t.postTitle}
                </Link>
              </td>
              <td className="text-ink-700">{t.buyer}</td>
              <td className="text-ink-700">{t.seller}</td>
              <td className="text-right">{formatMoney(t.amount, t.currency)}</td>
              <td className="text-right pr-6">
                <StatusBadge
                  status={
                    t.status === 'completed'
                      ? 'complete'
                      : t.status === 'disputed'
                        ? 'fail'
                        : t.status === 'pending'
                          ? 'in progress'
                          : t.status
                  }
                />
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={8} className="text-center text-ink-500 py-10">
                No transactions match your filters.
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
