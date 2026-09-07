import { StatCard } from '@/components/ui';
import { formatMoney, formatNumber, formatPercent } from '@/lib/format';
import { safeRate } from '@/lib/metrics';
import { rangeLengthDays, type PeriodRange } from '@/lib/period';
import type { OverviewStats, ReportsOverview } from '@/lib/types';
import { StatGrid } from '../parts';

/**
 * Where the marketplace stands right now, above whichever section is open.
 *
 * Every figure here is a stock — a count of what exists at this moment, with
 * no period to compare against — so each carries a live tick. The period
 * flows live in the digest above; this strip only answers "how big is it".
 *
 * Open reports prefers the reports overview's figure, which counts all four
 * report tables. The platform overview's own `openReports` covers post and
 * user reports only, and is used (and labelled) as the fallback.
 */
export function PlatformStrip({
  data,
  reports,
  period,
}: {
  data: OverviewStats;
  reports: ReportsOverview | null;
  period: PeriodRange;
}) {
  const totals = data.totals;
  const verifiedShare = safeRate(totals.verifiedUsers, totals.users);

  const sold = totals.soldPosts;
  const soldShare = sold === undefined ? null : safeRate(sold, sold + totals.activeListings);
  const soldHint =
    sold === undefined
      ? 'Not computed by the backend'
      : [
          soldShare === null ? 'All time' : `${formatPercent(soldShare)} sold-through (sold ÷ sold + active)`,
          totals.revenue === undefined ? null : `${formatMoney(totals.revenue, null, { digits: 0 })} asking value`,
        ]
          .filter(Boolean)
          .join(' · ');

  const openReports = reports ? reports.totals.openReports : totals.openReports;
  const days = rangeLengthDays(period);
  const resolvedPerDay = reports && days > 0 ? reports.totals.resolvedReportsCount / days : 0;
  const backlogDays = resolvedPerDay > 0 ? openReports / resolvedPerDay : null;
  const reportsHint = !reports
    ? 'Post and user reports only'
    : openReports === 0
      ? 'Nothing waiting'
      : backlogDays === null
        ? 'Nothing resolved this period'
        : `${backlogDays.toFixed(backlogDays >= 10 ? 0 : 1)} days to clear at this period's pace`;

  return (
    <StatGrid cols={5}>
      <StatCard label="Users" value={formatNumber(totals.users)} isSnapshot />
      <StatCard
        label="Verified users"
        value={formatNumber(totals.verifiedUsers)}
        isSnapshot
        hint={`${formatPercent(verifiedShare)} of users`}
      />
      <StatCard label="Active listings" value={formatNumber(totals.activeListings)} isSnapshot />
      <StatCard
        label="Sold listings"
        value={sold === undefined ? '—' : formatNumber(sold)}
        isSnapshot
        hint={soldHint}
      />
      <StatCard label="Open reports" value={formatNumber(openReports)} isSnapshot hint={reportsHint} />
    </StatGrid>
  );
}
