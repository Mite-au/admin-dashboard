import { Topbar } from '@/components/Topbar';
import { PageHeader } from '@/components/PageHeader';
import { getUsers } from '@/lib/fetchers';
import { UsersClient } from './UsersClient';

export default async function UsersPage() {
  const data = await getUsers(1, 15);
  return (
    <>
      <Topbar breadcrumbs={['User']} />
      <PageHeader title="User" />
      <UsersClient data={data} />
    </>
  );
}
