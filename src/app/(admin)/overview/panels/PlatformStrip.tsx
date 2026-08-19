import { Sparkline } from '@/components/charts';
import { StatCard } from '@/components/ui';
import { formatNumber, formatPercent } from '@/lib/format';
import { fillDailySeries, safeRate, sumBy } from '@/lib/metrics';
import type { PeriodRange } from '@/lib/period';
import type { OverviewActivityPoint, OverviewStats } from '@/lib/types';
import { StatGrid, columnOf } from '../parts';

/**
 * Where the marketplace stands right now, above whichever section is open.
 *
 * Four of the five are stocks — counts of what exists at this moment, with no
 * period to compare against — so they carry a live tick. The fifth is the one
 * flow in this payload, and takes the strip's only trend line.
 */
export function PlatformStrip({
  data,
  period,
}: {
  data: OverviewStats;
  period: PeriodRange;
}) {
  const totals = data.totals;
  const days = fillDailySeries<OverviewActivityPoint>(
    data.activityByDay,
    period.from,
    period.to,
  );
  const newListings = sumBy(days, (day) => day.listings);
  const verifiedShare = safeRate(totals.verifiedUsers, totals.users);

  return (
    <StatGrid cols={5}>
      <StatCard label="Users" value={formatNumber(totals.users)} isSnapshot />
      <StatCard
        label="Verified users"
        value={formatNumber(totals.verifiedUsers)}
        isSnapshot
        hint={`${formatPercent(verifiedShare)} of users`}
      />
      <StatCard
        label="Active listings"
        value={formatNumber(totals.activeListings)}
        isSnapshot
      />
      <StatCard label="Open reports" value={formatNumber(totals.openReports)} isSnapshot />
      <StatCard
        label="New listings"
        value={formatNumber(newListings)}
        hint="This period"
        footer={<Sparkline data={columnOf(days, 'listings')} />}
      />
    </StatGrid>
  );
}
