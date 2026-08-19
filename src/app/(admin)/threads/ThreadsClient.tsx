'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { MessagesSquare, SearchX } from 'lucide-react';
import { SearchCard, SearchField } from '@/components/SearchCard';
import { Pagination } from '@/components/Pagination';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, EmptyState } from '@/components/ui';
import { formatDate, formatDateTime, formatNumber } from '@/lib/format';
import {
  formatThreadType,
  getThreadInterestKey,
  getThreadRegionCode,
  splitThreadName,
} from '@/lib/threadModel';
import type { AdminThreadListItem, Paged } from '@/lib/types';
import type { ThreadFilters } from '@/lib/fetchers';
import { CodeChip, ThreadModelChip } from './ThreadChips';

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

  const rows = data.items;
  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));
  const hasFilters = Boolean(
    filters.name ||
      filters.type ||
      filters.regionCode ||
      filters.interestKey ||
      filters.status ||
      filters.minMembers !== undefined ||
      filters.memberId,
  );

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

  const clearFilters = () => {
    setName('');
    setType('');
    setRegionCode('');
    setInterestKey('');
    setStatus('');
    setMinMembers('');
    setMemberId('');
    startTransition(() => router.replace(pathname));
  };

  return (
    <div className="space-y-6 px-8 pb-8">
      <form onSubmit={onSearch}>
        <SearchCard title="Thread Search" total={formatNumber(data.total)} label="threads">
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
              placeholder="User ID of a member"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
            />
          </SearchField>
        </SearchCard>
      </form>

      <Card bleed title="Threads">
        {rows.length === 0 ? (
          hasFilters ? (
            <EmptyState
              icon={SearchX}
              title="No matching threads"
              description="Nothing matches this combination of region, interest and status. Clearing the filters shows every thread."
              action={
                <button type="button" onClick={clearFilters} className="btn btn-pill-ghost">
                  Clear filters
                </button>
              }
            />
          ) : (
            <EmptyState
              icon={MessagesSquare}
              title="No threads yet"
              description="Threads appear once regions go live or a member request is approved in Thread Requests."
              action={
                <Link href="/thread-requests" className="btn btn-pill-ghost">
                  Open thread requests
                </Link>
              }
            />
          )
        ) : (
          <div className="scroll-slim overflow-x-auto">
            <table className="data-table">
              <caption className="sr-only">
                Community threads, page {data.page} of {totalPages}
              </caption>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Model</th>
                  <th>Raw type</th>
                  <th>Region</th>
                  <th>Interest</th>
                  <th className="text-right">Members</th>
                  <th className="text-right">Messages</th>
                  <th>Created</th>
                  <th className="pr-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => {
                  const { topicName, regionName } = splitThreadName(t.name);
                  const href = `/threads/${t.id}`;
                  return (
                    <tr
                      key={t.id}
                      className="cursor-pointer"
                      onClick={() => router.push(href)}
                    >
                      <td>
                        <Link
                          href={href}
                          onClick={(e) => e.stopPropagation()}
                          className="block max-w-[18rem] truncate font-medium text-ink-900 hover:text-brand-600 hover:underline"
                        >
                          {topicName || 'Untitled thread'}
                        </Link>
                        {regionName && (
                          <span className="mt-0.5 block max-w-[18rem] truncate text-2xs font-normal text-ink-500">
                            {regionName}
                          </span>
                        )}
                      </td>
                      <td>
                        <ThreadModelChip thread={t} />
                      </td>
                      <td>{formatThreadType(t.type)}</td>
                      <td>
                        <CodeChip value={getThreadRegionCode(t)} />
                      </td>
                      <td>
                        <CodeChip value={getThreadInterestKey(t)} />
                      </td>
                      <td className="text-right font-medium text-ink-900">
                        {formatNumber(t.memberCount)}
                      </td>
                      <td className="text-right">{formatNumber(t.messageCount)}</td>
                      <td>
                        <span title={formatDateTime(t.createdAt)}>{formatDate(t.createdAt)}</span>
                      </td>
                      <td className="pr-5 text-right">
                        <StatusBadge status={t.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Pagination
        page={data.page}
        totalPages={totalPages}
        total={data.total}
        pageSize={data.pageSize}
        onChange={(p) => pushFilters({ page: p })}
      />
    </div>
  );
}
