import { Topbar } from '@/components/Topbar';
import { PageHeader } from '@/components/PageHeader';
import { getPosts, type PostFilters } from '@/lib/fetchers';
import { ListingsClient } from './ListingsClient';
import { ListingsExportButton } from './ListingsExportButton';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

/**
 * A hand-edited `?page=abc` must not become `page=NaN` in the API call —
 * `qs()` only drops undefined/null/'', so NaN would be stringified into the
 * query and `@IsInt()` on the DTO would 400 the whole page.
 */
function pageParam(v: string | string[] | undefined): number {
  const n = Number(first(v));
  return Number.isInteger(n) && n > 0 ? n : 1;
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

export default async function ListingsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const filters: PostFilters = {
    page: pageParam(sp.page),
    title: first(sp.title),
    priceMin: num(sp.priceMin),
    priceMax: num(sp.priceMax),
    category: first(sp.category),
    memberId: first(sp.memberId),
    status: first(sp.status),
  };
  const data = await getPosts(filters);

  return (
    <>
      <Topbar breadcrumbs={[{ label: 'Listings', href: '/listings' }]} />
      <PageHeader
        title="Listings"
        description="Every item posted to the marketplace. Open a row to review the photos, the seller, and the publish controls."
        actions={<ListingsExportButton posts={data.items} />}
      />
      <ListingsClient data={data} filters={filters} />
    </>
  );
}
