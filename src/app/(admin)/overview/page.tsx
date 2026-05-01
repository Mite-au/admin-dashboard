import { Topbar } from '@/components/Topbar';
import { PageHeader } from '@/components/PageHeader';
import {
  getActivityOverview,
  getEngagementActivity,
  getEngagementSummary,
  getListingsOverview,
  getOverview,
  getReportsOverview,
  getTransactionsOverview,
} from '@/lib/fetchers';
import { OverviewTabLayout } from './OverviewTabLayout';

export default async function OverviewPage() {
  const [
    overview,
    engagementSummary,
    engagementActivity,
    reportsOverview,
    transactionsOverview,
    listingsOverview,
    activityOverview,
  ] = await Promise.all([
    getOverview(),
    getEngagementSummary().catch(() => null),
    getEngagementActivity().catch(() => null),
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
