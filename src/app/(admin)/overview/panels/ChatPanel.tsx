import { Sparkline, TimeSeriesChart } from '@/components/charts';
import { Card, StatCard } from '@/components/ui';
import { formatNumber, formatPercent } from '@/lib/format';
import { fillDailySeries } from '@/lib/metrics';
import { periodLabel, type PeriodRange } from '@/lib/period';
import type { ChatActivityPoint, ChatOverview } from '@/lib/types';
import { SectionError, StatGrid, columnOf, pctDelta, pointsDelta } from '../parts';

/**
 * Direct messages. The three counts are one funnel — tap the chat button,
 * start a conversation, send something — so they share an axis, and the rate
 * card names the step that actually matters.
 */
export function ChatPanel({
  data,
  period,
}: {
  data: ChatOverview | null;
  period: PeriodRange;
}) {
  if (!data) return <SectionError label="Chat overview" />;

  const totals = data.totals;
  const prev = data.previousTotals;
  const days = fillDailySeries<ChatActivityPoint>(data.activityByDay, period.from, period.to);

  return (
    <>
      <StatGrid cols={4}>
        <StatCard
          label="Chat button taps"
          value={formatNumber(totals.chatButtonClicks)}
          delta={prev ? pctDelta(totals.chatButtonClicks, prev.chatButtonClicks) : undefined}
        />
        <StatCard
          label="Chats started"
          value={formatNumber(totals.chatStartedCount)}
          delta={prev ? pctDelta(totals.chatStartedCount, prev.chatStartedCount) : undefined}
          footer={<Sparkline data={columnOf(days, 'chatStarted')} />}
        />
        <StatCard
          label="Messages sent"
          value={formatNumber(totals.messageSentCount)}
          delta={prev ? pctDelta(totals.messageSentCount, prev.messageSentCount) : undefined}
          hint="Direct messages only"
        />
        <StatCard
          label="Listing → chat start"
          value={formatPercent(totals.listingToChatStartRate)}
          delta={
            prev
              ? pointsDelta(totals.listingToChatStartRate, prev.listingToChatStartRate)
              : undefined
          }
        />
      </StatGrid>

      <Card title="Chat activity" subtitle={periodLabel(period)}>
        <TimeSeriesChart
          data={days}
          series={[
            { key: 'chatButtonClicks', label: 'Button taps' },
            { key: 'chatStarted', label: 'Chats started' },
            { key: 'messagesSent', label: 'Messages sent' },
          ]}
          kind="line"
          height={300}
        />
      </Card>
    </>
  );
}
