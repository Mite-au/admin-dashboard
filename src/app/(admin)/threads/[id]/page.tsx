import { PageHeader } from '@/components/PageHeader';
import { Topbar } from '@/components/Topbar';
import { getThread } from '@/lib/fetchers';
import { ThreadDetailClient } from './ThreadDetailClient';

export default async function ThreadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const thread = await getThread(id);

  return (
    <>
      <Topbar
        breadcrumbs={[
          { label: 'Thread', href: '/threads' },
          { label: 'Thread detail', href: `/threads/${id}` },
        ]}
      />
      <PageHeader title="Thread detail" />
      <ThreadDetailClient thread={thread} />
    </>
  );
}
