import { Topbar } from '@/components/Topbar';
import { PageHeader } from '@/components/PageHeader';
import { getUser, getUserConversations, getUserPosts, getUserThreads } from '@/lib/fetchers';
import { UserDetailClient } from './UserDetailClient';

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, sold, threads, conversations] = await Promise.all([
    getUser(id),
    getUserPosts(id),
    getUserThreads(id),
    getUserConversations(id),
  ]);

  return (
    <>
      <Topbar
        breadcrumbs={[
          { label: 'User', href: '/users' },
          { label: 'User detail', href: `/users/${id}` },
        ]}
      />
      <PageHeader title="User detail" />
      <UserDetailClient
        user={user}
        sold={sold}
        threads={threads}
        conversations={conversations}
      />
    </>
  );
}
