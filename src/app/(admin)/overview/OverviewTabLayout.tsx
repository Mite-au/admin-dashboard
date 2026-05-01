'use client';

import { useState } from 'react';
import type { EngagementActivity, EngagementSummary, OverviewStats } from '@/lib/types';
import { ActivityChart } from './ActivityChart';
import { EngagementChart } from './EngagementChart';

type Tab = 'overview' | 'engagement';

interface Props {
  data: OverviewStats;
  engagementSummary: EngagementSummary | null;
  engagementActivity: EngagementActivity | null;
}

export function OverviewTabLayout({ data, engagementSummary, engagementActivity }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const { totals, activityByDay } = data;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'engagement', label: 'Engagement' },
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

  const engagementCards = engagementSummary
    ? [
        { label: 'Active Users', value: engagementSummary.activeUsers.toLocaleString() },
        { label: 'Chats Started', value: engagementSummary.chatStartedCount.toLocaleString() },
        {
          label: 'Messages Sent (DM + Thread)',
          value: engagementSummary.messageSentCount.toLocaleString(),
        },
        {
          label: 'Thread Active Users',
          value: engagementSummary.threadActiveUsers.toLocaleString(),
        },
      ]
    : null;

  const activityPoints = engagementActivity?.activityByDay ?? [];

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
          {/* Summary cards — per-section error */}
          {engagementSummary === null ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">
              Engagement summary could not be loaded. Please try refreshing.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {engagementCards!.map(({ label, value }) => (
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
          )}

          {/* Activity chart — per-section error */}
          <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-ink-700 mb-4">14-Day Engagement Activity</h2>
            {engagementActivity === null ? (
              <p className="text-sm text-red-600 py-8 text-center">
                Activity data could not be loaded. Please try refreshing.
              </p>
            ) : activityPoints.length === 0 ? (
              <p className="text-sm text-ink-400 py-8 text-center">No activity data for this period.</p>
            ) : (
              <EngagementChart data={activityPoints} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
