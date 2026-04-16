import { Topbar } from '@/components/Topbar';
import { PageHeader } from '@/components/PageHeader';
import { getPosts } from '@/lib/fetchers';
import { ListingsClient } from './ListingsClient';

export default async function ListingsPage() {
  const data = await getPosts(1, 15);
  return (
    <>
      <Topbar breadcrumbs={['Listing']} />
      <PageHeader title="Listing" />
      <ListingsClient data={data} />
    </>
  );
}
