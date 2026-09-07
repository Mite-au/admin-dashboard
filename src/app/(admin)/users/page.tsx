import { Topbar } from '@/components/Topbar';
import { PageHeader } from '@/components/PageHeader';
import { getUsers, type UserFilters } from '@/lib/fetchers';
import { UsersClient } from './UsersClient';
import { UsersExportButton } from './UsersExportButton';

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

/**
 * Mirrors the options in UsersClient. `listUsers` ignores anything else
 * (e.g. a bookmarked `?status=pending_deletion`), which would leave the URL
 * claiming a filter the select cannot show and the backend does not apply.
 */
const STATUS_FILTERS = new Set(['active', 'pending_profile', 'suspended', 'banned', 'deleted']);

function statusFilter(v: string | undefined): string | undefined {
  return v && STATUS_FILTERS.has(v) ? v : undefined;
}

export default async function UsersPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const filters: UserFilters = {
    page: pageParam(sp.page),
    name: first(sp.name),
    email: first(sp.email),
    phone: first(sp.phone),
    memberId: first(sp.memberId),
    status: statusFilter(first(sp.status)),
  };
  const data = await getUsers(filters);

  return (
    <>
      <Topbar breadcrumbs={[{ label: 'Users', href: '/users' }]} />
      <PageHeader
        title="Users"
        description="Every registered account, with verification state and standing. Open a row for the full record and the moderation controls."
        actions={<UsersExportButton users={data.items} />}
      />
      <UsersClient data={data} filters={filters} />
    </>
  );
}
