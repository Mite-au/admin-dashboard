import { Topbar } from '@/components/Topbar';
import { getPosts } from '@/lib/fetchers';
import { ListingsClient } from './ListingsClient';

export default async function ListingsPage() {
  const data = await getPosts(1, 12);
  return (
    <>
      <Topbar title="Listings" />
      <main className="flex-1 p-6"><ListingsClient data={data} /></main>
    </>
  );
}
