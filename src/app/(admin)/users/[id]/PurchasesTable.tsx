'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/ui';
import { formatDateTime, formatMoney, formatRelative } from '@/lib/format';
import type { AdminPurchaseParty, AdminUserPurchase, Paged } from '@/lib/types';
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
                  <td>
                    <PartyCell party={t.seller} />
                  </td>
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

/**
 * A counterparty on a purchase.
 *
 * This endpoint sends `{ id, name, email }` where its sibling
 * `/admin/transactions` sends a plain string for the same thing, and rendering
 * the value directly threw "Objects are not valid as a React child" — the
 * whole Purchases tab went to the error boundary. The name is the label, the
 * email is the fallback for an account that never set one, and the id is the
 * last resort so the cell still identifies *someone*.
 */
function PartyCell({ party }: { party: AdminPurchaseParty | null }) {
  if (!party) return <span className="text-ink-400">—</span>;

  const label = party.name || party.email || (party.id ? `m${party.id}` : '');
  if (!label) return <span className="text-ink-400">—</span>;
  if (!party.id) return <span>{label}</span>;

  return (
    <Link
      href={`/users/${party.id}`}
      title={party.email ?? undefined}
      className="rounded-sm hover:underline"
    >
      {label}
    </Link>
  );
}
