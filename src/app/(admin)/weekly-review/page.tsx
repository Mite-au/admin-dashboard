import { PageHeader } from '@/components/PageHeader';
import { Topbar } from '@/components/Topbar';
import { getWeeklyMetrics } from '@/lib/fetchers';
import type {
  WeeklyCoreKpiKey,
  WeeklyMetricUnit,
  WeeklyMetricValue,
  WeeklyMetricsResponse,
} from '@/lib/types';
import { WeeklyReviewClient } from './WeeklyReviewClient';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

const KPI_UNITS: Record<WeeklyCoreKpiKey, WeeklyMetricUnit> = {
  verifiedUsers: 'count',
  firstListingRate: 'rate',
  publishedListings: 'count',
  chatStartRate: 'rate',
  transactionSignals: 'count',
};

/** Monday of the week containing `date`, as YYYY-MM-DD (UTC). */
function isoWeekMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0=Sun
  d.setUTCDate(d.getUTCDate() + (day === 0 ? -6 : 1 - day));
  return d.toISOString().slice(0, 10);
}

function shift(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * The client reads `data.week.*` and every `coreKpis` key unguarded, so a
 * response missing one KPI takes the page down. Fill the gaps with zeroed
 * metrics instead.
 */
function normalise(raw: WeeklyMetricsResponse, requested?: string): WeeklyMetricsResponse {
  const requestedDate = requested ? new Date(`${requested}T00:00:00Z`) : new Date();
  const anchor = Number.isNaN(requestedDate.getTime()) ? new Date() : requestedDate;
  const thisWeekStart = raw?.week?.thisWeekStart ?? isoWeekMonday(anchor);

  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
  const coreKpis = {} as Record<WeeklyCoreKpiKey, WeeklyMetricValue>;
  for (const key of Object.keys(KPI_UNITS) as WeeklyCoreKpiKey[]) {
    const metric = raw?.coreKpis?.[key];
    const thisWeek = num(metric?.thisWeek);
    const lastWeek = num(metric?.lastWeek);
    coreKpis[key] = {
      thisWeek,
      lastWeek,
      delta: typeof metric?.delta === 'number' ? metric.delta : thisWeek - lastWeek,
      unit: metric?.unit ?? KPI_UNITS[key],
    };
  }

  return {
    week: {
      thisWeekStart,
      thisWeekEnd: raw?.week?.thisWeekEnd ?? shift(thisWeekStart, 6),
      lastWeekStart: raw?.week?.lastWeekStart ?? shift(thisWeekStart, -7),
      lastWeekEnd: raw?.week?.lastWeekEnd ?? shift(thisWeekStart, -1),
      timezone: raw?.week?.timezone ?? 'UTC',
    },
    coreKpis,
  };
}

export default async function WeeklyReviewPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const date = first(sp.date);
  const data = normalise(await getWeeklyMetrics(date), date);

  return (
    <>
      <Topbar breadcrumbs={[{ label: 'Weekly Review', href: '/weekly-review' }]} />
      <PageHeader title="Weekly Review" />
      <WeeklyReviewClient data={data} />
    </>
  );
}
