import { PageHeader } from '@/components/PageHeader';
import { Topbar } from '@/components/Topbar';
import { getWeeklyMetrics } from '@/lib/fetchers';
import { WeeklyReviewClient } from './WeeklyReviewClient';

export default async function WeeklyReviewPage() {
  const data = await getWeeklyMetrics();

  return (
    <>
      <Topbar breadcrumbs={[{ label: 'Weekly Review', href: '/weekly-review' }]} />
      <PageHeader title="Weekly Review" />
      <WeeklyReviewClient data={data} />
    </>
  );
}
