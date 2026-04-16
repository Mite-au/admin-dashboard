'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { SearchCard, SearchField } from '@/components/SearchCard';
import { Pagination } from '@/components/Pagination';
import { StatusBadge } from '@/components/StatusBadge';
import type { AdminUser, Paged } from '@/lib/types';

export function UsersClient({ data }: { data: Paged<AdminUser> }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [memberId, setMemberId] = useState('');
  const [page, setPage] = useState(data.page);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const rows = useMemo(() => {
    return data.items.filter((u) => {
      if (name && !u.name.toLowerCase().includes(name.toLowerCase())) return false;
      if (email && !(u.email ?? '').toLowerCase().includes(email.toLowerCase())) return false;
      if (phone && !(u.phone ?? '').includes(phone)) return false;
      if (memberId && !u.id.includes(memberId)) return false;
      return true;
    });
  }, [data.items, name, email, phone, memberId]);

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
            {rows.map((u) => (
              <tr key={u.id}>
                <td>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-ink-300 text-ink-800 focus:ring-0"
                    checked={selected.has(u.id)}
                    onChange={() => toggle(u.id)}
                  />
                </td>
                <td className="font-medium">
                  <Link href={`/users/${u.id}`} className="hover:underline">
                    {u.name}
                  </Link>
                </td>
                <td className="text-ink-700">{u.email ?? '—'}</td>
                <td className="text-ink-700">{u.phone ?? '—'}</td>
                <td className="text-ink-700">m{u.id}</td>
                <td className="text-ink-700">{u.nationality ?? '—'}</td>
                <td className="text-right pr-6">
                  <StatusBadge status={u.status} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
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
        page={page}
        totalPages={Math.max(1, Math.ceil(data.total / data.pageSize))}
        onChange={setPage}
      />
    </div>
  );
}
