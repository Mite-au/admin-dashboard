import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Topbar } from '@/components/Topbar';
import { getThread } from '@/lib/fetchers';
import { splitThreadName } from '@/lib/threadModel';
import { ThreadDetailClient } from './ThreadDetailClient';

export default async function ThreadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const thread = await getThread(id);
  const { topicName, regionName } = splitThreadName(thread.name);
  const heading = topicName || 'Thread detail';

  return (
    <>
      <Topbar
        breadcrumbs={[
          { label: 'Thread', href: '/threads' },
          { label: heading, href: `/threads/${id}` },
        ]}
      />
      <PageHeader
        title={heading}
        description={regionName ?? undefined}
        actions={
          <Link href="/threads" className="btn-icon">
            <ArrowLeft size={14} strokeWidth={1.9} />
            All threads
          </Link>
        }
      />
      <ThreadDetailClient thread={thread} />
    </>
  );
}
