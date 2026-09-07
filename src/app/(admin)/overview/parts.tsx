import { ArrowUpRight, TriangleAlert } from 'lucide-react';
import clsx from 'clsx';
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { StatDelta } from '@/components/ui';
import { formatDeltaPoints } from '@/lib/format';
import { computeDelta, formatDelta } from '@/lib/metrics';
import { buildPeriodParams, type PeriodParams } from '@/lib/period';

/**
 * Delta builders for `StatCard`.
 *
 * Every one returns the `{ raw, formatted }` pair the card expects, and every
 * call site keeps the `prev ? … : undefined` shape — an absent `previousTotals`
 * means "no comparison available", which is a different claim from a zero
 * baseline and must not render a chip.
 */

/** Period-over-period change in a count or a money total, as a percentage. */
export function pctDelta(current: number, previous: number): StatDelta {
  const delta = computeDelta(current, previous);
  return { raw: delta.raw, formatted: formatDelta(delta) };
}

/**
 * The same chip for a metric where up is bad — reports filed, failures, backlog.
 *
 * Only `raw` is negated, because the card reads nothing but its sign to pick a
 * colour. The printed figure keeps the true direction, so a rise still reads
 * "+18.2%" while wearing the warning colour.
 */
export function invertedPctDelta(current: number, previous: number): StatDelta {
  const delta = computeDelta(current, previous);
  return { raw: -delta.raw, formatted: formatDelta(delta) };
}

/**
 * Change between two RATES, in percentage points.
 *
 * Both operands are fractions, so their difference is already a point
 * difference (0.02 = 2pp). Rendering it as a percentage change would claim a
 * rate moving 10% → 12% had risen 20%.
 */
export function pointsDelta(current: number, previous: number): StatDelta {
  const delta = computeDelta(current, previous);
  return { raw: delta.raw, formatted: formatDeltaPoints(delta.raw) };
}

/** `pointsDelta` for a rate where up is bad — zero-result share, drop-off. */
export function invertedPointsDelta(current: number, previous: number): StatDelta {
  const delta = computeDelta(current, previous);
  return { raw: -delta.raw, formatted: formatDeltaPoints(delta.raw) };
}

/**
 * Href for a sibling page that carries the selected window along, so "Full
 * funnel" opens on the same dates the digest was showing.
 */
export function periodHref(
  pathname: string,
  period: PeriodParams,
  extra: Record<string, string> = {},
): string {
  const params = new URLSearchParams({ ...extra, ...buildPeriodParams(period) });
  return `${pathname}?${params.toString()}`;
}

/** Quiet "open the full page" link for a card header. */
export function DetailLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 rounded-control text-2xs font-semibold text-ink-600 hover:text-ink-900"
    >
      {children}
      <ArrowUpRight aria-hidden="true" size={13} strokeWidth={2.25} />
    </Link>
  );
}

/**
 * One section's fetch failed. Stated inline where its cards would be, rather
 * than as an empty state: nothing is missing from the data, the request is.
 */
export function SectionError({ label }: { label: string }) {
  return (
    <div
      role="status"
      className="flex items-start gap-2.5 rounded-panel border border-danger-100 bg-danger-50 px-4 py-3"
    >
      <TriangleAlert
        aria-hidden="true"
        size={16}
        strokeWidth={2}
        className="mt-px shrink-0 text-danger-700"
      />
      <p className="text-data text-danger-700">
        <span className="font-semibold">{label}</span> could not be loaded. Refresh to try
        again.
      </p>
    </div>
  );
}

/** Even strip of stat tiles. Two up on phones, `cols` across from `lg`. */
export function StatGrid({
  cols = 4,
  children,
}: {
  cols?: 2 | 3 | 4 | 5;
  children: ReactNode;
}) {
  return (
    <div
      className={clsx(
        'grid grid-cols-2 gap-4',
        cols === 2 && 'lg:grid-cols-2',
        cols === 3 && 'lg:grid-cols-3',
        cols === 4 && 'lg:grid-cols-4',
        cols === 5 && 'lg:grid-cols-5',
      )}
    >
      {children}
    </div>
  );
}

/** Quiet divider label above a secondary strip. */
export function StripLabel({ children }: { children: ReactNode }) {
  return <h3 className="label-micro">{children}</h3>;
}

/**
 * Pull one numeric column out of a gap-filled daily series, for a sparkline.
 *
 * Within a series that has values, a hole reads as 0 — `fillDailySeries` has
 * already zero-filled the absent days, so what is left is a malformed row.
 * A column with no numeric value anywhere returns empty instead, which makes
 * the sparkline hold its slot rather than draw a flat zero line: a backend
 * that sent totals but no daily breakdown must not look like a quiet month.
 */
export function columnOf<T extends Record<string, unknown>>(rows: T[], key: string): number[] {
  let seen = false;
  const values = rows.map((row) => {
    const value = row?.[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      seen = true;
      return value;
    }
    return 0;
  });
  return seen ? values : [];
}
