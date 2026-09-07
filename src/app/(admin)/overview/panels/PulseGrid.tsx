'use client';

import Link from 'next/link';
import type { MouseEvent } from 'react';
import { Sparkline } from '@/components/charts';
import { StatCard, type StatDelta } from '@/components/ui';
import { formatMoney, formatNumber, formatPercent } from '@/lib/format';
import { fillDailySeries } from '@/lib/metrics';
import {
  periodLabel,
  previousPeriod,
  type PeriodParams,
  type PeriodRange,
} from '@/lib/period';
import type {
  ActivityOverview,
  ActivityOverviewPoint,
  ChatActivityPoint,
  ChatOverview,
  ListingsActivityPoint,
  ListingsOverview,
  ReportsActivityPoint,
  ReportsOverview,
  ThreadsActivityPoint,
  ThreadsOverview,
  TransactionsActivityPoint,
  TransactionsOverview,
} from '@/lib/types';
import { StatGrid, columnOf, invertedPctDelta, pctDelta, periodHref } from '../parts';
import { SECTION_LABELS, type OverviewSection, type OverviewTab } from '../tabs';

interface Props {
  period: PeriodRange;
  periodParams: PeriodParams;
  activity: ActivityOverview | null;
  listings: ListingsOverview | null;
  chat: ChatOverview | null;
  transactions: TransactionsOverview | null;
  reports: ReportsOverview | null;
  threads: ThreadsOverview | null;
  onOpen: (tab: OverviewTab, section: OverviewSection) => void;
}

type Kpi = {
  id: string;
  label: string;
  value: string;
  hint?: string;
  delta?: StatDelta;
  spark?: number[];
  tab: OverviewTab;
  section: OverviewSection;
};

function unavailable(id: string, label: string, tab: OverviewTab, section: OverviewSection): Kpi {
  return { id, label, value: '—', hint: 'Could not load', tab, section };
}

/**
 * The eight flows that describe the period, one per surface, each with its
 * trend and its change against the period before. Every tile is a link into
 * the section that explains it — a plain click swaps the tabs below without
 * re-fetching, while a modified click or a pasted URL still lands on the
 * same section, because the href carries the tab and window in full.
 */
export function PulseGrid({
  period,
  periodParams,
  activity,
  listings,
  chat,
  transactions,
  reports,
  threads,
  onOpen,
}: Props) {
  const { from, to } = period;
  const activityDays = fillDailySeries<ActivityOverviewPoint>(activity?.activityByDay ?? [], from, to);
  const listingDays = fillDailySeries<ListingsActivityPoint>(listings?.activityByDay ?? [], from, to);
  const chatDays = fillDailySeries<ChatActivityPoint>(chat?.activityByDay ?? [], from, to);
  const tradeDays = fillDailySeries<TransactionsActivityPoint>(
    transactions?.activityByDay ?? [],
    from,
    to,
  );
  const reportDays = fillDailySeries<ReportsActivityPoint>(reports?.activityByDay ?? [], from, to);
  const threadDays = fillDailySeries<ThreadsActivityPoint>(threads?.activityByDay ?? [], from, to);

  const trades = transactions?.totals;
  const tradesPrev = transactions?.previousTotals;
  const avgTrade =
    trades && trades.confirmedTransactionCount > 0
      ? trades.confirmedTransactionVolume / trades.confirmedTransactionCount
      : null;

  const cards: Kpi[] = [
    activity
      ? {
          id: 'signups',
          label: 'Sign-ups',
          value: formatNumber(activity.totals.signUpCount),
          delta: activity.previousTotals
            ? pctDelta(activity.totals.signUpCount, activity.previousTotals.signUpCount)
            : undefined,
          hint: 'Accounts created',
          spark: columnOf(activityDays, 'signUps'),
          tab: 'engagement',
          section: 'activation',
        }
      : unavailable('signups', 'Sign-ups', 'engagement', 'activation'),
    listings
      ? {
          id: 'published',
          label: 'Listings published',
          value: formatNumber(listings.totals.listingPublishedCount),
          delta: listings.previousTotals
            ? pctDelta(
                listings.totals.listingPublishedCount,
                listings.previousTotals.listingPublishedCount,
              )
            : undefined,
          hint: `${formatNumber(listings.totals.repeatListingUserCount)} people listed more than once`,
          spark: columnOf(listingDays, 'listingsPublished'),
          tab: 'overview',
          section: 'listings',
        }
      : unavailable('published', 'Listings published', 'overview', 'listings'),
    chat
      ? {
          id: 'chats',
          label: 'Chats started',
          value: formatNumber(chat.totals.chatStartedCount),
          delta: chat.previousTotals
            ? pctDelta(chat.totals.chatStartedCount, chat.previousTotals.chatStartedCount)
            : undefined,
          hint: `${formatPercent(chat.totals.listingToChatStartRate)} of new listings got a chat`,
          spark: columnOf(chatDays, 'chatStarted'),
          tab: 'engagement',
          section: 'chat',
        }
      : unavailable('chats', 'Chats started', 'engagement', 'chat'),
    trades
      ? {
          id: 'trades',
          label: 'Confirmed trades',
          value: formatNumber(trades.confirmedTransactionCount),
          delta: tradesPrev
            ? pctDelta(trades.confirmedTransactionCount, tradesPrev.confirmedTransactionCount)
            : undefined,
          hint: avgTrade === null ? 'Both parties confirmed' : `${formatMoney(avgTrade)} per trade`,
          spark: columnOf(tradeDays, 'confirmedTransactionCount'),
          tab: 'overview',
          section: 'transactions',
        }
      : unavailable('trades', 'Confirmed trades', 'overview', 'transactions'),
    trades
      ? {
          id: 'volume',
          label: 'Confirmed volume',
          value: formatMoney(trades.confirmedTransactionVolume, null, { digits: 0 }),
          delta: tradesPrev
            ? pctDelta(trades.confirmedTransactionVolume, tradesPrev.confirmedTransactionVolume)
            : undefined,
          hint: 'Offer value on trades both parties confirmed',
          spark: columnOf(tradeDays, 'confirmedTransactionVolume'),
          tab: 'overview',
          section: 'transactions',
        }
      : unavailable('volume', 'Confirmed volume', 'overview', 'transactions'),
    trades
      ? {
          id: 'accepted',
          label: 'Accepted offer value',
          value: formatMoney(trades.acceptedOfferGmv, null, { digits: 0 }),
          delta: tradesPrev
            ? pctDelta(trades.acceptedOfferGmv, tradesPrev.acceptedOfferGmv)
            : undefined,
          hint: 'Accepted this period, before confirmation',
          spark: columnOf(tradeDays, 'acceptedOfferGmv'),
          tab: 'overview',
          section: 'transactions',
        }
      : unavailable('accepted', 'Accepted offer value', 'overview', 'transactions'),
    reports
      ? {
          id: 'reports',
          label: 'Reports filed',
          value: formatNumber(reports.totals.reportsCreatedCount),
          // Up is bad: the chip colour follows the negated sign.
          delta: reports.previousTotals
            ? invertedPctDelta(
                reports.totals.reportsCreatedCount,
                reports.previousTotals.reportsCreatedCount,
              )
            : undefined,
          hint: `${formatNumber(reports.totals.openReports)} open now`,
          spark: columnOf(reportDays, 'reportsCreated'),
          tab: 'overview',
          section: 'reports',
        }
      : unavailable('reports', 'Reports filed', 'overview', 'reports'),
    threads
      ? {
          id: 'joins',
          label: 'Thread joins',
          value: formatNumber(threads.totals.threadJoinCount),
          delta: threads.previousTotals
            ? pctDelta(threads.totals.threadJoinCount, threads.previousTotals.threadJoinCount)
            : undefined,
          hint: `${formatNumber(threads.totals.threadActiveUsers)} members posted`,
          spark: columnOf(threadDays, 'threadJoins'),
          tab: 'engagement',
          section: 'threads',
        }
      : unavailable('joins', 'Thread joins', 'engagement', 'threads'),
  ];

  const handleClick = (event: MouseEvent<HTMLAnchorElement>, card: Kpi) => {
    // Leave modified clicks alone so "open in new tab" keeps working.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }
    event.preventDefault();
    onOpen(card.tab, card.section);
  };

  return (
    <section aria-labelledby="overview-pulse-heading">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 id="overview-pulse-heading" className="label-micro">
          This period
        </h3>
        <p className="text-2xs text-ink-400">
          {periodLabel(period)} · change against {periodLabel(previousPeriod(period))}
        </p>
      </div>
      <StatGrid cols={4}>
        {cards.map((card) => (
          <Link
            key={card.id}
            href={periodHref('/overview', periodParams, { tab: card.tab, section: card.section })}
            prefetch={false}
            onClick={(event) => handleClick(event, card)}
            className="group block h-full rounded-panel"
          >
            <StatCard
              label={card.label}
              value={card.value}
              delta={card.delta}
              hint={card.hint}
              footer={card.spark ? <Sparkline data={card.spark} /> : undefined}
              className="h-full transition-colors group-hover:border-ink-300"
            />
            <span className="sr-only">Open the {SECTION_LABELS[card.section]} section</span>
          </Link>
        ))}
      </StatGrid>
    </section>
  );
}
