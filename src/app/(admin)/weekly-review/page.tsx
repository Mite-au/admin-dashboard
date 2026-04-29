import { PageHeader } from '@/components/PageHeader';
import { Topbar } from '@/components/Topbar';
import { getWeeklyMetrics } from '@/lib/fetchers';
import { WeeklyReviewClient } from './WeeklyReviewClient';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function WeeklyReviewPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const date = first(sp.date);
  const data = await getWeeklyMetrics(date);

  return (
    <>
      <Topbar breadcrumbs={[{ label: 'Weekly Review', href: '/weekly-review' }]} />
      <PageHeader title="Weekly Review" />
      <WeeklyReviewClient data={data} />
    </>
  );
}
