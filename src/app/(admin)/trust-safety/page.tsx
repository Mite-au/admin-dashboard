import { Topbar } from '@/components/Topbar';
import { PageHeader } from '@/components/PageHeader';
import { getReports, type ReportFilters } from '@/lib/fetchers';
import type { AdminReportStatus, AdminReportTargetType } from '@/lib/types';
import { TrustSafetyClient } from './TrustSafetyClient';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

function parseReportStatus(value: string | undefined): AdminReportStatus | undefined {
  return value === 'open' || value === 'resolved' ? value : undefined;
}

function parseReportTargetType(value: string | undefined): AdminReportTargetType | undefined {
  return value === 'post' || value === 'user' ? value : undefined;
}

export default async function TrustSafetyPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const filters: ReportFilters = {
    page: Number(first(sp.page) ?? 1),
    status: parseReportStatus(first(sp.status)),
    targetType: parseReportTargetType(first(sp.targetType)),
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
