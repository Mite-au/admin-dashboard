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

export default async function ThreadsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const filters: ThreadFilters = {
    page: Number(first(sp.page) ?? 1),
    name: first(sp.name),
    type: first(sp.type),
    minMembers: num(sp.minMembers),
    memberId: first(sp.memberId),
  };
  const data = await getThreads(filters);

  return (
    <>
      <Topbar breadcrumbs={[{ label: 'Thread', href: '/threads' }]} />
      <PageHeader title="Thread" />
      <ThreadsClient data={data} filters={filters} />
    </>
  );
}
