import { Topbar } from '@/components/Topbar';
import { PageHeader } from '@/components/PageHeader';
import {
  getActivityOverview,
  getChatOverview,
  getEngagementSummary,
  getListingsOverview,
  getOverview,
  getReportsOverview,
  getThreadsOverview,
  getTransactionsOverview,
  optional,
} from '@/lib/fetchers';
import { resolvePeriodFromRecord } from '@/lib/period';
import type { EngagementSummary, OverviewStats } from '@/lib/types';
import { OverviewTabLayout } from './OverviewTabLayout';

/**
 * The card and chart renderers read `section.totals.*` and
 * `section.activityByDay.map(...)` without guards, so a payload that's missing
 * either one crashes the whole page. Drop partial sections instead — the
 * layout already has a "not wired" state for a null section.
 */
function usable<T extends { totals?: unknown; activityByDay?: unknown }>(
  section: T | null,
): T | null {
  if (!section) return null;
  const hasTotals = typeof section.totals === 'object' && section.totals !== null;
  return hasTotals && Array.isArray(section.activityByDay) ? section : null;
}

/** EngagementSummary is flat, so it needs its own shape check. */
function usableSummary(summary: EngagementSummary | null): EngagementSummary | null {
  return summary && typeof summary.activeUsers === 'number' ? summary : null;
}

/** `getOverview` is the one fatal fetch — fill in anything it left out. */
function normaliseOverview(raw: OverviewStats): OverviewStats {
  const totals = (raw?.totals ?? {}) as Partial<OverviewStats['totals']>;
  return {
    activityByDay: Array.isArray(raw?.activityByDay) ? raw.activityByDay : [],
    totals: {
      users: totals.users ?? 0,
      verifiedUsers: totals.verifiedUsers ?? 0,
      activeListings: totals.activeListings ?? 0,
      openReports: totals.openReports ?? 0,
      soldPosts: totals.soldPosts,
    },
  };
}

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawParams = await searchParams;
  const { from, to } = resolvePeriodFromRecord(rawParams);
  const period = { from, to };

  const [
    overview,
    chatOverview,
    threadsOverview,
    engagementSummary,
    reportsOverview,
    transactionsOverview,
    listingsOverview,
    activityOverview,
  ] = await Promise.all([
    getOverview(period),
    optional(getChatOverview(period)),
    optional(getThreadsOverview(period)),
    optional(getEngagementSummary(period)),
    optional(getReportsOverview(period)),
    optional(getTransactionsOverview(period)),
    optional(getListingsOverview(period)),
    optional(getActivityOverview(period)),
  ]);

  return (
    <>
      <Topbar breadcrumbs={[{ label: 'Overview', href: '/overview' }]} />
      <PageHeader title="Overview" />
      <OverviewTabLayout
        data={normaliseOverview(overview)}
        chatOverview={usable(chatOverview)}
        threadsOverview={usable(threadsOverview)}
        engagementSummary={usableSummary(engagementSummary)}
        reportsOverview={usable(reportsOverview)}
        transactionsOverview={usable(transactionsOverview)}
        listingsOverview={usable(listingsOverview)}
        activityOverview={usable(activityOverview)}
      />
    </>
  );
}
