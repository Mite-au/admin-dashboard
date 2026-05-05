'use client';

import { Suspense, useState } from 'react';
import type {
  ActivityOverview,
  ChatOverview,
  EngagementSummary,
  ListingsOverview,
  OverviewStats,
  ReportsOverview,
  ThreadsOverview,
  TransactionsOverview,
} from '@/lib/types';
import { ActivityChart } from './ActivityChart';
import { PeriodSelector } from '@/components/PeriodSelector';

type Tab = 'overview' | 'engagement';
type OverviewSubTab = 'listings' | 'transactions' | 'reports';
type EngagementSubTab = 'chat' | 'thread' | 'activity';

type MetricCard = {
  label: string;
  value: string;
  /** True for live/snapshot counts that are not period-aggregated (e.g. active listings). */
  isSnapshot?: boolean;
  /** Formatted value from the previous period, shown as a comparison. */
  previousValue?: string;
};

interface Props {
  data: OverviewStats;
  chatOverview: ChatOverview | null;
  threadsOverview: ThreadsOverview | null;
  engagementSummary: EngagementSummary | null;
  reportsOverview: ReportsOverview | null;
  transactionsOverview: TransactionsOverview | null;
  listingsOverview: ListingsOverview | null;
  activityOverview: ActivityOverview | null;
}

export function OverviewTabLayout({
  data,
  chatOverview,
  threadsOverview,
  engagementSummary,
  reportsOverview,
  transactionsOverview,
  listingsOverview,
  activityOverview,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [overviewSubTab, setOverviewSubTab] = useState<OverviewSubTab>('listings');
  const [engagementSubTab, setEngagementSubTab] = useState<EngagementSubTab>('chat');
  const { totals } = data;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'engagement', label: 'Engagement' },
  ];

  const engagementSubTabs: { id: EngagementSubTab; label: string }[] = [
    { id: 'chat', label: 'Chat' },
    { id: 'thread', label: 'Thread' },
    { id: 'activity', label: 'Activity' },
  ];

  const overviewSubTabs: { id: OverviewSubTab; label: string }[] = [
    { id: 'listings', label: 'Listings' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'reports', label: 'Reports' },
  ];

  const chatPrev = chatOverview?.previousTotals;
  const chatCards: MetricCard[] | null = chatOverview
    ? [
      {
        label: 'Chat Button Clicks',
        value: chatOverview.totals.chatButtonClicks.toLocaleString(),
        previousValue: chatPrev ? chatPrev.chatButtonClicks.toLocaleString() : undefined,
      },
      {
        label: 'Chat Started Count',
        value: chatOverview.totals.chatStartedCount.toLocaleString(),
        previousValue: chatPrev ? chatPrev.chatStartedCount.toLocaleString() : undefined,
      },
      {
        label: 'Message Sent Count',
        value: chatOverview.totals.messageSentCount.toLocaleString(),
        previousValue: chatPrev ? chatPrev.messageSentCount.toLocaleString() : undefined,
      },
      {
        label: 'Listing → Chat Start Rate',
        value: formatRate(chatOverview.totals.listingToChatStartRate),
        previousValue: chatPrev ? formatRate(chatPrev.listingToChatStartRate) : undefined,
      },
    ]
    : null;

  const threadPrev = threadsOverview?.previousTotals;
  const threadCards: MetricCard[] | null = threadsOverview
    ? [
      {
        label: 'Thread Open Count',
        value: threadsOverview.totals.threadOpenCount.toLocaleString(),
        previousValue: threadPrev ? threadPrev.threadOpenCount.toLocaleString() : undefined,
      },
      {
        label: 'Thread Join Count',
        value: threadsOverview.totals.threadJoinCount.toLocaleString(),
        previousValue: threadPrev ? threadPrev.threadJoinCount.toLocaleString() : undefined,
      },
      {
        label: 'Thread Active Users',
        value: threadsOverview.totals.threadActiveUsers.toLocaleString(),
        previousValue: threadPrev ? threadPrev.threadActiveUsers.toLocaleString() : undefined,
      },
    ]
    : null;

  const activityPrev = activityOverview?.previousTotals;
  const engagementCardsBySubTab: Record<Exclude<EngagementSubTab, 'chat' | 'thread'>, MetricCard[]> | null = engagementSummary
    ? {
      activity: [
        {
          label: 'Verified User Count',
          value: (activityOverview?.totals.verifiedUsers ?? totals.verifiedUsers).toLocaleString(),
          isSnapshot: true,
        },
        {
          label: 'Weekly Returning Verified Users',
          value: activityOverview
            ? activityOverview.totals.weeklyReturningVerifiedUsers.toLocaleString()
            : 'Not wired',
          isSnapshot: true,
        },
        {
          label: 'Sign Up Count',
          value: activityOverview ? activityOverview.totals.signUpCount.toLocaleString() : 'Not wired',
          previousValue: activityPrev ? activityPrev.signUpCount.toLocaleString() : undefined,
        },
        {
          label: 'Active Users',
          value: engagementSummary.activeUsers.toLocaleString(),
          isSnapshot: true,
        },
      ],
    }
    : null;

  const engagementActivitySecondary: MetricCard[] = [
    {
      label: 'Phone Verified Count',
      value: activityOverview ? activityOverview.totals.phoneVerifiedCount.toLocaleString() : 'Not wired',
      isSnapshot: true,
    },
    {
      label: 'Email Verified Count',
      value: activityOverview ? activityOverview.totals.emailVerifiedCount.toLocaleString() : 'Not wired',
      isSnapshot: true,
    },
  ];

  const activationPoints = activityOverview?.activityByDay ?? [];
  const engagementCards =
    engagementSubTab === 'chat'
      ? chatCards
      : engagementSubTab === 'thread'
        ? threadCards
        : engagementCardsBySubTab?.[engagementSubTab] ?? null;
  const engagementSecondaryCards = engagementSubTab === 'activity' ? engagementActivitySecondary : [];
  const hasEngagementCardData =
    engagementSubTab === 'chat'
      ? chatOverview !== null
      : engagementSubTab === 'thread'
        ? threadsOverview !== null
        : engagementSummary !== null;
  const engagementErrorLabel =
    engagementSubTab === 'chat'
      ? 'Chat overview'
      : engagementSubTab === 'thread'
        ? 'Threads overview'
        : 'Engagement summary';

  return (
    <div className="px-8 pb-8 space-y-6">
      {/* Period selector — shared across Overview and Engagement tabs */}
      <Suspense>
        <PeriodSelector />
      </Suspense>

      {/* Tab bar */}
      <div role="tablist" className="flex gap-1 border-b border-ink-100">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={[
              'px-4 py-2.5 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'border-b-2 border-blue-600 text-blue-600 -mb-px'
                : 'text-ink-500 hover:text-ink-800',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div id="tabpanel-overview" role="tabpanel" aria-labelledby="tab-overview" className="space-y-8">
          <div role="tablist" aria-label="Overview sections" className="flex gap-1 border-b border-ink-100">
            {overviewSubTabs.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={overviewSubTab === tab.id}
                aria-controls={`overview-subpanel-${tab.id}`}
                id={`overview-subtab-${tab.id}`}
                onClick={() => setOverviewSubTab(tab.id)}
                className={[
                  'px-3 py-2 text-sm font-medium transition-colors',
                  overviewSubTab === tab.id
                    ? 'border-b-2 border-blue-600 text-blue-600 -mb-px'
                    : 'text-ink-500 hover:text-ink-800',
                ].join(' ')}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div
            id={`overview-subpanel-${overviewSubTab}`}
            role="tabpanel"
            aria-labelledby={`overview-subtab-${overviewSubTab}`}
            className="space-y-8"
          >
            {overviewSubTab === 'listings' && (
              <ListingsOverviewPanel
                activeListings={totals.activeListings}
                listingsOverview={listingsOverview}
              />
            )}
            {overviewSubTab === 'transactions' && (
              <TransactionsOverviewPanel transactionsOverview={transactionsOverview} />
            )}
            {overviewSubTab === 'reports' && (
              <ReportsOverviewPanel
                openReportsFallback={totals.openReports}
                reportsOverview={reportsOverview}
              />
            )}
          </div>
        </div>
      )}

      {/* Engagement tab */}
      {activeTab === 'engagement' && (
        <div id="tabpanel-engagement" role="tabpanel" aria-labelledby="tab-engagement" className="space-y-8">
          <div role="tablist" aria-label="Engagement sections" className="flex gap-1 border-b border-ink-100">
            {engagementSubTabs.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={engagementSubTab === tab.id}
                aria-controls={`engagement-subpanel-${tab.id}`}
                id={`engagement-subtab-${tab.id}`}
                onClick={() => setEngagementSubTab(tab.id)}
                className={[
                  'px-3 py-2 text-sm font-medium transition-colors',
                  engagementSubTab === tab.id
                    ? 'border-b-2 border-blue-600 text-blue-600 -mb-px'
                    : 'text-ink-500 hover:text-ink-800',
                ].join(' ')}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Summary cards — per-section error */}
          <div
            id={`engagement-subpanel-${engagementSubTab}`}
            role="tabpanel"
            aria-labelledby={`engagement-subtab-${engagementSubTab}`}
            className="space-y-8"
          >
            {!hasEngagementCardData ? (
              <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">
                {engagementErrorLabel} could not be loaded. Please try refreshing.
              </div>
            ) : (
              <MetricCardGrid cards={engagementCards ?? []} columnsClassName="sm:grid-cols-4" />
            )}

            {engagementSecondaryCards.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                  Supporting Metrics
                </h2>
                <MetricCardGrid cards={engagementSecondaryCards} columnsClassName="sm:grid-cols-2" />
              </div>
            )}

            <EngagementSubTabCharts
              subTab={engagementSubTab}
              chatOverview={chatOverview}
              threadsOverview={threadsOverview}
              activationData={activationPoints}
              hasActivationData={activityOverview !== null}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCardGrid({
  cards,
  columnsClassName = 'sm:grid-cols-3 xl:grid-cols-5',
}: {
  cards: MetricCard[];
  columnsClassName?: string;
}) {
  return (
    <div className={`grid grid-cols-2 gap-4 ${columnsClassName}`}>
      {cards.map(({ label, value, isSnapshot, previousValue }) => (
        <div
          key={label}
          className="rounded-2xl border border-ink-100 bg-white p-5 flex flex-col gap-1.5 shadow-sm"
        >
          <span className="text-xs font-medium text-ink-500 uppercase tracking-wide">
            {label}
          </span>
          <span className="text-2xl font-extrabold text-ink-900">{value}</span>
          {isSnapshot && (
            <span className="text-[10px] font-medium text-ink-400 uppercase tracking-wide">
              Live count
            </span>
          )}
          {previousValue && !isSnapshot && (
            <span className="text-xs text-ink-400">
              prev period: {previousValue}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatSafeMoney(value: number | null | undefined) {
  return formatMoney(toSafeNumber(value));
}

function formatRate(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatSafeCount(value: number | null | undefined) {
  return toSafeNumber(value).toLocaleString();
}

function toSafeNumber(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function OverviewError({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">
      {label} data could not be loaded. Please try refreshing.
    </div>
  );
}

function ListingsOverviewPanel({
  activeListings,
  listingsOverview,
}: {
  activeListings: number;
  listingsOverview: ListingsOverview | null;
}) {
  const prev = listingsOverview?.previousTotals;

  const cards: MetricCard[] = [
    {
      label: 'Active Listing Count',
      value: activeListings.toLocaleString(),
      isSnapshot: true,
    },
    {
      label: 'Listing Published Count',
      value: listingsOverview
        ? listingsOverview.totals.listingPublishedCount.toLocaleString()
        : 'Not wired',
      previousValue: prev ? prev.listingPublishedCount.toLocaleString() : undefined,
    },
    {
      label: 'First Listing Rate',
      value: listingsOverview
        ? formatRate(listingsOverview.totals.firstListingRate)
        : 'Not wired',
      previousValue: prev ? formatRate(prev.firstListingRate) : undefined,
    },
    {
      label: 'Listing Detail Views',
      value: listingsOverview
        ? listingsOverview.totals.totalListingDetailViews.toLocaleString()
        : 'Not wired',
    },
  ];

  const supportingCards: MetricCard[] = [
    {
      label: 'Listing Started Count',
      value: listingsOverview
        ? listingsOverview.totals.listingStartedCount.toLocaleString()
        : 'Not wired',
      previousValue: prev ? prev.listingStartedCount.toLocaleString() : undefined,
    },
    {
      label: 'Listing Created Count',
      value: listingsOverview
        ? listingsOverview.totals.listingCreateClickedCount.toLocaleString()
        : 'Not wired',
      previousValue: prev ? prev.listingCreateClickedCount.toLocaleString() : undefined,
    },
    {
      label: 'Repeat Listing User Count',
      value: listingsOverview
        ? listingsOverview.totals.repeatListingUserCount.toLocaleString()
        : 'Not wired',
      previousValue: prev ? prev.repeatListingUserCount.toLocaleString() : undefined,
    },
  ];

  return (
    <>
      {listingsOverview === null && <OverviewError label="Listings overview" />}
      <MetricCardGrid cards={cards} columnsClassName="sm:grid-cols-4" />
      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-500">
          Supporting Metrics
        </h2>
        <MetricCardGrid cards={supportingCards} columnsClassName="sm:grid-cols-3" />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartPanel
          title="Listings"
          data={listingsOverview?.activityByDay ?? []}
          hasData={listingsOverview !== null}
          series={[
            { dataKey: 'listings', name: 'Listings', stroke: '#3b82f6' },
          ]}
        />
        <ChartPanel
          title="Listings Published"
          data={listingsOverview?.activityByDay ?? []}
          hasData={listingsOverview !== null}
          series={[
            { dataKey: 'listingsPublished', name: 'Listings Published', stroke: '#22c55e' },
          ]}
        />
      </div>
    </>
  );
}

function TransactionsOverviewPanel({
  transactionsOverview,
}: {
  transactionsOverview: TransactionsOverview | null;
}) {
  const transactionActivityByDay = (transactionsOverview?.activityByDay ?? []).map((item) => ({
    date: item.date,
    confirmedTransactionCount: toSafeNumber(item.confirmedTransactionCount),
    confirmedTransactionVolume: toSafeNumber(item.confirmedTransactionVolume),
    gmv: toSafeNumber(item.gmv),
  }));

  const prev = transactionsOverview?.previousTotals;

  const cards: MetricCard[] = [
    {
      label: 'Confirmed Transaction Count',
      value: transactionsOverview
        ? formatSafeCount(transactionsOverview.totals.confirmedTransactionCount)
        : 'Not wired',
      previousValue: prev ? formatSafeCount(prev.confirmedTransactionCount) : undefined,
    },
    {
      label: 'Confirmed Transaction Volume',
      value: transactionsOverview
        ? formatSafeMoney(transactionsOverview.totals.confirmedTransactionVolume)
        : 'Not wired',
      previousValue: prev ? formatSafeMoney(prev.confirmedTransactionVolume) : undefined,
    },
    {
      label: 'GMV',
      value: transactionsOverview
        ? formatSafeMoney(transactionsOverview.totals.gmv)
        : 'Not wired',
      previousValue: prev ? formatSafeMoney(prev.gmv) : undefined,
    },
    { label: 'Sponsored Revenue', value: 'Not wired' },
  ];

  return (
    <>
      {transactionsOverview === null && <OverviewError label="Transactions overview" />}
      <MetricCardGrid cards={cards} columnsClassName="sm:grid-cols-4" />
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartPanel
          title="Confirmed Transactions"
          data={transactionActivityByDay}
          hasData={transactionsOverview !== null}
          series={[
            {
              dataKey: 'confirmedTransactionCount',
              name: 'Confirmed Transactions',
              stroke: '#3b82f6',
            },
          ]}
        />
        <ChartPanel
          title="Transaction Volume / GMV"
          data={transactionActivityByDay}
          hasData={transactionsOverview !== null}
          series={[
            {
              dataKey: 'confirmedTransactionVolume',
              name: 'Confirmed Transaction Volume',
              stroke: '#8b5cf6',
            },
            { dataKey: 'gmv', name: 'GMV', stroke: '#22c55e' },
          ]}
        />
      </div>
    </>
  );
}

function ReportsOverviewPanel({
  openReportsFallback,
  reportsOverview,
}: {
  openReportsFallback: number;
  reportsOverview: ReportsOverview | null;
}) {
  const prev = reportsOverview?.previousTotals;

  const cards: MetricCard[] = [
    {
      label: 'Open Reports',
      value: (reportsOverview?.totals.openReports ?? openReportsFallback).toLocaleString(),
      isSnapshot: true,
    },
    {
      label: 'Reports Created Count',
      value: reportsOverview
        ? reportsOverview.totals.reportsCreatedCount.toLocaleString()
        : 'Not wired',
      previousValue: prev ? prev.reportsCreatedCount.toLocaleString() : undefined,
    },
    {
      label: 'Resolved Reports Count',
      value: reportsOverview
        ? reportsOverview.totals.resolvedReportsCount.toLocaleString()
        : 'Not wired',
      previousValue: prev ? prev.resolvedReportsCount.toLocaleString() : undefined,
    },
    { label: 'Pending Reports Count', value: 'Not wired' },
  ];

  return (
    <>
      {reportsOverview === null && <OverviewError label="Reports overview" />}
      <MetricCardGrid cards={cards} columnsClassName="sm:grid-cols-4" />
      <ChartPanel
        title="Reports"
        data={reportsOverview?.activityByDay ?? []}
        hasData={reportsOverview !== null}
        series={[
          { dataKey: 'reportsCreated', name: 'Reports Created', stroke: '#3b82f6' },
          { dataKey: 'reportsResolved', name: 'Reports Resolved', stroke: '#22c55e' },
        ]}
      />
    </>
  );
}

function EngagementSubTabCharts({
  subTab,
  chatOverview,
  threadsOverview,
  activationData,
  hasActivationData,
}: {
  subTab: EngagementSubTab;
  chatOverview: ChatOverview | null;
  threadsOverview: ThreadsOverview | null;
  activationData: ActivityOverview['activityByDay'];
  hasActivationData: boolean;
}) {
  if (subTab === 'chat') {
    return (
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartPanel
          title="Chat Starts"
          data={chatOverview?.activityByDay ?? []}
          hasData={chatOverview !== null}
          series={[
            {
              dataKey: 'chatStarted',
              name: 'Chat Starts',
              stroke: '#3b82f6',
            },
          ]}
        />
        <ChartPanel
          title="Messages Sent"
          data={chatOverview?.activityByDay ?? []}
          hasData={chatOverview !== null}
          series={[
            {
              dataKey: 'messagesSent',
              name: 'Messages Sent',
              stroke: '#8b5cf6',
            },
          ]}
        />
      </div>
    );
  }

  if (subTab === 'thread') {
    return (
      <div className="grid gap-4 xl:grid-cols-3">
        <ChartPanel
          title="Thread Opens"
          data={threadsOverview?.activityByDay ?? []}
          hasData={threadsOverview !== null}
          series={[
            {
              dataKey: 'threadOpens',
              name: 'Thread Opens',
              stroke: '#3b82f6',
            },
          ]}
        />
        <ChartPanel
          title="Thread Joins"
          data={threadsOverview?.activityByDay ?? []}
          hasData={threadsOverview !== null}
          series={[
            {
              dataKey: 'threadJoins',
              name: 'Thread Joins',
              stroke: '#8b5cf6',
            },
          ]}
        />
        <ChartPanel
          title="Thread Activity"
          data={threadsOverview?.activityByDay ?? []}
          hasData={threadsOverview !== null}
          series={[
            {
              dataKey: 'threadActivity',
              name: 'Thread Activity',
              stroke: '#22c55e',
            },
          ]}
        />
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <ChartPanel
        title="Sign Ups"
        data={activationData}
        hasData={hasActivationData}
        series={[{ dataKey: 'signUps', name: 'Sign Ups', stroke: '#3b82f6' }]}
      />
      <ChartPanel
        title="Verified Users (Cumulative)"
        data={activationData}
        hasData={hasActivationData}
        series={[{ dataKey: 'verifiedUsers', name: 'Verified Users', stroke: '#22c55e' }]}
      />
    </div>
  );
}

function ChartPanel({
  title,
  data,
  hasData,
  series,
}: {
  title: string;
  data: Parameters<typeof ActivityChart>[0]['data'];
  hasData: boolean;
  series: Parameters<typeof ActivityChart>[0]['series'];
}) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-ink-700 mb-4">{title}</h2>
      {!hasData ? (
        <p className="text-sm text-red-600 py-8 text-center">
          Data could not be loaded. Please try refreshing.
        </p>
      ) : data.length === 0 ? (
        <p className="text-sm text-ink-400 py-8 text-center">No data for this period.</p>
      ) : (
        <ActivityChart data={data} series={series} />
      )}
    </div>
  );
}
