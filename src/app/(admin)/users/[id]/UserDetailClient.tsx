'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Download, RotateCcw, Trash2, MoreVertical } from 'lucide-react';
import { DetailTabs } from '@/components/DetailTabs';
import { StatusBadge } from '@/components/StatusBadge';
import { Pagination } from '@/components/Pagination';
import { formatCountry, formatDate, formatMoney, isImageSrc } from '@/lib/format';
import { updateUserStatus, updateSuburbVerification } from '@/lib/actions';
import type { AdminPost, AdminUser, Paged } from '@/lib/types';

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
}: {
  user: AdminUser;
  sold: Paged<AdminPost>;
}) {
  const [tab, setTab] = useState<TabKey>('sold');

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
            { key: 'purchased', label: 'Items Purchased' },
            { key: 'thread', label: 'Thread' },
            { key: 'chat', label: 'Chat' },
            { key: 'reports', label: 'Reports' },
            { key: 'logs', label: 'Logs' },
          ]}
        />

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

        <div className="pt-5 flex-1">
          {tab === 'sold' && <ItemsTable posts={sold.items} kind="sold" />}
          {tab === 'purchased' && (
            <EmptyTab label="Items purchased — waiting on `transactions` table (see BACKEND_GAPS.md §3)" />
          )}
          {tab === 'thread' && (
            <EmptyTab label="Thread activity — waiting on `GET /admin/users/:id/threads`" />
          )}
          {tab === 'chat' && (
            <EmptyTab label="Chat history — waiting on `GET /admin/users/:id/conversations`" />
          )}
          {tab === 'reports' && (
            <EmptyTab label="Reports — waiting on Trust & Safety backend work" />
          )}
          {tab === 'logs' && (
            <EmptyTab label="Logs — waiting on `audit_events` table" />
          )}
        </div>

        <Pagination page={1} totalPages={Math.max(1, Math.ceil(sold.total / sold.pageSize))} />
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

function EmptyTab({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-ink-500 text-sm">
      <MoreVertical size={20} className="mb-2 opacity-40" />
      {label} is not wired up yet.
    </div>
  );
}
