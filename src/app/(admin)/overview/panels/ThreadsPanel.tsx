import { Sparkline, TimeSeriesChart } from '@/components/charts';
import { Card, StatCard } from '@/components/ui';
import { formatNumber, formatPercent } from '@/lib/format';
import { fillDailySeries, safeRate } from '@/lib/metrics';
import { periodLabel, type PeriodRange } from '@/lib/period';
import type { ThreadsActivityPoint, ThreadsOverview } from '@/lib/types';
import { SectionError, StatGrid, columnOf, pctDelta } from '../parts';

/**
 * Group threads. Opens are reach, joins are commitment, and active users are
 * the people who actually said something — the three fall off steeply from
 * one another, which is the point of putting them on one axis.
 */
export function ThreadsPanel({
  data,
  period,
}: {
  data: ThreadsOverview | null;
  period: PeriodRange;
}) {
  if (!data) return <SectionError label="Threads overview" />;

  const totals = data.totals;
  const prev = data.previousTotals;
  const days = fillDailySeries<ThreadsActivityPoint>(
    data.activityByDay,
    period.from,
    period.to,
  );
  const joinRate = safeRate(totals.threadJoinCount, totals.threadOpenCount);

  return (
    <>
      <StatGrid cols={3}>
        <StatCard
          label="Thread opens"
          value={formatNumber(totals.threadOpenCount)}
          delta={prev ? pctDelta(totals.threadOpenCount, prev.threadOpenCount) : undefined}
          footer={<Sparkline data={columnOf(days, 'threadOpens')} />}
        />
        <StatCard
          label="Thread joins"
          value={formatNumber(totals.threadJoinCount)}
          delta={prev ? pctDelta(totals.threadJoinCount, prev.threadJoinCount) : undefined}
          hint={joinRate === null ? undefined : `${formatPercent(joinRate)} of opens`}
        />
        <StatCard
          label="Posting members"
          value={formatNumber(totals.threadActiveUsers)}
          delta={prev ? pctDelta(totals.threadActiveUsers, prev.threadActiveUsers) : undefined}
          hint="Distinct senders, not members"
        />
      </StatGrid>

      <Card title="Thread activity" subtitle={periodLabel(period)}>
        <TimeSeriesChart
          data={days}
          series={[
            { key: 'threadOpens', label: 'Opens' },
            { key: 'threadJoins', label: 'Joins' },
            { key: 'threadActivity', label: 'Messages' },
          ]}
          kind="line"
          height={300}
        />
      </Card>
    </>
  );
}
