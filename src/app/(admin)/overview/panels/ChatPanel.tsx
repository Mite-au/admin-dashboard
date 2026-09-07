import { Sparkline, TimeSeriesChart } from '@/components/charts';
import { Card, StatCard } from '@/components/ui';
import { formatNumber, formatPercent } from '@/lib/format';
import { fillDailySeries, safeRate } from '@/lib/metrics';
import { periodLabel, type PeriodRange } from '@/lib/period';
import type { ChatActivityPoint, ChatOverview } from '@/lib/types';
import { SectionError, StatGrid, columnOf, pctDelta, pointsDelta } from '../parts';

/**
 * Direct messages. "Conversation opens" is the wire's `chatButtonClicks`,
 * which the backend records server-side whenever a conversation is opened,
 * new or existing — a request count, not a tap on a button. Chats started
 * counts only the new ones, from the conversations table, so the two can
 * drift apart when the event is dropped.
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
  const tapToChat = safeRate(totals.chatStartedCount, totals.chatButtonClicks);

  return (
    <>
      <StatGrid cols={4}>
        <StatCard
          label="Conversation opens"
          value={formatNumber(totals.chatButtonClicks)}
          delta={prev ? pctDelta(totals.chatButtonClicks, prev.chatButtonClicks) : undefined}
        />
        <StatCard
          label="Chats started"
          value={formatNumber(totals.chatStartedCount)}
          delta={prev ? pctDelta(totals.chatStartedCount, prev.chatStartedCount) : undefined}
          hint={tapToChat === null ? undefined : `${formatPercent(tapToChat)} of opens were new conversations`}
          footer={<Sparkline data={columnOf(days, 'chatStarted')} />}
        />
        <StatCard
          label="Messages sent"
          value={formatNumber(totals.messageSentCount)}
          delta={prev ? pctDelta(totals.messageSentCount, prev.messageSentCount) : undefined}
          hint="Direct text messages only"
        />
        <StatCard
          label="New listings getting a chat"
          value={formatPercent(totals.listingToChatStartRate)}
          hint="Listings published this period that drew a chat in the same period"
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
            { key: 'chatButtonClicks', label: 'Conversation opens' },
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
