import { Topbar } from '@/components/Topbar';
import { PageHeader } from '@/components/PageHeader';
import { getReports, type ReportFilters } from '@/lib/fetchers';
import { TrustSafetyClient } from './TrustSafetyClient';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

export default async function TrustSafetyPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const filters: ReportFilters = {
    page: Number(first(sp.page) ?? 1),
    status: first(sp.status),
    targetType: first(sp.targetType),
  };
  const data = await getReports(filters);

  return (
    <>
      <Topbar breadcrumbs={[{ label: 'Trust & Safety', href: '/trust-safety' }]} />
      <PageHeader title="Trust & Safety" />
      <TrustSafetyClient data={data} filters={filters} />
    </>
  );
}
