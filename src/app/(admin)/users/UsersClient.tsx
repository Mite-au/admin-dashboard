'use client';

import { useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SearchCard, SearchField } from '@/components/SearchCard';
import { Pagination } from '@/components/Pagination';
import { StatusBadge } from '@/components/StatusBadge';
import type { UserFilters } from '@/lib/fetchers';
import type { AdminUser, Paged } from '@/lib/types';

export function UsersClient({
  data,
  filters,
}: {
  data: Paged<AdminUser>;
  filters: UserFilters;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const [name, setName] = useState(filters.name ?? '');
  const [email, setEmail] = useState(filters.email ?? '');
  const [phone, setPhone] = useState(filters.phone ?? '');
  const [memberId, setMemberId] = useState(filters.memberId ?? '');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const pushFilters = (next: Partial<UserFilters>) => {
    const merged: Record<string, string> = {};
    const final = {
      name,
      email,
      phone,
      memberId,
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

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="px-8 pb-8 space-y-6">
      <form onSubmit={onSearch}>
        <SearchCard title="User Search" total={data.total} label="users">
          <SearchField label="Name">
            <input
              className="pill-input"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </SearchField>
          <SearchField label="Email">
            <input
              className="pill-input"
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
        </SearchCard>
      </form>

      <div>
        <table className="data-table">
          <thead>
            <tr>
              <th className="w-10"></th>
              <th>User Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>User ID</th>
              <th>Nationality</th>
              <th className="text-right pr-6">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((u) => (
              <tr
                key={u.id}
                className="cursor-pointer"
                onClick={() => router.push(`/users/${u.id}`)}
              >
                <td onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-ink-300 text-ink-800 focus:ring-0"
                    checked={selected.has(u.id)}
                    onChange={() => toggle(u.id)}
                  />
                </td>
                <td className="font-medium">{u.name}</td>
                <td className="text-ink-700">{u.email ?? '—'}</td>
                <td className="text-ink-700">{u.phone ?? '—'}</td>
                <td className="text-ink-700">m{u.id}</td>
                <td className="text-ink-700">{u.nationality ?? '—'}</td>
                <td className="text-right pr-6">
                  <StatusBadge status={u.status} />
                </td>
              </tr>
            ))}
            {data.items.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-ink-500 py-10">
                  No users match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={data.page}
        totalPages={Math.max(1, Math.ceil(data.total / data.pageSize))}
        onChange={(p) => pushFilters({ page: p })}
      />
    </div>
  );
}
