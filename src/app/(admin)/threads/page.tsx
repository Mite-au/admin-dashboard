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
  // The backend validates these as non-negative integers (@IsInt @Min(0));
  // anything else is a 400 that would take the whole page to the error
  // boundary, so a hand-edited or mistyped value is dropped instead.
  return Number.isInteger(n) && n >= 0 ? n : undefined;
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
        description="Every community thread, how much traffic it carries, and its moderation status. Open a row for the full record."
      />
      <ThreadsClient data={data} filters={filters} />
    </>
  );
}
