import type {
  AdminPost,
  AdminReport,
  AdminUser,
  AdminUserConversation,
  AdminUserPurchase,
  AdminUserThread,
  Paged,
} from '@/lib/types';
import { ActivityPanel } from './ActivityPanel';
import { ProfilePanel } from './ProfilePanel';

/**
 * Two-column record: who the account is on the left, what it has done on the
 * right.
 *
 * Deliberately not a client component — the interactive parts (status,
 * verification, resets, tabs) are leaves that opt in for themselves, so the
 * static half of the page stays server-rendered.
 */
export function UserDetail({
  user,
  sold,
  threads,
  conversations,
  purchased,
  reports,
}: {
  user: AdminUser;
  sold: Paged<AdminPost>;
  threads: AdminUserThread[];
  conversations: AdminUserConversation[];
  purchased: Paged<AdminUserPurchase>;
  reports: AdminReport[];
}) {
  return (
    <div className="grid grid-cols-1 gap-6 px-8 pb-8 lg:grid-cols-12 lg:items-start">
      <ProfilePanel user={user} />
      <ActivityPanel
        sold={sold}
        purchased={purchased}
        threads={threads}
        conversations={conversations}
        reports={reports}
      />
    </div>
  );
}
