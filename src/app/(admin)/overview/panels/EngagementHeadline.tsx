import { Sparkline, TimeSeriesChart } from '@/components/charts';
import { Card, StatCard } from '@/components/ui';
import { formatNumber } from '@/lib/format';
import { fillDailySeries } from '@/lib/metrics';
import { periodLabel, type PeriodRange } from '@/lib/period';
import type {
  EngagementActivity,
  EngagementActivityPoint,
  EngagementSummary,
  UserLoginsResponse,
} from '@/lib/types';
import { SectionError, StatGrid, columnOf, pctDelta } from '../parts';
import { ActivesTile } from './ContextTiles';

/**
 * The engagement tab's own headline, above the per-surface sections.
 *
 * Direct messages and threads are separate products with separate sections,
 * and until this chart there was nowhere to see them on one axis — which is
 * the only place the trade-off between them is visible.
 *
 * The summary carries a previous period for three of its four figures.
 * "Active users" is the exception: the backend counts users whose last
 * activity falls inside the window and does not compare it, so that card
 * explains itself instead of claiming a delta.
 */
export function EngagementHeadline({
  summary,
  activity,
  logins,
  period,
}: {
  summary: EngagementSummary | null;
  activity: EngagementActivity | null;
  logins: UserLoginsResponse | null;
  period: PeriodRange;
}) {
  const days = fillDailySeries<EngagementActivityPoint>(
    activity?.activityByDay ?? [],
    period.from,
    period.to,
  );
  const prev = summary?.previousTotals;
  // `messages` is DMs + thread messages combined; take the thread part out so
  // the chart draws two disjoint parts of one total rather than a series
  // beside the series that contains it.
  const rows = days.map((day) => ({
    ...day,
    directMessages: Math.max(day.messages - day.threadActivity, 0),
  }));

  return (
    <>
      {summary === null ? (
        <SectionError label="Engagement summary" />
      ) : (
        <StatGrid cols={4}>
          <StatCard
            label="Active users"
            value={formatNumber(summary.activeUsers)}
            hint="Users whose latest activity falls in this period"
          />
          <StatCard
            label="Chats started"
            value={formatNumber(summary.chatStartedCount)}
            delta={prev ? pctDelta(summary.chatStartedCount, prev.chatStartedCount) : undefined}
            footer={activity ? <Sparkline data={columnOf(days, 'chats')} /> : undefined}
          />
          <StatCard
            label="Messages sent"
            value={formatNumber(summary.messageSentCount)}
            delta={prev ? pctDelta(summary.messageSentCount, prev.messageSentCount) : undefined}
            hint="Direct and thread, all types"
            footer={activity ? <Sparkline data={columnOf(days, 'messages')} /> : undefined}
          />
          <StatCard
            label="Thread posters"
            value={formatNumber(summary.threadActiveUsers)}
            delta={prev ? pctDelta(summary.threadActiveUsers, prev.threadActiveUsers) : undefined}
            hint="Distinct senders"
          />
        </StatGrid>
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          {activity === null ? (
            <SectionError label="Engagement activity" />
          ) : (
            <Card
              title="Engagement across surfaces"
              subtitle={`${periodLabel(period)} · messages split by surface`}
              className="h-full"
            >
              <TimeSeriesChart
                data={rows}
                series={[
                  { key: 'chats', label: 'Chats started' },
                  { key: 'directMessages', label: 'Direct messages' },
                  { key: 'threadActivity', label: 'Thread messages' },
                ]}
                kind="line"
                height={300}
              />
            </Card>
          )}
        </div>
        <ActivesTile data={logins} />
      </div>
    </>
  );
}
