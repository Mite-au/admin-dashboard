import { Topbar } from '@/components/Topbar';
import { getUsers } from '@/lib/fetchers';
import { UsersClient } from './UsersClient';

export default async function UsersPage() {
  const data = await getUsers(1, 12);
  return (
    <>
      <Topbar title="Users" />
      <main className="flex-1 p-6"><UsersClient data={data} /></main>
    </>
  );
}
