import { Topbar } from '@/components/Topbar';
import { PageHeader } from '@/components/PageHeader';
import { getThreads, type ThreadFilters } from '@/lib/fetchers';
import { ThreadsClient } from './ThreadsClient';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

function num(v: string | string[] | undefined): number | undefined {
  const s = first(v);
  if (s === undefined || s === '') return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

/** A hand-edited `?page=abc` must not become `page=NaN` in the API call. */
function pageParam(v: string | string[] | undefined): number {
  const n = Number(first(v));
  return Number.isInteger(n) && n > 0 ? n : 1;
}

export default async function ThreadsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const filters: ThreadFilters = {
    page: pageParam(sp.page),
    name: first(sp.name),
    type: first(sp.type),
    regionCode: first(sp.regionCode),
    interestKey: first(sp.interestKey),
    status: first(sp.status),
    minMembers: num(sp.minMembers),
    memberId: first(sp.memberId),
  };
  const data = await getThreads(filters);

  return (
    <>
      <Topbar breadcrumbs={[{ label: 'Thread', href: '/threads' }]} />
      <PageHeader
        title="Thread"
        description="Every community thread, its region and interest wiring, and how much traffic it carries. Threads that predate the region model are marked Legacy."
      />
      <ThreadsClient data={data} filters={filters} />
    </>
  );
}
