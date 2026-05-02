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
import { OverviewTabLayout } from './OverviewTabLayout';

export default async function OverviewPage() {
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
    getOverview(),
    getChatOverview().catch(() => null),
    getThreadsOverview().catch(() => null),
    getEngagementSummary().catch(() => null),
    getReportsOverview().catch(() => null),
    getTransactionsOverview().catch(() => null),
    getListingsOverview().catch(() => null),
    getActivityOverview().catch(() => null),
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
