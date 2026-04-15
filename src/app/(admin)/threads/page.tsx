import { Topbar } from '@/components/Topbar';
import { getThreads } from '@/lib/fetchers';
import { ThreadsClient } from './ThreadsClient';

export default async function ThreadsPage() {
  const data = await getThreads(1, 12);
  return (
    <>
      <Topbar title="Threads" />
      <main className="flex-1 p-6"><ThreadsClient data={data} /></main>
    </>
  );
}
