'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  Clock3,
  Download,
  Hash,
  MessageSquareText,
  MoreVertical,
  Package,
  RotateCcw,
  Trash2,
  Users,
} from 'lucide-react';
import { DetailTabs } from '@/components/DetailTabs';
import { StatusBadge } from '@/components/StatusBadge';
import { Pagination } from '@/components/Pagination';
import {
  formatCountry,
  formatDate,
  formatDateTime,
  formatMoney,
  formatNumber,
  isImageSrc,
} from '@/lib/format';
import { updateUserStatus, updateSuburbVerification } from '@/lib/actions';
import type { AdminPost, AdminReport, AdminUser, AdminUserConversation, AdminUserPurchase, AdminUserThread, Paged } from '@/lib/types';

type TabKey = 'sold' | 'purchased' | 'thread' | 'chat' | 'reports' | 'logs';
const MUTABLE_USER_STATUSES = ['active', 'suspended', 'pending_profile'] as const;
const MUTABLE_USER_STATUS_SET = new Set<string>(MUTABLE_USER_STATUSES);
type MutableUserStatus = (typeof MUTABLE_USER_STATUSES)[number];

function isMutableUserStatus(value: string): value is MutableUserStatus {
  return MUTABLE_USER_STATUS_SET.has(value);
}

export function UserDetailClient({
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
  const [tab, setTab] = useState<TabKey>('sold');
  const showItemActions = tab === 'sold';

  return (
    <div className="px-8 pb-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* ── Profile card ─────────────────────────────────────────────────── */}
      <section className="card-inner lg:col-span-4 p-6 space-y-6">
        <div className="flex items-center gap-5">
          <div className="h-20 w-20 rounded-full bg-ink-100 flex items-center justify-center overflow-hidden">
            {isImageSrc(user.avatarUrl) ? (
              <Image
                src={user.avatarUrl}
                alt=""
                width={80}
                height={80}
                className="object-cover"
              />
            ) : (
              <svg
                viewBox="0 0 24 24"
                className="h-10 w-10 text-ink-400"
                fill="currentColor"
              >
                <path d="M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-4 0-8 2-8 6v1h16v-1c0-4-4-6-8-6z" />
              </svg>
            )}
          </div>
          <div>
            <div className="text-lg font-bold">m{user.id}</div>
            <StatusDropdown userId={user.id} value={user.status} />
          </div>
        </div>

        <div className="rounded-xl border border-ink-200 p-4 flex items-center gap-4">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-sm text-ink-700 hover:text-ink-900"
          >
            <RotateCcw size={14} />
            Reset
          </button>
          <button
            type="button"
            className="rounded-full border border-ink-200 px-4 py-1.5 text-sm text-ink-700 hover:bg-ink-50"
          >
            Password
          </button>
          <button
            type="button"
            className="rounded-full border border-ink-200 px-4 py-1.5 text-sm text-ink-700 hover:bg-ink-50"
          >
            Profile image
          </button>
        </div>

        <dl className="grid grid-cols-3 gap-x-4 gap-y-5 text-sm">
          <InfoField label="User ID" value={`m${user.id}`} />
          <InfoField
            label="Phone"
            value={user.phone ?? '—'}
            badge={
              user.phone
                ? user.phoneVerified
                  ? { label: 'Verified', tone: 'success' }
                  : { label: 'Verification required', tone: 'danger' }
                : undefined
            }
          />
          <InfoField
            label="Email"
            value={user.email ?? '—'}
            badge={
              user.email
                ? user.emailVerified
                  ? { label: 'Verified', tone: 'success' }
                  : { label: 'Verification required', tone: 'danger' }
                : undefined
            }
          />

          <InfoField label="Nationality" value={formatCountry(user.nationality)} />

          {/* Suburb — interactive verify/unverify */}
          <SuburbField
            userId={user.id}
            suburb={user.suburb}
            suburbVerified={user.suburbVerified}
          />

          <InfoField
            label="Sign up"
            value={user.signUpAt ? formatDate(user.signUpAt) : formatDate(user.createdAt)}
          />
          <InfoField
            label="Sign in"
            value={user.signInAt ? formatDate(user.signInAt) : '—'}
          />
          <InfoField
            label="Last Active"
            value={user.lastActiveAt ? formatDate(user.lastActiveAt) : '—'}
          />

          <InfoField label="Items" value={String(user.postsCount)} />
          <InfoField
            label="Total Purchases"
            value={user.totalPurchases != null ? formatMoney(user.totalPurchases, 'AUD') : '—'}
          />
          <InfoField
            label="Total Sales"
            value={user.totalSales != null ? formatMoney(user.totalSales, 'AUD') : '—'}
          />
        </dl>
      </section>

      {/* ── Tabbed activity panel ───────────────────────────────────────── */}
      <section className="card-inner lg:col-span-8 p-6 flex flex-col">
        <DetailTabs
          active={tab}
          onChange={(k) => setTab(k as TabKey)}
          tabs={[
            { key: 'sold', label: 'Items sold', count: sold.total },
            { key: 'purchased', label: 'Items Purchased', count: purchased.total },
            { key: 'thread', label: 'Thread', count: threads.length },
            { key: 'chat', label: 'Chat', count: conversations.length },
            { key: 'reports', label: 'Reports', count: reports.length },
            { key: 'logs', label: 'Logs' },
          ]}
        />

        {showItemActions && (
          <div className="flex items-center gap-3 pt-5">
            <input
              className="pill-input max-w-sm"
              placeholder="Keywords"
            />
            <button className="btn btn-pill-dark px-6">search</button>

            <div className="ml-auto flex items-center gap-2">
              <button className="btn-icon">
                <Trash2 size={14} /> Delete
              </button>
              <button className="btn-icon">
                <Download size={14} /> Export CSV
              </button>
            </div>
          </div>
        )}

        <div className="pt-5 flex-1">
          {tab === 'sold' && <ItemsTable posts={sold.items} kind="sold" />}
          {tab === 'purchased' && <PurchasedTable purchases={purchased.items} />}
          {tab === 'thread' && <ThreadsTab threads={threads} />}
          {tab === 'chat' && <ConversationsTab conversations={conversations} />}
          {tab === 'reports' && <ReportsTab reports={reports} />}
          {tab === 'logs' && (
            <EmptyTab label="Logs are not available yet." />
          )}
        </div>

        {tab === 'sold' && (
          <Pagination page={1} totalPages={Math.max(1, Math.ceil(sold.total / sold.pageSize))} />
        )}
      </section>
    </div>
  );
}

// ── Subcomponents ──────────────────────────────────────────────────────

/**
 * Status dropdown — Activate / Suspend.
 * Ban is excluded (handled via penalty endpoint, separate PR).
 * Deleted / banned statuses are shown read-only.
 */
function StatusDropdown({ userId, value }: { userId: string; value: string }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const isReadOnly = value === 'banned' || value === 'deleted';

  const handleChange = async (newStatus: string) => {
    if (newStatus === value || isPending) return;
    if (!isMutableUserStatus(newStatus)) {
      alert('Invalid status');
      return;
    }
    setIsPending(true);
    try {
      await updateUserStatus(userId, newStatus);
      router.refresh();
    } catch (err) {
      alert(`Status update failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsPending(false);
    }
  };

  if (isReadOnly) {
    return (
      <div className="mt-1 inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-4 py-1.5 text-sm opacity-60 cursor-not-allowed capitalize">
        {value.replace('_', ' ')}
      </div>
    );
  }

  return (
    <div className="mt-1 relative inline-flex items-center">
      <select
        className="inline-flex items-center rounded-full border border-ink-200 bg-white pl-4 pr-8 py-1.5 text-sm appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        value={value}
        disabled={isPending}
        onChange={(e) => handleChange(e.target.value)}
      >
        <option value="active">Activate user</option>
        <option value="suspended">Suspend</option>
        {value === 'pending_profile' && (
          <option value="pending_profile">Pending profile</option>
        )}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-500"
      />
      {isPending && (
        <span className="ml-2 text-[11px] text-ink-500">Saving…</span>
      )}
    </div>
  );
}

/**
 * Suburb field with inline Verify / Unverify button.
 */
function SuburbField({
  userId,
  suburb,
  suburbVerified,
}: {
  userId: string;
  suburb?: string | null;
  suburbVerified?: boolean | null;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleVerify = async (verified: boolean) => {
    if (isPending) return;
    setIsPending(true);
    try {
      await updateSuburbVerification(userId, verified);
      router.refresh();
    } catch (err) {
      alert(`Verification update failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="col-span-2">
      <dt className="text-xs text-ink-500 mb-1">Suburb</dt>
      <dd className="text-sm text-ink-900 break-words">{suburb ?? '—'}</dd>
      {suburb && (
        <div className="mt-1 flex items-center gap-2 flex-wrap">
          <span
            className={
              'inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium ' +
              (suburbVerified
                ? 'bg-green-50 text-success'
                : 'bg-pink-50 text-danger')
            }
          >
            {suburbVerified ? 'Verified' : 'Verification required'}
          </span>
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleVerify(!suburbVerified)}
            className="text-[11px] font-medium text-brand-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Saving…' : suburbVerified ? 'Unverify' : 'Verify'}
          </button>
        </div>
      )}
    </div>
  );
}

function InfoField({
  label,
  value,
  badge,
  spanCols = 1,
}: {
  label: string;
  value: string;
  badge?: { label: string; tone: 'success' | 'danger' };
  spanCols?: 1 | 2 | 3;
}) {
  const span = spanCols === 1 ? 'col-span-1' : spanCols === 2 ? 'col-span-2' : 'col-span-3';
  return (
    <div className={span}>
      <dt className="text-xs text-ink-500 mb-1">{label}</dt>
      <dd className="text-sm text-ink-900 break-words">{value}</dd>
      {badge && (
        <span
          className={
            'mt-1 inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium ' +
            (badge.tone === 'success'
              ? 'bg-green-50 text-success'
              : 'bg-pink-50 text-danger')
          }
        >
          {badge.label}
        </span>
      )}
    </div>
  );
}

function ItemsTable({ posts, kind }: { posts: AdminPost[]; kind: 'sold' | 'purchased' }) {
  const router = useRouter();
  return (
    <div>
      <table className="data-table">
        <thead>
          <tr>
            <th className="w-10"></th>
            <th>Date</th>
            <th>Status</th>
            <th>User ID</th>
            <th>Item number</th>
            <th>Item title</th>
            <th>Category</th>
            <th className="text-right">Price</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((p) => (
            <tr
              key={p.id}
              className="cursor-pointer"
              onClick={() => router.push(`/listings/${p.id}`)}
            >
              <td onClick={(e) => e.stopPropagation()}>
                <input type="checkbox" className="h-4 w-4 rounded border-ink-300" />
              </td>
              <td className="text-ink-700">
                <div>{formatDate(p.createdAt)}</div>
                <div className="text-xs text-ink-500">
                  {new Date(p.createdAt).toLocaleTimeString('en-AU', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </div>
              </td>
              <td>
                <StatusBadge status={kind === 'sold' ? 'complete' : 'in progress'} />
              </td>
              <td className="text-ink-700">m{p.seller.id}</td>
              <td className="text-ink-700">i{p.id}</td>
              <td className="text-ink-900 font-medium">{p.title}</td>
              <td className="text-ink-700">{p.category}</td>
              <td className="text-right">{formatMoney(p.price, p.currency)}</td>
            </tr>
          ))}
          {posts.length === 0 && (
            <tr>
              <td colSpan={8} className="text-center text-ink-500 py-10">
                No items yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function PurchasedTable({ purchases }: { purchases: AdminUserPurchase[] }) {
  return (
    <div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Status</th>
            <th>Seller</th>
            <th>Item number</th>
            <th>Item title</th>
            <th>Category</th>
            <th className="text-right">Price</th>
          </tr>
        </thead>
        <tbody>
          {purchases.map((t) => {
            const displayDate = t.date || t.createdAt;
            return (
              <tr key={t.id}>
                <td className="text-ink-700">
                  <div>{formatDate(displayDate)}</div>
                  <div className="text-xs text-ink-500">
                    {new Date(displayDate).toLocaleTimeString('en-AU', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </div>
                </td>
                <td>
                  <StatusBadge status={t.status} />
                </td>
                <td className="text-ink-700">{t.seller}</td>
                <td className="text-ink-700">i{t.postId}</td>
                <td className="text-ink-900 font-medium">{t.postTitle}</td>
                <td className="text-ink-700">{t.category ?? '—'}</td>
                <td className="text-right">{formatMoney(t.amount, t.currency)}</td>
              </tr>
            );
          })}
          {purchases.length === 0 && (
            <tr>
              <td colSpan={7} className="text-center text-ink-500 py-10">
                No purchases yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ReportsTab({ reports }: { reports: AdminReport[] }) {
  const router = useRouter();

  if (reports.length === 0) {
    return <EmptyListState label="No reports." />;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-ink-200">
      <table className="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Report ID</th>
            <th>Type</th>
            <th>Target</th>
            <th>Reporter</th>
            <th>Reason</th>
            <th className="text-right pr-6">Status</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((r) => (
            <tr
              key={r.id}
              className="cursor-pointer"
              onClick={() => router.push(`/trust-safety/${r.id}`)}
            >
              <td className="text-ink-700">{formatDate(r.createdAt)}</td>
              <td className="text-ink-700">{r.id}</td>
              <td>
                <span
                  className={
                    'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ' +
                    (r.targetType === 'post'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-purple-50 text-purple-700')
                  }
                >
                  {r.targetType === 'post' ? 'Post' : 'User'}
                </span>
              </td>
              <td className="text-ink-900 font-medium">{r.targetTitle ?? r.targetId}</td>
              <td className="text-ink-700">{r.reporterName}</td>
              <td className="text-ink-700">{r.reason}</td>
              <td className="text-right pr-6">
                <StatusBadge status={r.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ThreadsTab({ threads }: { threads: AdminUserThread[] }) {
  if (threads.length === 0) {
    return (
      <EmptyListState
        label="No joined threads"
        description="This user has not joined any tracked community threads."
      />
    );
  }

  return (
    <div className="space-y-4">
      <ActivityTabHeader
        label="Joined threads"
        count={threads.length}
        description="Thread membership, activity recency, and admin drill-down."
      />

      <div className="overflow-hidden rounded-xl border border-ink-200 bg-white">
        {threads.map((thread) => (
          <Link
            key={thread.id}
            href={`/threads/${thread.id}`}
            className="group block border-b border-ink-100 px-5 py-4 transition-colors last:border-b-0 hover:bg-ink-50"
          >
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-ink-900">{thread.name}</p>
                  <ThreadTypeBadge type={thread.type} />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-500">
                  <InlineMeta icon={Hash} label={`Thread ID ${thread.id}`} />
                  <InlineMeta icon={Users} label={`${formatNumber(thread.memberCount)} members`} />
                </div>
              </div>

              <div className="grid shrink-0 grid-cols-1 gap-3 text-sm sm:grid-cols-2 xl:min-w-[340px]">
                <MetaBlock
                  icon={Clock3}
                  label="Last active"
                  value={thread.lastActiveAt ? formatDate(thread.lastActiveAt) : '—'}
                />
                <MetaBlock
                  icon={CalendarDays}
                  label="Created"
                  value={formatDate(thread.createdAt)}
                />
              </div>

              <div className="flex items-center gap-1 text-xs font-semibold text-brand-600 xl:w-20 xl:justify-end">
                Open
                <ArrowUpRight
                  size={14}
                  className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ConversationsTab({ conversations }: { conversations: AdminUserConversation[] }) {
  if (conversations.length === 0) {
    return (
      <EmptyListState
        label="No conversations"
        description="No active conversation records are available for this user."
      />
    );
  }

  return (
    <div className="space-y-4">
      <ActivityTabHeader
        label="Conversation context"
        count={conversations.length}
        description="Partner, latest message, recency, and related listing context."
      />

      <div className="overflow-hidden rounded-xl border border-ink-200 bg-white">
        {conversations.map((conversation) => (
          <article key={conversation.id} className="border-b border-ink-100 px-5 py-4 last:border-b-0">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-3">
                  <PartnerAvatar partner={conversation.partner} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-ink-900">
                        {conversation.partner.displayName || `m${conversation.partner.id}`}
                      </p>
                      <span className="rounded-md bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-700">
                        Partner
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-500">
                      <InlineMeta icon={Hash} label={`Conversation ID ${conversation.id}`} />
                      <InlineMeta icon={Hash} label={`Partner ID ${conversation.partner.id}`} />
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-ink-100 bg-ink-50/70 px-4 py-3">
                  <div className="mb-2 flex items-center gap-2 text-xs font-medium text-ink-500">
                    <MessageSquareText size={14} />
                    Last message
                  </div>
                  <p className="whitespace-pre-wrap break-words text-sm leading-6 text-ink-800">
                    {conversation.lastMessageSnippet || 'No messages yet.'}
                  </p>
                </div>
              </div>

              <div className="grid shrink-0 grid-cols-1 gap-3 text-sm sm:grid-cols-2 xl:w-[360px]">
                <MetaBlock
                  icon={Clock3}
                  label="Last message"
                  value={conversation.lastMessageAt ? formatDateTime(conversation.lastMessageAt) : '—'}
                />
                <RelatedPostBlock post={conversation.post} />
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function ActivityTabHeader({
  label,
  count,
  description,
}: {
  label: string;
  count: number;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-ink-100 bg-ink-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-ink-900">{label}</p>
        <p className="mt-1 text-xs text-ink-500">{description}</p>
      </div>
      <span className="inline-flex w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink-700 ring-1 ring-ink-100">
        {formatNumber(count)} records
      </span>
    </div>
  );
}

function ThreadTypeBadge({ type }: { type: AdminUserThread['type'] }) {
  return (
    <span
      className={
        'rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ' +
        (type === 'suburb'
          ? 'bg-blue-50 text-blue-700'
          : 'bg-amber-50 text-warning')
      }
    >
      {type}
    </span>
  );
}

function InlineMeta({
  icon: Icon,
  label,
}: {
  icon: typeof Hash;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon size={13} strokeWidth={1.8} />
      {label}
    </span>
  );
}

function MetaBlock({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-ink-50 px-3 py-2">
      <div className="flex items-center gap-2 text-xs font-medium text-ink-500">
        <Icon size={14} strokeWidth={1.8} />
        {label}
      </div>
      <p className="mt-1 break-words text-sm font-semibold text-ink-900">{value}</p>
    </div>
  );
}

function PartnerAvatar({ partner }: { partner: AdminUserConversation['partner'] }) {
  if (isImageSrc(partner.avatarUrl)) {
    return (
      <Image
        src={partner.avatarUrl}
        alt=""
        width={40}
        height={40}
        className="h-10 w-10 shrink-0 rounded-full object-cover"
      />
    );
  }

  const initial = (partner.displayName || partner.id).slice(0, 1).toUpperCase();

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-100 text-sm font-bold text-ink-700">
      {initial}
    </div>
  );
}

function RelatedPostBlock({ post }: { post?: AdminUserConversation['post'] | null }) {
  if (!post) {
    return <MetaBlock icon={Package} label="Related post" value="—" />;
  }

  return (
    <div className="rounded-xl bg-ink-50 px-3 py-2">
      <div className="flex items-center gap-2 text-xs font-medium text-ink-500">
        <Package size={14} strokeWidth={1.8} />
        Related post
      </div>
      <p className="mt-1 line-clamp-2 text-sm font-semibold text-ink-900">{post.title}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-ink-500">
        <span>Post ID {post.id}</span>
        <span className="rounded-md bg-white px-2 py-0.5 font-medium capitalize text-ink-700 ring-1 ring-ink-100">
          {post.status}
        </span>
      </div>
    </div>
  );
}

function EmptyListState({ label, description }: { label: string; description?: string }) {
  return (
    <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-ink-200 px-6 text-center text-sm">
      <MoreVertical size={20} className="mb-2 text-ink-400" />
      <p className="font-semibold text-ink-700">{label}</p>
      {description && <p className="mt-1 max-w-sm text-ink-500">{description}</p>}
    </div>
  );
}

function EmptyTab({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-ink-500 text-sm">
      <MoreVertical size={20} className="mb-2 opacity-40" />
      {label} is not wired up yet.
    </div>
  );
}
