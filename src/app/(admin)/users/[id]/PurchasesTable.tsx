'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/ui';
import { formatDateTime, formatMoney, formatRelative } from '@/lib/format';
import type { AdminUserPurchase, Paged } from '@/lib/types';
import { TableScroll, TruncationNote } from './ActivityChrome';

/** What this member has bought, newest first as the backend returns it. */
export function PurchasesTable({ purchases }: { purchases: Paged<AdminUserPurchase> }) {
  if (purchases.items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="No purchases yet"
        description="Completed and in-flight orders placed by this member will appear here."
      />
    );
  }

  return (
    <>
      <TableScroll>
        <table className="data-table">
          <thead>
            <tr>
              <th>Item title</th>
              <th>Item ID</th>
              <th>Seller</th>
              <th>Category</th>
              <th className="text-right">Amount</th>
              <th>Date</th>
              <th className="text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {purchases.items.map((t) => {
              const when = t.date || t.createdAt;
              return (
                <tr key={t.id}>
                  <td className="max-w-[16rem] truncate">
                    <Link href={`/listings/${t.postId}`} className="rounded-sm hover:underline">
                      {t.postTitle || 'Untitled listing'}
                    </Link>
                  </td>
                  <td className="tnum">i{t.postId}</td>
                  <td>{t.seller || '—'}</td>
                  <td>{t.category ?? '—'}</td>
                  <td className="tnum text-right text-ink-900">
                    {formatMoney(t.amount, t.currency)}
                  </td>
                  <td title={formatDateTime(when)}>{formatRelative(when)}</td>
                  <td className="text-right">
                    <StatusBadge status={t.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableScroll>

      <TruncationNote shown={purchases.items.length} total={purchases.total} noun="purchases" />
    </>
  );
}
