'use client';

import { useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SearchCard, SearchField } from '@/components/SearchCard';
import { Pagination } from '@/components/Pagination';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate, formatNumber } from '@/lib/format';
import {
  formatThreadType,
  getThreadInterestKey,
  getThreadModelLabel,
  getThreadRegionCode,
  splitThreadName,
} from '@/lib/threadModel';
import type { AdminThreadListItem, Paged } from '@/lib/types';
import type { ThreadFilters } from '@/lib/fetchers';

const THREAD_STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'flagged', label: 'Flagged' },
  { value: 'hidden', label: 'Hidden' },
  { value: 'archived', label: 'Archived' },
] as const;

export function ThreadsClient({
  data,
  filters,
}: {
  data: Paged<AdminThreadListItem>;
  filters: ThreadFilters;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const [name, setName] = useState(filters.name ?? '');
  const [type, setType] = useState(filters.type ?? '');
  const [regionCode, setRegionCode] = useState(filters.regionCode ?? '');
  const [interestKey, setInterestKey] = useState(filters.interestKey ?? '');
  const [status, setStatus] = useState(filters.status ?? '');
  const [minMembers, setMinMembers] = useState(
    filters.minMembers !== undefined ? String(filters.minMembers) : '',
  );
  const [memberId, setMemberId] = useState(filters.memberId ?? '');

  const pushFilters = (next: Partial<ThreadFilters>) => {
    const merged: Record<string, string> = {};
    const final: Record<string, string | number | undefined> = {
      name,
      type,
      regionCode,
      interestKey,
      status,
      minMembers: minMembers === '' ? undefined : Number(minMembers),
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

  const rows = data.items;

  return (
    <div className="px-8 pb-8 space-y-6">
      <form onSubmit={onSearch}>
        <SearchCard title="Thread Search" total={data.total} label="threads">
          <SearchField label="Name">
            <input
              className="pill-input"
              placeholder="Thread name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </SearchField>
          <SearchField label="Type">
            <select
              className="pill-select"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="">All types</option>
              <option value="suburb">Suburb / Regional General</option>
              <option value="interest">Interest / Regional Interest</option>
            </select>
          </SearchField>
          <SearchField label="Region code">
            <input
              className="pill-input"
              placeholder="eastern_suburbs"
              value={regionCode}
              onChange={(e) => setRegionCode(e.target.value)}
            />
          </SearchField>
          <SearchField label="Interest key">
            <input
              className="pill-input"
              placeholder="basketball"
              value={interestKey}
              onChange={(e) => setInterestKey(e.target.value)}
            />
          </SearchField>
          <SearchField label="Admin status">
            <select
              className="pill-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {THREAD_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </SearchField>
          <SearchField label="Min members">
            <input
              className="pill-input"
              placeholder="0"
              inputMode="numeric"
              value={minMembers}
              onChange={(e) => setMinMembers(e.target.value)}
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

      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th className="w-10"></th>
              <th>Name</th>
              <th>Model</th>
              <th>Raw type</th>
              <th>Region</th>
              <th>Interest</th>
              <th className="text-right">Members</th>
              <th className="text-right">Messages</th>
              <th>Created</th>
              <th className="text-right pr-6">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr
                key={t.id}
                className="cursor-pointer"
                onClick={() => router.push(`/threads/${t.id}`)}
              >
                <td onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" className="h-4 w-4 rounded border-ink-300" />
                </td>
                <td className="font-medium">
                  {(() => {
                    const { topicName, regionName } = splitThreadName(t.name);
                    return (
                      <div className="flex flex-col">
                        <span>{topicName}</span>
                        {regionName && (
                          <span className="text-xs font-normal text-ink-500">
                            {regionName}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </td>
                <td>
                  <ThreadModelBadge thread={t} />
                </td>
                <td className="text-ink-700">{formatThreadType(t.type)}</td>
                <td className="text-ink-700">{getThreadRegionCode(t) ?? '—'}</td>
                <td className="text-ink-700">{getThreadInterestKey(t) ?? '—'}</td>
                <td className="text-right">{formatNumber(t.memberCount)}</td>
                <td className="text-right">{formatNumber(t.messageCount)}</td>
                <td className="text-ink-700">{formatDate(t.createdAt)}</td>
                <td className="text-right pr-6">
                  <StatusBadge status={t.status} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center text-ink-500 py-10">
                  No threads match your filters.
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

function ThreadModelBadge({ thread }: { thread: AdminThreadListItem }) {
  const label = getThreadModelLabel(thread);
  const tone =
    label === 'Regional General'
      ? 'bg-blue-50 text-blue-700'
      : label === 'Regional Interest'
        ? 'bg-green-50 text-success'
        : 'bg-ink-100 text-ink-700';

  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tone}`}>
      {label}
    </span>
  );
}
