import { PageHeader } from '@/components/PageHeader';
import { Topbar } from '@/components/Topbar';
import { getThreadRequests, type ThreadRequestFilters } from '@/lib/fetchers';
import { ThreadRequestsClient } from './ThreadRequestsClient';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const THREAD_REQUEST_STATUSES = new Set(['PENDING', 'APPROVED', 'REJECTED']);

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function statusParam(v: string | string[] | undefined): string | undefined {
  const value = first(v)?.toUpperCase();
  return value && THREAD_REQUEST_STATUSES.has(value) ? value : undefined;
}

export default async function ThreadRequestsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const filters: ThreadRequestFilters = {
    status: statusParam(sp.status),
  };
  const requests = await getThreadRequests(filters);

  return (
    <>
      <Topbar breadcrumbs={[{ label: 'Thread Requests', href: '/thread-requests' }]} />
      <PageHeader title="Thread Requests" />
      <ThreadRequestsClient requests={requests} filters={filters} />
    </>
  );
}
