import { Topbar } from '@/components/Topbar';
import { PageHeader } from '@/components/PageHeader';
import { getPost } from '@/lib/fetchers';
import { ListingDetailClient } from './ListingDetailClient';

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPost(id);

  return (
    <>
      <Topbar breadcrumbs={['Listing', 'List detail']} />
      <PageHeader title="List detail" />
      <ListingDetailClient post={post} />
    </>
  );
}
