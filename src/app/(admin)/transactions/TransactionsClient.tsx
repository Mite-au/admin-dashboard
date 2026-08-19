'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Download, Receipt, SearchX } from 'lucide-react';
import { SearchCard, SearchField } from '@/components/SearchCard';
import { Pagination } from '@/components/Pagination';
import { StatusBadge } from '@/components/StatusBadge';
import { exportToCsv } from '@/components/ExportCsvButton';
import { Card, EmptyState } from '@/components/ui';
import { formatDate, formatDateTime, formatMoney, formatNumber } from '@/lib/format';
import type { TransactionFilters } from '@/lib/fetchers';
import type { AdminTransaction, Paged } from '@/lib/types';

const CSV_COLUMNS = [
  { key: 'transactionId', label: 'Transaction ID' },
  { key: 'item', label: 'Item' },
  { key: 'buyer', label: 'Buyer' },
  { key: 'seller', label: 'Seller' },
  { key: 'amount', label: 'Amount' },
  { key: 'currency', label: 'Currency' },
  { key: 'status', label: 'Status' },
  { key: 'date', label: 'Date' },
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

  const [postTitle, setPostTitle] = useState(filters.postTitle ?? '');
  const [buyer, setBuyer] = useState(filters.buyer ?? '');
  const [seller, setSeller] = useState(filters.seller ?? '');
  const [transactionId, setTransactionId] = useState(filters.transactionId ?? '');

  const rows = data.items;
  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));
  const hasFilters = Boolean(
    filters.postTitle || filters.buyer || filters.seller || filters.transactionId,
  );

  const pushFilters = (next: Partial<Record<string, string | number | undefined>>) => {
    const merged: Record<string, string> = {};
    const final = { postTitle, buyer, seller, transactionId, page: filters.page, ...next };
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
    setPostTitle('');
    setBuyer('');
    setSeller('');
    setTransactionId('');
    startTransition(() => router.replace(pathname));
  };

  /**
   * Exports the rows currently on screen — not the whole result set. The
   * button says "page" for that reason: there is no bulk endpoint behind it,
   * and a CSV silently truncated at the page boundary is how a reconciliation
   * goes wrong.
   */
  const handleExport = () => {
    const csvRows = rows.map((t) => ({
      transactionId: t.id,
      item: t.postTitle,
      buyer: t.buyer,
      seller: t.seller,
      amount: t.amount,
      currency: t.currency,
      status: t.status,
      date: formatDate(t.createdAt),
    }));
    exportToCsv(
      csvRows,
      [...CSV_COLUMNS],
      `transactions-page-${data.page}-${new Date().toISOString().slice(0, 10)}.csv`,
    );
  };

  return (
    <div className="space-y-6 px-8 pb-8">
      <form onSubmit={onSearch}>
        <SearchCard title="Transaction Search" total={formatNumber(data.total)} label="transactions">
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
              placeholder="Exact ID"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
            />
          </SearchField>
        </SearchCard>
      </form>

      <Card
        bleed
        title="Orders"
        actions={
          rows.length > 0 ? (
            <button
              type="button"
              onClick={handleExport}
              className="btn-icon"
              title={`Downloads the ${rows.length} order${rows.length === 1 ? '' : 's'} shown on this page. Other pages are not included.`}
            >
              <Download size={14} strokeWidth={1.9} />
              Export page
            </button>
          ) : undefined
        }
      >
        {rows.length === 0 ? (
          hasFilters ? (
            <EmptyState
              icon={SearchX}
              title="No matching orders"
              description="No transaction matches these filters. Widen the search or clear it to see the full ledger."
              action={
                <button type="button" onClick={clearFilters} className="btn btn-pill-ghost">
                  Clear filters
                </button>
              }
            />
          ) : (
            <EmptyState
              icon={Receipt}
              title="No transactions yet"
              description="Orders appear here as soon as buyers and sellers start completing deals on the marketplace."
            />
          )
        ) : (
          <div className="scroll-slim overflow-x-auto">
            <table className="data-table">
              <caption className="sr-only">
                Marketplace transactions, page {data.page} of {totalPages}
              </caption>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Transaction ID</th>
                  <th>Item</th>
                  <th>Buyer</th>
                  <th>Seller</th>
                  <th className="text-right">Amount</th>
                  <th className="pr-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => {
                  const href = t.postId ? `/listings/${t.postId}` : null;
                  return (
                    <tr
                      key={t.id}
                      className={href ? 'cursor-pointer' : undefined}
                      onClick={href ? () => router.push(href) : undefined}
                    >
                      <td>
                        <span title={formatDateTime(t.createdAt)}>{formatDate(t.createdAt)}</span>
                      </td>
                      <td className="text-ink-600">{t.id}</td>
                      <td>
                        {href ? (
                          <Link
                            href={href}
                            onClick={(e) => e.stopPropagation()}
                            className="font-medium text-ink-900 hover:text-brand-600 hover:underline"
                          >
                            {t.postTitle}
                          </Link>
                        ) : (
                          <span className="font-medium text-ink-900">{t.postTitle}</span>
                        )}
                      </td>
                      <td>{t.buyer}</td>
                      <td>{t.seller}</td>
                      <td className="text-right font-medium text-ink-900">
                        {formatMoney(t.amount, t.currency)}
                      </td>
                      <td className="pr-5 text-right">
                        <StatusBadge status={t.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Pagination
        page={data.page}
        totalPages={totalPages}
        total={data.total}
        pageSize={data.pageSize}
        onChange={(p) => pushFilters({ page: p })}
      />
    </div>
  );
}
