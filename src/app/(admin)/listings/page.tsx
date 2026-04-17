import { Topbar } from '@/components/Topbar';
import { PageHeader } from '@/components/PageHeader';
import { getPosts, type PostFilters } from '@/lib/fetchers';
import { ListingsClient } from './ListingsClient';

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

export default async function ListingsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const filters: PostFilters = {
    page: Number(first(sp.page) ?? 1),
    title: first(sp.title),
    priceMin: num(sp.priceMin),
    priceMax: num(sp.priceMax),
    category: first(sp.category),
    memberId: first(sp.memberId),
  };
  const data = await getPosts(filters);

  return (
    <>
      <Topbar breadcrumbs={['Listing']} />
      <PageHeader title="Listing" />
      <ListingsClient data={data} filters={filters} />
    </>
  );
}
