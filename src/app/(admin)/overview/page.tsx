import { PageHeader } from '@/components/PageHeader';
import { Topbar } from '@/components/Topbar';
import {
  getActivityOverview,
  getChatOverview,
  getEngagementActivity,
  getEngagementSummary,
  getListingsOverview,
  getOverview,
  getReportsOverview,
  getThreadsOverview,
  getTransactionsOverview,
  optional,
} from '@/lib/fetchers';
import { resolvePeriodFromRecord } from '@/lib/period';
import { OverviewTabLayout } from './OverviewTabLayout';
import { resolveSection, resolveTab } from './tabs';

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Every fetcher normalises at its boundary, so the shapes below are runtime
 * guarantees and need no page-side checking. `optional` is a different job: it
 * covers a request that never returned at all, which no amount of
 * normalisation can fill in — a null section renders its own failure notice
 * rather than taking the other eight down with it.
 */
export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawParams = await searchParams;
  const { from, to } = resolvePeriodFromRecord(rawParams);
  const period = { from, to };

  const tab = resolveTab(first(rawParams.tab));
  const section = resolveSection(tab, first(rawParams.section));

  const [
    overview,
    chatOverview,
    threadsOverview,
    engagementSummary,
    engagementActivity,
    reportsOverview,
    transactionsOverview,
    listingsOverview,
    activityOverview,
  ] = await Promise.all([
    getOverview(period),
    optional(getChatOverview(period)),
    optional(getThreadsOverview(period)),
    optional(getEngagementSummary(period)),
    optional(getEngagementActivity(period)),
    optional(getReportsOverview(period)),
    optional(getTransactionsOverview(period)),
    optional(getListingsOverview(period)),
    optional(getActivityOverview(period)),
  ]);

  return (
    <>
      <Topbar breadcrumbs={[{ label: 'Overview', href: '/overview' }]} />
      <PageHeader
        title="Overview"
        description="Marketplace and engagement health for the selected period, compared against the period before it."
      />
      <OverviewTabLayout
        period={period}
        initialTab={tab}
        initialSection={section}
        overview={overview}
        chatOverview={chatOverview}
        threadsOverview={threadsOverview}
        engagementSummary={engagementSummary}
        engagementActivity={engagementActivity}
        reportsOverview={reportsOverview}
        transactionsOverview={transactionsOverview}
        listingsOverview={listingsOverview}
        activityOverview={activityOverview}
      />
    </>
  );
}
