'use client';

import { useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SearchCard, SearchField } from '@/components/SearchCard';
import { Pagination } from '@/components/Pagination';
import { StatusBadge } from '@/components/StatusBadge';
import { exportToCsv } from '@/components/ExportCsvButton';
import { formatDate, formatMoney } from '@/lib/format';
import type { TransactionFilters } from '@/lib/fetchers';
import type { AdminTransaction, Paged } from '@/lib/types';

const CSV_COLUMNS = [
  { key: 'transactionId', label: 'Transaction ID' },
  { key: 'item',          label: 'Item' },
  { key: 'buyer',         label: 'Buyer' },
  { key: 'seller',        label: 'Seller' },
  { key: 'amount',        label: 'Amount' },
  { key: 'status',        label: 'Status' },
  { key: 'date',          label: 'Date' },
] as const;

export function TransactionsClient({
  data,
  filters,
}: {
  data: Paged<AdminTransaction>;
  filters: TransactionFilters;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const [postTitle, setPostTitle]         = useState(filters.postTitle ?? '');
  const [buyer, setBuyer]                 = useState(filters.buyer ?? '');
  const [seller, setSeller]               = useState(filters.seller ?? '');
  const [transactionId, setTransactionId] = useState(filters.transactionId ?? '');

  const pushFilters = (next: Partial<Record<string, string | number | undefined>>) => {
    const merged: Record<string, string> = {};
    const final = {
      postTitle,
      buyer,
      seller,
      transactionId,
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

  const handleExport = () => {
    const rows = data.items.map((t) => ({
      transactionId: `t${t.id}`,
      item:          t.postTitle,
      buyer:         t.buyer,
      seller:        t.seller,
      amount:        `${t.amount} ${t.currency}`,
      status:        t.status,
      date:          formatDate(t.createdAt),
    }));
    const filename = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    exportToCsv(rows, [...CSV_COLUMNS], filename);
  };

  return (
    <div className="px-8 pb-8 space-y-6">
      <form onSubmit={onSearch}>
        <SearchCard
          title="Transaction Search"
          total={data.total}
          label="transactions"
          onExport={handleExport}
        >
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
            <input
              className="pill-input"
              placeholder="t_000"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
            />
          </SearchField>
        </SearchCard>
      </form>

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
          {data.items.map((t) => (
            <tr
              key={t.id}
              className="cursor-pointer"
              onClick={() => router.push(`/listings/${t.postId}`)}
            >
              <td onClick={(e) => e.stopPropagation()}>
                <input type="checkbox" className="h-4 w-4 rounded border-ink-300" />
              </td>
              <td className="text-ink-700">{formatDate(t.createdAt)}</td>
              <td className="text-ink-700">t{t.id}</td>
              <td className="font-medium">{t.postTitle}</td>
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
          {data.items.length === 0 && (
            <tr>
              <td colSpan={8} className="text-center text-ink-500 py-10">
                No transactions match your filters.
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
