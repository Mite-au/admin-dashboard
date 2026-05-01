'use client';

import { useState } from 'react';
import type { EngagementActivity, EngagementSummary, OverviewStats } from '@/lib/types';
import { ActivityChart } from './ActivityChart';
import { EngagementChart } from './EngagementChart';

type Tab = 'overview' | 'engagement';
type EngagementSubTab = 'chat' | 'thread' | 'activity';
type EngagementSeries = 'chats' | 'messages' | 'threadActivity';

type MetricCard = {
  label: string;
  value: string;
};

interface Props {
  data: OverviewStats;
  engagementSummary: EngagementSummary | null;
  engagementActivity: EngagementActivity | null;
}

export function OverviewTabLayout({ data, engagementSummary, engagementActivity }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [engagementSubTab, setEngagementSubTab] = useState<EngagementSubTab>('chat');
  const { totals, activityByDay } = data;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'engagement', label: 'Engagement' },
  ];

  const engagementSubTabs: { id: EngagementSubTab; label: string }[] = [
    { id: 'chat', label: 'Chat' },
    { id: 'thread', label: 'Thread' },
    { id: 'activity', label: 'Activity' },
  ];

  const overviewCards = [
    { label: 'Total Users', value: totals.users.toLocaleString() },
    { label: 'Verified Users', value: totals.verifiedUsers.toLocaleString() },
    { label: 'Active Listings', value: totals.activeListings.toLocaleString() },
    { label: 'Open Reports', value: totals.openReports.toLocaleString() },
    ...(totals.soldPosts != null
      ? [{ label: 'Sold Posts (status=sold)', value: totals.soldPosts.toLocaleString() }]
      : []),
  ];

  const engagementCardsBySubTab: Record<EngagementSubTab, MetricCard[]> | null = engagementSummary
    ? {
      chat: [
        { label: 'Chat Button Clicks', value: 'Not wired' },
        { label: 'Chat Started Count', value: engagementSummary.chatStartedCount.toLocaleString() },
        { label: 'Message Sent Count', value: 'Not wired' },
        { label: 'Listing to Chat Start Rate', value: 'Not wired' },
      ],
      thread: [
        { label: 'Thread Open Count', value: 'Not wired' },
        { label: 'Thread Join Count', value: 'Not wired' },
        {
          label: 'Thread Active Users',
          value: engagementSummary.threadActiveUsers.toLocaleString(),
        },
      ],
      activity: [
        { label: 'Verified User Count', value: totals.verifiedUsers.toLocaleString() },
        { label: 'Weekly Returning Verified Users', value: 'Not wired' },
        { label: 'Sign Up Count', value: 'Not wired' },
        { label: 'Active Users', value: engagementSummary.activeUsers.toLocaleString() },
      ],
    }
    : null;

  const engagementActivitySecondary: MetricCard[] = [
    { label: 'Phone Verified Count', value: 'Not wired' },
    { label: 'Email Verified Count', value: 'Not wired' },
  ];

  const activityPoints = engagementActivity?.activityByDay ?? [];
  const engagementCards = engagementCardsBySubTab?.[engagementSubTab] ?? null;
  const engagementSecondaryCards = engagementSubTab === 'activity' ? engagementActivitySecondary : [];

  return (
    <div className="px-8 pb-8 space-y-6">
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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
            {overviewCards.map(({ label, value }) => (
              <div
                key={label}
                className="rounded-2xl border border-ink-100 bg-white p-5 flex flex-col gap-1.5 shadow-sm"
              >
                <span className="text-xs font-medium text-ink-500 uppercase tracking-wide">
                  {label}
                </span>
                <span className="text-2xl font-extrabold text-ink-900">{value}</span>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-ink-700 mb-4">14-Day Listings</h2>
            <ActivityChart data={activityByDay} />
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
            {engagementSummary === null ? (
              <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">
                Engagement summary could not be loaded. Please try refreshing.
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
              data={activityPoints}
              hasActivityData={engagementActivity !== null}
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
      {cards.map(({ label, value }) => (
        <div
          key={label}
          className="rounded-2xl border border-ink-100 bg-white p-5 flex flex-col gap-1.5 shadow-sm"
        >
          <span className="text-xs font-medium text-ink-500 uppercase tracking-wide">
            {label}
          </span>
          <span className="text-2xl font-extrabold text-ink-900">{value}</span>
        </div>
      ))}
    </div>
  );
}

function PlaceholderPanel({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-ink-700 mb-3">{title}</h2>
      <p className="text-sm text-ink-400 py-8 text-center">{body}</p>
    </div>
  );
}

function EngagementSubTabCharts({
  subTab,
  data,
  hasActivityData,
}: {
  subTab: EngagementSubTab;
  data: EngagementActivity['activityByDay'];
  hasActivityData: boolean;
}) {
  if (subTab === 'chat') {
    return (
      <div className="grid gap-4 xl:grid-cols-2">
        <EngagementChartPanel
          title="14-Day Chat Starts"
          data={data}
          hasActivityData={hasActivityData}
          series={['chats']}
        />
        <PlaceholderPanel
          title="14-Day Messages Sent"
          body="Chat-only message time series is not wired yet."
        />
      </div>
    );
  }

  if (subTab === 'thread') {
    return (
      <div className="grid gap-4 xl:grid-cols-3">
        <PlaceholderPanel
          title="14-Day Thread Opens"
          body="Thread open time series is not wired yet."
        />
        <PlaceholderPanel
          title="14-Day Thread Joins"
          body="Thread join time series is not wired yet."
        />
        <EngagementChartPanel
          title="14-Day Thread Activity"
          data={data}
          hasActivityData={hasActivityData}
          series={['threadActivity']}
        />
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <PlaceholderPanel
        title="14-Day Sign Ups"
        body="Sign up time series is not wired yet."
      />
      <PlaceholderPanel
        title="14-Day Verified Users"
        body="Verified user time series is not wired yet."
      />
      <PlaceholderPanel
        title="14-Day Returning Users"
        body="Returning user time series is not wired yet."
      />
    </div>
  );
}

function EngagementChartPanel({
  title,
  data,
  hasActivityData,
  series,
}: {
  title: string;
  data: EngagementActivity['activityByDay'];
  hasActivityData: boolean;
  series: EngagementSeries[];
}) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-ink-700 mb-4">{title}</h2>
      {!hasActivityData ? (
        <p className="text-sm text-red-600 py-8 text-center">
          Activity data could not be loaded. Please try refreshing.
        </p>
      ) : data.length === 0 ? (
        <p className="text-sm text-ink-400 py-8 text-center">No activity data for this period.</p>
      ) : (
        <EngagementChart data={data} series={series} />
      )}
    </div>
  );
}
