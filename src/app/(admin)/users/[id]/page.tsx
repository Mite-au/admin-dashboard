import { Topbar } from '@/components/Topbar';
import { PageHeader } from '@/components/PageHeader';
import {
  emptyPage,
  getUser,
  getUserConversations,
  getUserPosts,
  getUserPurchases,
  getUserReports,
  getUserThreads,
  optional,
} from '@/lib/fetchers';
import { formatDate } from '@/lib/format';
import type { AdminPost, AdminUserPurchase } from '@/lib/types';
import { UserDetail } from './UserDetail';

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Only the user record is fatal — a missing tab endpoint should render an
  // empty tab, not blow up the whole detail page.
  const [user, sold, threads, conversations, purchased, reports] = await Promise.all([
    getUser(id),
    optional(getUserPosts(id), emptyPage<AdminPost>()),
    optional(getUserThreads(id), []),
    optional(getUserConversations(id), []),
    optional(getUserPurchases(id), emptyPage<AdminUserPurchase>()),
    optional(getUserReports(id), []),
  ]);

  const displayName = user.name?.trim() || `m${id}`;

  return (
    <>
      <Topbar
        breadcrumbs={[
          { label: 'Users', href: '/users' },
          { label: displayName, href: `/users/${id}` },
        ]}
      />
      <PageHeader
        title={displayName}
        description={`Member m${id} · joined ${formatDate(user.signUpAt ?? user.createdAt)}`}
      />
      <UserDetail
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
