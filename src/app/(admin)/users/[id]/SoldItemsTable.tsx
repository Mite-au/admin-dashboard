'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, PackageSearch } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/ui';
import { formatDateTime, formatMoney, formatRelative } from '@/lib/format';
import type { AdminPost, Paged } from '@/lib/types';
import { TableScroll, TruncationNote } from './ActivityChrome';

/**
 * Everything this member has listed.
 *
 * The status shown is the post's own status. The previous version hard-coded
 * "complete" for every row in this tab, which made a paused or archived
 * listing look like a finished sale.
 */
export function SoldItemsTable({ posts }: { posts: Paged<AdminPost> }) {
  const router = useRouter();

  if (posts.items.length === 0) {
    return (
      <EmptyState
        icon={PackageSearch}
        title="Nothing listed yet"
        description="Items this member posts to the marketplace will appear here."
      />
    );
  }

  const openRow = (e: React.MouseEvent<HTMLTableRowElement>, id: string) => {
    if ((e.target as HTMLElement).closest('a, button')) return;
    router.push(`/listings/${id}`);
  };

  return (
    <>
      <TableScroll>
        <table className="data-table">
          <thead>
            <tr>
              <th>Item title</th>
              <th>Item ID</th>
              <th>Category</th>
              <th className="text-right">Price</th>
              <th>Listed</th>
              <th className="text-right">Status</th>
              <th className="w-10" aria-label="Open" />
            </tr>
          </thead>
          <tbody>
            {posts.items.map((p) => (
              <tr key={p.id} onClick={(e) => openRow(e, p.id)} className="group cursor-pointer">
                <td className="max-w-[16rem] truncate">
                  <Link href={`/listings/${p.id}`} className="rounded-sm group-hover:underline">
                    {p.title || 'Untitled listing'}
                  </Link>
                </td>
                <td className="tnum">i{p.id}</td>
                <td>{p.category || '—'}</td>
                <td className="tnum text-right text-ink-900">
                  {formatMoney(p.price, p.currency)}
                </td>
                <td title={formatDateTime(p.createdAt)}>{formatRelative(p.createdAt)}</td>
                <td className="text-right">
                  <StatusBadge status={p.status} />
                </td>
                <td className="w-10 text-right">
                  <ChevronRight
                    size={16}
                    strokeWidth={2}
                    aria-hidden="true"
                    className="inline-block text-ink-300 transition-colors group-hover:text-ink-600"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableScroll>

      <TruncationNote shown={posts.items.length} total={posts.total} noun="listings" />
    </>
  );
}
