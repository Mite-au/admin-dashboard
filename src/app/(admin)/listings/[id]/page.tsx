import { Topbar } from '@/components/Topbar';
import { PageHeader } from '@/components/PageHeader';
import { getPost, getUser, optional } from '@/lib/fetchers';
import { formatDate } from '@/lib/format';
import { ListingDetailClient } from './ListingDetailClient';

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPost(id);
  // Listings from deleted or anonymised accounts come back without a seller,
  // and the seller lookup itself can 404 — neither should kill the page.
  const sellerId = post?.seller?.id;
  const seller = sellerId ? await optional(getUser(sellerId)) : null;

  const displayTitle = post.title?.trim() || `Listing i${id}`;

  return (
    <>
      <Topbar
        breadcrumbs={[
          { label: 'Listings', href: '/listings' },
          { label: displayTitle, href: `/listings/${id}` },
        ]}
      />
      <PageHeader
        title={displayTitle}
        description={`Item i${id} · listed ${formatDate(post.createdAt)}`}
      />
      <ListingDetailClient post={post} seller={seller} />
    </>
  );
}
