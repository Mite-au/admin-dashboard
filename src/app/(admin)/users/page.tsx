import { Topbar } from '@/components/Topbar';
import { PageHeader } from '@/components/PageHeader';
import { getUsers, type UserFilters } from '@/lib/fetchers';
import { UsersClient } from './UsersClient';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

export default async function UsersPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const filters: UserFilters = {
    page: Number(first(sp.page) ?? 1),
    name: first(sp.name),
    email: first(sp.email),
    phone: first(sp.phone),
    memberId: first(sp.memberId),
  };
  const data = await getUsers(filters);

  return (
    <>
      <Topbar breadcrumbs={['User']} />
      <PageHeader title="User" />
      <UsersClient data={data} filters={filters} />
    </>
  );
}
