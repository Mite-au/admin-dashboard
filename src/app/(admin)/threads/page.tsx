import { Topbar } from '@/components/Topbar';
import { PageHeader } from '@/components/PageHeader';
import { getThreads } from '@/lib/fetchers';
import { ThreadsClient } from './ThreadsClient';

export default async function ThreadsPage() {
  const data = await getThreads(1, 15);
  return (
    <>
      <Topbar breadcrumbs={['Thread']} />
      <PageHeader title="Thread" />
      <ThreadsClient data={data} />
    </>
  );
}
