import { Topbar } from '@/components/Topbar';
import { PageHeader } from '@/components/PageHeader';
import { getOverview, getEngagementSummary, getEngagementActivity } from '@/lib/fetchers';
import { OverviewTabLayout } from './OverviewTabLayout';

export default async function OverviewPage() {
  const [overview, engagementSummary, engagementActivity] = await Promise.all([
    getOverview(),
    getEngagementSummary().catch(() => null),
    getEngagementActivity().catch(() => null),
  ]);

  return (
    <>
      <Topbar breadcrumbs={[{ label: 'Overview', href: '/overview' }]} />
      <PageHeader title="Overview" />
      <OverviewTabLayout
        data={overview}
        engagementSummary={engagementSummary}
        engagementActivity={engagementActivity}
      />
    </>
  );
}
