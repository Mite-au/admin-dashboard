'use client';

import { useState } from 'react';
import type { OverviewStats } from '@/lib/types';
import { ActivityChart } from './ActivityChart';

type Tab = 'overview' | 'engagement';

interface Props {
  data: OverviewStats;
}

export function OverviewTabLayout({ data }: Props) {
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

      {/* Engagement tab — placeholder */}
      {activeTab === 'engagement' && (
        <div id="tabpanel-engagement" role="tabpanel" aria-labelledby="tab-engagement" className="rounded-2xl border border-ink-100 bg-white p-12 flex flex-col items-center justify-center gap-3 shadow-sm min-h-[320px]">
          <span className="text-2xl">📊</span>
          <p className="text-sm font-medium text-ink-700">Engagement data coming soon</p>
          <p className="text-xs text-ink-400">
            Metrics will appear here once the engagement endpoints are wired.
          </p>
        </div>
      )}
    </div>
  );
}
