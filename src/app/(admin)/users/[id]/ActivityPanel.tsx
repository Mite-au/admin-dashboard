'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ScrollText } from 'lucide-react';
import { DetailTabs } from '@/components/DetailTabs';
import { Card, EmptyState } from '@/components/ui';
import type {
  AdminPost,
  AdminReport,
  AdminUserConversation,
  AdminUserPurchase,
  AdminUserThread,
  Paged,
} from '@/lib/types';
import { ConversationsList } from './ConversationsList';
import { PurchasesTable } from './PurchasesTable';
import { ReportsTable } from './ReportsTable';
import { SoldItemsTable } from './SoldItemsTable';
import { ThreadsList } from './ThreadsList';

type TabKey = 'listings' | 'purchases' | 'threads' | 'chat' | 'reports' | 'logs';

/**
 * Everything the account has done, one section at a time.
 *
 * Uses the underline `DetailTabs` rather than the segmented `ui/Tabs`: these
 * are sections of a single record, not a switch between what the page shows.
 */
export function ActivityPanel({
  sold,
  purchased,
  threads,
  conversations,
  reports,
}: {
  sold: Paged<AdminPost>;
  purchased: Paged<AdminUserPurchase>;
  threads: AdminUserThread[];
  conversations: AdminUserConversation[];
  reports: AdminReport[];
}) {
  const [tab, setTab] = useState<TabKey>('listings');

  const tabs = [
    { key: 'listings', label: 'Listings', count: sold.total },
    { key: 'purchases', label: 'Purchases', count: purchased.total },
    { key: 'threads', label: 'Threads', count: threads.length },
    { key: 'chat', label: 'Chat', count: conversations.length },
    { key: 'reports', label: 'Reports', count: reports.length },
    // No count: there is no log feed to count yet, and DetailTabs hides the
    // chip when the count is undefined rather than printing a misleading 0.
    { key: 'logs', label: 'Logs' },
  ];

  const activeLabel = tabs.find((t) => t.key === tab)?.label ?? 'Activity';

  return (
    <Card bleed className="lg:col-span-8">
      <div className="px-5 pt-5">
        <DetailTabs tabs={tabs} active={tab} onChange={(k) => setTab(k as TabKey)} />
      </div>

      <div role="tabpanel" aria-label={activeLabel}>
        {tab === 'listings' && <SoldItemsTable posts={sold} />}
        {tab === 'purchases' && <PurchasesTable purchases={purchased} />}
        {tab === 'threads' && <ThreadsList threads={threads} />}
        {tab === 'chat' && <ConversationsList conversations={conversations} />}
        {tab === 'reports' && <ReportsTable reports={reports} />}
        {tab === 'logs' && (
          <EmptyState
            icon={ScrollText}
            title="No activity log for this account"
            description="Per-account audit history isn't recorded yet. Sign-in activity across the platform is on the User logins page."
            action={
              <Link href="/user-logins" className="btn btn-pill-ghost">
                Open user logins
              </Link>
            }
          />
        )}
      </div>
    </Card>
  );
}
