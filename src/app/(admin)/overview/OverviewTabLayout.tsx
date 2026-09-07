'use client';

import { Suspense, useCallback, useState } from 'react';
import { DetailTabs } from '@/components/DetailTabs';
import { PeriodSelector } from '@/components/PeriodSelector';
import { Tabs } from '@/components/ui';
import type { PeriodParams, PeriodRange } from '@/lib/period';
import type {
  ActivityOverview,
  ChatOverview,
  EngagementActivity,
  EngagementSummary,
  FunnelResponse,
  ListingsOverview,
  OverviewStats,
  ReportsOverview,
  SearchGapsResponse,
  ThreadsOverview,
  TransactionsOverview,
  UserLoginsResponse,
} from '@/lib/types';
import { ActivationPanel } from './panels/ActivationPanel';
import { ChatPanel } from './panels/ChatPanel';
import { DemandTile } from './panels/ContextTiles';
import { EngagementHeadline } from './panels/EngagementHeadline';
import { ListingsPanel } from './panels/ListingsPanel';
import { PlatformStrip } from './panels/PlatformStrip';
import { PulseGrid } from './panels/PulseGrid';
import { ReportsPanel } from './panels/ReportsPanel';
import { ThreadsPanel } from './panels/ThreadsPanel';
import { TradePathCard } from './panels/TradePathCard';
import { TransactionsPanel } from './panels/TransactionsPanel';
import {
  SECTION_LABELS,
  TAB_LABELS,
  resolveSection,
  resolveTab,
  sectionsFor,
  type OverviewSection,
  type OverviewTab,
} from './tabs';

interface Props {
  period: PeriodRange;
  periodParams: PeriodParams;
  initialTab: OverviewTab;
  initialSection: OverviewSection;
  overview: OverviewStats;
  chatOverview: ChatOverview | null;
  threadsOverview: ThreadsOverview | null;
  engagementSummary: EngagementSummary | null;
  engagementActivity: EngagementActivity | null;
  reportsOverview: ReportsOverview | null;
  transactionsOverview: TransactionsOverview | null;
  listingsOverview: ListingsOverview | null;
  activityOverview: ActivityOverview | null;
  funnel: FunnelResponse | null;
  searchGaps: SearchGapsResponse | null;
  userLogins: UserLoginsResponse | null;
}

/**
 * A digest, then two tabs, over one period.
 *
 * The digest is the part that needs no clicking: the trade path, the demand
 * the catalogue is missing, and the eight flows that describe the period.
 * Below it, each tab opens with the numbers that describe the whole of it,
 * then a section switcher for the surface you want to read.
 *
 * The selection lives in the URL so a refresh or a pasted link lands where the
 * sender was — but it is written with `history.replaceState` rather than the
 * router. Every panel's data is already in this component; a router navigation
 * would re-run all twelve of the page's fetches to move a tab.
 */
export function OverviewTabLayout({
  period,
  periodParams,
  initialTab,
  initialSection,
  overview,
  chatOverview,
  threadsOverview,
  engagementSummary,
  engagementActivity,
  reportsOverview,
  transactionsOverview,
  listingsOverview,
  activityOverview,
  funnel,
  searchGaps,
  userLogins,
}: Props) {
  const [tab, setTab] = useState<OverviewTab>(initialTab);
  // Each tab remembers its own section, so flipping across and back returns to
  // what you were reading rather than resetting to the first one.
  const [sections, setSections] = useState<Record<OverviewTab, OverviewSection>>(() => ({
    overview: resolveSection('overview', initialTab === 'overview' ? initialSection : null),
    engagement: resolveSection('engagement', initialTab === 'engagement' ? initialSection : null),
  }));

  const section = sections[tab];

  const syncUrl = useCallback((nextTab: OverviewTab, nextSection: OverviewSection) => {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', nextTab);
    url.searchParams.set('section', nextSection);
    window.history.replaceState(null, '', url);
  }, []);

  const handleTab = useCallback(
    (id: string) => {
      const nextTab = resolveTab(id);
      setTab(nextTab);
      syncUrl(nextTab, sections[nextTab]);
    },
    [sections, syncUrl],
  );

  const handleSection = useCallback(
    (id: string) => {
      const nextSection = resolveSection(tab, id);
      setSections((current) => ({ ...current, [tab]: nextSection }));
      syncUrl(tab, nextSection);
    },
    [tab, syncUrl],
  );

  /** A digest tile was clicked: open its section and bring the tabs into view. */
  const openSection = useCallback(
    (nextTab: OverviewTab, nextSection: OverviewSection) => {
      setTab(nextTab);
      setSections((current) => ({ ...current, [nextTab]: nextSection }));
      syncUrl(nextTab, nextSection);
      const target = document.getElementById('overview-detail');
      if (target) {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      }
    },
    [syncUrl],
  );

  return (
    <div className="space-y-8 px-8 pb-10">
      <Suspense>
        <PeriodSelector />
      </Suspense>

      <section aria-labelledby="overview-digest-heading" className="space-y-5">
        <h2 id="overview-digest-heading" className="sr-only">
          Period digest
        </h2>
        <div className="grid gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <TradePathCard data={funnel} period={period} periodParams={periodParams} />
          </div>
          <DemandTile data={searchGaps} period={period} periodParams={periodParams} />
        </div>
        <PulseGrid
          period={period}
          periodParams={periodParams}
          activity={activityOverview}
          listings={listingsOverview}
          chat={chatOverview}
          transactions={transactionsOverview}
          reports={reportsOverview}
          threads={threadsOverview}
          onOpen={openSection}
        />
      </section>

      <div id="overview-detail" className="scroll-mt-6 space-y-6">
        <Tabs
          tabs={(['overview', 'engagement'] as const).map((id) => ({
            id,
            label: TAB_LABELS[id],
          }))}
          active={tab}
          onChange={handleTab}
          controls="overview-tabpanel"
        />

        <div
          id="overview-tabpanel"
          role="tabpanel"
          aria-label={`${TAB_LABELS[tab]} · ${SECTION_LABELS[section]}`}
          className="space-y-6"
        >
          {tab === 'overview' ? (
            <PlatformStrip data={overview} reports={reportsOverview} period={period} />
          ) : (
            <EngagementHeadline
              summary={engagementSummary}
              activity={engagementActivity}
              logins={userLogins}
              period={period}
            />
          )}

          <DetailTabs
            tabs={sectionsFor(tab).map((id) => ({ key: id, label: SECTION_LABELS[id] }))}
            active={section}
            onChange={handleSection}
            controls="overview-tabpanel"
          />

          <div className="space-y-6">
            {section === 'listings' && (
              <ListingsPanel data={listingsOverview} period={period} />
            )}
            {section === 'transactions' && (
              <TransactionsPanel data={transactionsOverview} period={period} />
            )}
            {section === 'reports' && <ReportsPanel data={reportsOverview} period={period} />}
            {section === 'chat' && <ChatPanel data={chatOverview} period={period} />}
            {section === 'threads' && <ThreadsPanel data={threadsOverview} period={period} />}
            {section === 'activation' && (
              <ActivationPanel data={activityOverview} period={period} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
