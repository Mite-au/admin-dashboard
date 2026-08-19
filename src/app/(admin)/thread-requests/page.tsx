import { PageHeader } from '@/components/PageHeader';
import { Topbar } from '@/components/Topbar';
import { getThreadRequests, type ThreadRequestFilters } from '@/lib/fetchers';
import { ThreadRequestsClient, type QueueTab } from './ThreadRequestsClient';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const REVIEW_STATUSES = new Set<QueueTab>(['PENDING', 'APPROVED', 'REJECTED']);

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/**
 * The queue opens on the work: no `?status=` means PENDING, not "everything".
 * The old default fetched every status while the control read "Pending", so
 * the tab and the rows below it disagreed.
 */
function tabParam(v: string | string[] | undefined): QueueTab {
  const value = first(v)?.toUpperCase() as QueueTab | undefined;
  if (value === 'ALL') return 'ALL';
  return value && REVIEW_STATUSES.has(value) ? value : 'PENDING';
}

export default async function ThreadRequestsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const tab = tabParam(sp.status);
  const filters: ThreadRequestFilters = { status: tab === 'ALL' ? undefined : tab };

  // `getThreadRequests` is a bare `api<AdminThreadRequest[]>` cast — unlike its
  // sibling `getUserReports`, it doesn't run the response through `toArray`.
  // A 204 or an `{ items: [] }` envelope would reach `.map` as a non-array and
  // take the render down, so the list is coerced once here at the boundary.
  const raw = await getThreadRequests(filters);
  const requests = Array.isArray(raw) ? raw : [];

  return (
    <>
      <Topbar breadcrumbs={[{ label: 'Thread Requests', href: '/thread-requests' }]} />
      <PageHeader
        title="Thread Requests"
        description="Members asking for a community thread that doesn't exist yet. Approving a request creates the thread it describes; rejecting closes it with an optional note."
      />
      <ThreadRequestsClient requests={requests} tab={tab} />
    </>
  );
}
