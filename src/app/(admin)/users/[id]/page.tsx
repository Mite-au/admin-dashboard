import { Topbar } from '@/components/Topbar';
import { PageHeader } from '@/components/PageHeader';
import { getUser, getUserConversations, getUserPosts, getUserPurchases, getUserReports, getUserThreads } from '@/lib/fetchers';
import { UserDetailClient } from './UserDetailClient';

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, sold, threads, conversations, purchased, reports] = await Promise.all([
    getUser(id),
    getUserPosts(id),
    getUserThreads(id),
    getUserConversations(id),
    getUserPurchases(id),
    getUserReports(id),
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
        purchased={purchased}
        reports={reports}
      />
    </>
  );
}
