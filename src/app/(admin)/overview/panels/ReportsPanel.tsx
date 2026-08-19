import { Sparkline, TimeSeriesChart } from '@/components/charts';
import { Card, StatCard } from '@/components/ui';
import { formatNumber } from '@/lib/format';
import { fillDailySeries } from '@/lib/metrics';
import { periodLabel, type PeriodRange } from '@/lib/period';
import type { ReportsActivityPoint, ReportsOverview } from '@/lib/types';
import { SectionError, StatGrid, columnOf, invertedPctDelta, pctDelta } from '../parts';

/**
 * Trust and safety. Two of these three metrics invert the usual reading:
 * more reports filed is worse, more resolved is better, and the open backlog
 * is a point-in-time reading with no period counterpart to compare against —
 * which is why it carries a live tick rather than a delta.
 */
export function ReportsPanel({
  data,
  period,
}: {
  data: ReportsOverview | null;
  period: PeriodRange;
}) {
  if (!data) return <SectionError label="Reports overview" />;

  const totals = data.totals;
  const prev = data.previousTotals;
  const days = fillDailySeries<ReportsActivityPoint>(
    data.activityByDay,
    period.from,
    period.to,
  );

  return (
    <>
      <StatGrid cols={3}>
        <StatCard
          label="Open reports"
          value={formatNumber(totals.openReports)}
          isSnapshot
          hint="Current backlog"
        />
        <StatCard
          label="Reports filed"
          value={formatNumber(totals.reportsCreatedCount)}
          // Up is bad here, so the chip's colour is driven by the negated sign
          // while the printed figure keeps the true direction.
          delta={
            prev ? invertedPctDelta(totals.reportsCreatedCount, prev.reportsCreatedCount) : undefined
          }
          footer={<Sparkline data={columnOf(days, 'reportsCreated')} />}
        />
        <StatCard
          label="Reports resolved"
          value={formatNumber(totals.resolvedReportsCount)}
          delta={
            prev ? pctDelta(totals.resolvedReportsCount, prev.resolvedReportsCount) : undefined
          }
        />
      </StatGrid>

      <Card title="Filed against resolved" subtitle={periodLabel(period)}>
        {/* The gap between the two lines is the backlog changing shape. */}
        <TimeSeriesChart
          data={days}
          series={[
            { key: 'reportsCreated', label: 'Filed' },
            { key: 'reportsResolved', label: 'Resolved' },
          ]}
          kind="line"
          height={300}
        />
      </Card>
    </>
  );
}
