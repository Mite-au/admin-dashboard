import { PageHeader } from '@/components/PageHeader';
import { Topbar } from '@/components/Topbar';
import { getWeeklyMetrics } from '@/lib/fetchers';
import { WeeklyReviewClient } from './WeeklyReviewClient';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * `getWeeklyMetrics` normalises at the boundary: all five week boundaries are
 * rebuilt from whichever anchor the backend sent, and every core KPI is
 * present with its unit resolved. The page used to repeat that work; there is
 * nothing left here to defend against.
 */
export default async function WeeklyReviewPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const data = await getWeeklyMetrics(first(params.date));

  return (
    <>
      <Topbar breadcrumbs={[{ label: 'Weekly Review', href: '/weekly-review' }]} />
      <PageHeader
        title="Weekly Review"
        description="Five core marketplace signals for one ISO week, against the week before it."
      />
      <WeeklyReviewClient data={data} />
    </>
  );
}
