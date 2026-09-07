'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { ChevronRight, SearchX } from 'lucide-react';
import { SearchCard, SearchField } from '@/components/SearchCard';
import { Pagination } from '@/components/Pagination';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, EmptyState } from '@/components/ui';
import { formatCountry, formatDateTime, formatRelative } from '@/lib/format';
import type { UserFilters } from '@/lib/fetchers';
import type { AdminUser, Paged } from '@/lib/types';

/**
 * What `AdminUsersService.listUsers` actually applies: `banned` is the
 * synthetic penalty flag, the rest are real `users_status` members. An empty
 * value sends no `status` at all, which is what the backend's own `all` means,
 * so there is no separate "all" option to add.
 *
 * `pending_deletion` is deliberately absent even though the API can *return*
 * it: the service's filter whitelist doesn't include it, so selecting it would
 * silently list every user instead of narrowing.
 */
const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'pending_profile', label: 'Pending profile' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'banned', label: 'Banned' },
  { value: 'deleted', label: 'Deleted' },
] as const;

export function UsersClient({
  data,
  filters,
}: {
  data: Paged<AdminUser>;
  filters: UserFilters;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(filters.name ?? '');
  const [email, setEmail] = useState(filters.email ?? '');
  const [phone, setPhone] = useState(filters.phone ?? '');
  const [memberId, setMemberId] = useState(filters.memberId ?? '');
  const [status, setStatus] = useState(filters.status ?? '');

  const hasFilters = Boolean(name || email || phone || memberId || status);

  const pushFilters = (next: Partial<UserFilters>) => {
    const merged: Record<string, string> = {};
    const final = {
      name,
      email,
      phone,
      memberId,
      status,
      page: filters.page,
      ...next,
    };
    for (const [k, v] of Object.entries(final)) {
      if (v === undefined || v === null || v === '') continue;
      merged[k] = String(v);
    }
    const qs = new URLSearchParams(merged).toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname));
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    pushFilters({ page: 1 });
  };

  const clearFilters = () => {
    setName('');
    setEmail('');
    setPhone('');
    setMemberId('');
    setStatus('');
    startTransition(() => router.replace(pathname));
  };

  // The row is a link, so a click anywhere in it navigates — except on the
  // controls inside it, which own their own click.
  const openRow = (e: React.MouseEvent<HTMLTableRowElement>, id: string) => {
    if ((e.target as HTMLElement).closest('a, button, input, select')) return;
    router.push(`/users/${id}`);
  };

  const totalPages = Math.max(1, Math.ceil(data.total / Math.max(1, data.pageSize)));

  return (
    <div className="space-y-6 px-8 pb-8">
      <form onSubmit={onSearch}>
        <SearchCard title="User search" total={data.total} label="users">
          <SearchField label="Name">
            <input
              className="pill-input"
              placeholder="Jane Kim"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </SearchField>
          <SearchField label="Email">
            <input
              className="pill-input"
              type="email"
              placeholder="mite@mite.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </SearchField>
          <SearchField label="Phone">
            <input
              className="pill-input"
              placeholder="0412737483"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </SearchField>
          <SearchField label="Member ID">
            <input
              className="pill-input"
              placeholder="m124324"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
            />
          </SearchField>
          <SearchField label="Status">
            <select
              className="pill-select"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                pushFilters({ status: e.target.value, page: 1 });
              }}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </SearchField>
        </SearchCard>
      </form>

      <Card bleed>
        {data.items.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title={hasFilters ? 'No users match these filters' : 'No users yet'}
            description={
              hasFilters
                ? 'Try a partial name or email, or widen the status filter.'
                : 'Accounts appear here as soon as the first one is created.'
            }
            action={
              hasFilters ? (
                <button type="button" onClick={clearFilters} className="btn btn-pill-ghost">
                  Clear filters
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div
              aria-busy={isPending}
              className={clsx(
                'scroll-slim overflow-x-auto transition-opacity duration-150',
                isPending && 'opacity-60',
              )}
            >
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Member ID</th>
                    <th>Nationality</th>
                    <th>Joined</th>
                    <th className="text-right">Status</th>
                    <th className="w-10" aria-label="Open" />
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((u) => {
                    const joined = u.signUpAt ?? u.createdAt;
                    return (
                      <tr
                        key={u.id}
                        onClick={(e) => openRow(e, u.id)}
                        className="group cursor-pointer"
                      >
                        <td>
                          <Link
                            href={`/users/${u.id}`}
                            className="rounded-sm group-hover:underline"
                          >
                            {u.name || 'Unnamed account'}
                          </Link>
                        </td>
                        <td>{u.email ?? '—'}</td>
                        <td className="tnum">{u.phone ?? '—'}</td>
                        <td className="tnum">m{u.id}</td>
                        <td>{formatCountry(u.nationality)}</td>
                        <td title={formatDateTime(joined)}>{formatRelative(joined)}</td>
                        <td className="text-right">
                          <StatusBadge status={u.status} />
                        </td>
                        <td className="w-10 text-right">
                          <ChevronRight
                            size={16}
                            strokeWidth={2}
                            aria-hidden="true"
                            className="inline-block text-ink-300 transition-colors group-hover:text-ink-600"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="border-t border-ink-100 px-5">
              <Pagination
                page={data.page}
                totalPages={totalPages}
                total={data.total}
                pageSize={data.pageSize}
                onChange={(p) => pushFilters({ page: p })}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
