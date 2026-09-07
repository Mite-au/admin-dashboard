import { Topbar } from '@/components/Topbar';
import { PageHeader } from '@/components/PageHeader';
import { getReports, type ReportFilters } from '@/lib/fetchers';
import type { AdminReportStatus, AdminReportTargetType } from '@/lib/types';
import { REPORT_TARGET_TYPES } from './ReportTarget';
import { TrustSafetyClient } from './TrustSafetyClient';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

/** A hand-edited `?page=abc` must not become `page=NaN` in the API call. */
function pageParam(v: string | string[] | undefined): number {
  const n = Number(first(v));
  return Number.isInteger(n) && n > 0 ? n : 1;
}

function parseReportStatus(value: string | undefined): AdminReportStatus | undefined {
  return value === 'open' || value === 'resolved' ? value : undefined;
}

/**
 * `targetType` is `@IsIn`-validated on the backend across all five members, so
 * an unknown value would be a 400 rather than an ignored filter. Anything not
 * in the union is dropped from the URL instead.
 */
function parseReportTargetType(value: string | undefined): AdminReportTargetType | undefined {
  return REPORT_TARGET_TYPES.includes(value as AdminReportTargetType)
    ? (value as AdminReportTargetType)
    : undefined;
}

export default async function TrustSafetyPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const filters: ReportFilters = {
    page: pageParam(sp.page),
    status: parseReportStatus(first(sp.status)),
    targetType: parseReportTargetType(first(sp.targetType)),
  };
  const data = await getReports(filters);

  return (
    <>
      <Topbar breadcrumbs={[{ label: 'Trust & Safety', href: '/trust-safety' }]} />
      <PageHeader
        title="Trust & Safety"
        description="What members have reported about each other's posts, profiles and messages. Open a report to read the evidence and mark it resolved."
      />
      <TrustSafetyClient data={data} filters={filters} />
    </>
  );
}
