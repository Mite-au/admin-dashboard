import { Topbar } from '@/components/Topbar';
import { PageHeader } from '@/components/PageHeader';
import { getOverview } from '@/lib/fetchers';
import { OverviewTabLayout } from './OverviewTabLayout';

export default async function OverviewPage() {
  const data = await getOverview();

  return (
    <>
      <Topbar breadcrumbs={[{ label: 'Overview', href: '/overview' }]} />
      <PageHeader title="Overview" />
      <OverviewTabLayout data={data} />
    </>
  );
}
