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
} from '@/lib/fetchers';
import { resolvePeriodFromRecord } from '@/lib/period';
import { OverviewTabLayout } from './OverviewTabLayout';

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
    getChatOverview(period).catch(() => null),
    getThreadsOverview(period).catch(() => null),
    getEngagementSummary(period).catch(() => null),
    getReportsOverview(period).catch(() => null),
    getTransactionsOverview(period).catch(() => null),
    getListingsOverview(period).catch(() => null),
    getActivityOverview(period).catch(() => null),
  ]);

  return (
    <>
      <Topbar breadcrumbs={[{ label: 'Overview', href: '/overview' }]} />
      <PageHeader title="Overview" />
      <OverviewTabLayout
        data={overview}
        chatOverview={chatOverview}
        threadsOverview={threadsOverview}
        engagementSummary={engagementSummary}
        reportsOverview={reportsOverview}
        transactionsOverview={transactionsOverview}
        listingsOverview={listingsOverview}
        activityOverview={activityOverview}
      />
    </>
  );
}
