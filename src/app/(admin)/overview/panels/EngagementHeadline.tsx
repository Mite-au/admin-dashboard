import { Sparkline, TimeSeriesChart } from '@/components/charts';
import { Card, StatCard } from '@/components/ui';
import { formatNumber } from '@/lib/format';
import { fillDailySeries } from '@/lib/metrics';
import { periodLabel, type PeriodRange } from '@/lib/period';
import type { EngagementActivity, EngagementActivityPoint, EngagementSummary } from '@/lib/types';
import { SectionError, StatGrid, columnOf } from '../parts';

/**
 * The engagement tab's own headline, above the per-surface sections.
 *
 * Direct messages and threads are separate products with separate sections,
 * and until this chart there was nowhere to see them on one axis — which is
 * the only place the trade-off between them is visible.
 *
 * Neither payload carries a previous period, so no card claims a delta. The
 * two sparklines are drawn from the daily series whose key matches the total
 * exactly; the other two totals have no daily counterpart and go without
 * rather than borrow a neighbouring metric's shape.
 */
export function EngagementHeadline({
  summary,
  activity,
  period,
}: {
  summary: EngagementSummary | null;
  activity: EngagementActivity | null;
  period: PeriodRange;
}) {
  const days = fillDailySeries<EngagementActivityPoint>(
    activity?.activityByDay ?? [],
    period.from,
    period.to,
  );

  return (
    <>
      {summary === null ? (
        <SectionError label="Engagement summary" />
      ) : (
        <StatGrid cols={4}>
          <StatCard
            label="Active users"
            value={formatNumber(summary.activeUsers)}
            hint="This period"
          />
          <StatCard
            label="Chats started"
            value={formatNumber(summary.chatStartedCount)}
            footer={activity ? <Sparkline data={columnOf(days, 'chats')} /> : undefined}
          />
          <StatCard
            label="Messages sent"
            value={formatNumber(summary.messageSentCount)}
            hint="Direct and thread"
            footer={activity ? <Sparkline data={columnOf(days, 'messages')} /> : undefined}
          />
          <StatCard
            label="Thread posters"
            value={formatNumber(summary.threadActiveUsers)}
            hint="Distinct senders"
          />
        </StatGrid>
      )}

      {activity === null ? (
        <SectionError label="Engagement activity" />
      ) : (
        <Card title="Engagement across surfaces" subtitle={periodLabel(period)}>
          <TimeSeriesChart
            data={days}
            series={[
              { key: 'chats', label: 'Chats started' },
              { key: 'messages', label: 'Messages sent' },
              { key: 'threadActivity', label: 'Thread messages' },
            ]}
            kind="line"
            height={300}
          />
        </Card>
      )}
    </>
  );
}
