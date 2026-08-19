import type { ReactNode } from 'react';
import { formatNumber } from '@/lib/format';

/** Horizontal scroll container for a full-bleed table inside the panel. */
export function TableScroll({ children }: { children: ReactNode }) {
  return <div className="scroll-slim overflow-x-auto">{children}</div>;
}

/**
 * States plainly that a tab is showing a slice of a larger set.
 *
 * The user-detail sub-resources (`/admin/users/:id/posts`, `/purchases`) are
 * fetched without page params, so there is no second page to reach — printing
 * a pager here would be a control that cannot do anything. Saying what is on
 * screen is the honest version until those fetchers take a page.
 */
export function TruncationNote({
  shown,
  total,
  noun,
}: {
  shown: number;
  total: number;
  noun: string;
}) {
  if (total <= shown) return null;

  return (
    <p className="tnum border-t border-ink-100 px-5 py-3 text-2xs text-ink-500">
      Showing {formatNumber(shown)} of {formatNumber(total)} {noun}.
    </p>
  );
}
