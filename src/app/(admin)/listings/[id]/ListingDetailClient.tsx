'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Download, MoreVertical, Trash2 } from 'lucide-react';
import { DetailTabs } from '@/components/DetailTabs';
import { Pagination } from '@/components/Pagination';
import { SellerCard } from '@/components/SellerCard';
import { formatDate, formatMoney, isImageSrc } from '@/lib/format';
import { updatePostStatus } from '@/lib/actions';
import type { AdminPost, AdminUser, PostStatus } from '@/lib/types';

type TabKey = 'transaction' | 'chat' | 'reports' | 'logs';
const MUTABLE_POST_STATUSES = [
  'draft',
  'published',
  'sold',
  'paused',
  'archived',
  'deleted',
] as const satisfies readonly PostStatus[];
const MUTABLE_POST_STATUS_SET = new Set<string>(MUTABLE_POST_STATUSES);
const POST_STATUS_LABELS: Record<MutablePostStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  sold: 'Sold',
  paused: 'Paused',
  archived: 'Archived',
  deleted: 'Deleted',
};
type MutablePostStatus = (typeof MUTABLE_POST_STATUSES)[number];

function isMutablePostStatus(value: string): value is MutablePostStatus {
  return MUTABLE_POST_STATUS_SET.has(value);
}

export function ListingDetailClient({
  post,
  seller,
}: {
  post: AdminPost;
  seller: AdminUser;
}) {
  const [tab, setTab] = useState<TabKey>('transaction');

  return (
    <div className="px-8 pb-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* ── Photo gallery card ──────────────────────────────────────────── */}
      <section className="card-inner lg:col-span-5 p-6">
        <div className="grid grid-cols-3 gap-2">
          {(post.photos.length ? post.photos : Array(9).fill('')).slice(0, 9).map((src, i) => (
            <div
              key={i}
              className="relative aspect-square rounded-md overflow-hidden bg-ink-100"
            >
              {isImageSrc(src) && (
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 33vw, 16vw"
                  className="object-cover"
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-5">
          <h2 className="text-lg font-semibold">{post.title}</h2>
          <div className="mt-1 text-xl font-bold">{formatMoney(post.price, post.currency)}</div>

          <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <MetaField label="Category" value={post.category} />
            <MetaField label="Status">
              <PostStatusDropdown postId={post.id} value={post.status} />
            </MetaField>
            <MetaField label="Item ID" value={post.id} />
            <MetaField label="Created" value={formatDate(post.createdAt)} />
            <MetaField label="Condition">
              <span className="capitalize">{post.condition.replace('-', ' ')}</span>
            </MetaField>
            <MetaField label="Seller">
              <Link href={`/users/${post.seller.id}`} className="hover:underline">
                {post.seller.name}
              </Link>
            </MetaField>
          </dl>
        </div>
      </section>

      {/* ── Tabbed activity panel ───────────────────────────────────────── */}
      <section className="card-inner lg:col-span-4 p-6 flex flex-col">
        <DetailTabs
          active={tab}
          onChange={(k) => setTab(k as TabKey)}
          tabs={[
            { key: 'transaction', label: 'Transaction' },
            { key: 'chat', label: 'Chat' },
            { key: 'reports', label: 'Reports', count: post.reportsCount },
            { key: 'logs', label: 'Logs' },
          ]}
        />

        <div className="flex items-center gap-3 pt-5">
          <input className="pill-input max-w-sm" placeholder="Keywords" />
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
          <EmptyTab label="Activity" />
        </div>

        <Pagination page={1} totalPages={1} />
      </section>

      <SellerCard seller={seller} className="lg:col-span-3" />
    </div>
  );
}

function PostStatusDropdown({ postId, value }: { postId: string; value: PostStatus }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleChange = async (newStatus: string) => {
    if (newStatus === value || isPending) return;
    if (!isMutablePostStatus(newStatus)) {
      alert('Invalid status');
      return;
    }
    setIsPending(true);
    try {
      await updatePostStatus(postId, newStatus);
      router.refresh();
    } catch (err) {
      alert(`Status update failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <select
        className="inline-flex items-center rounded-full border border-ink-200 bg-white pl-4 pr-8 py-1.5 text-sm appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        value={value}
        disabled={isPending}
        onChange={(e) => handleChange(e.target.value)}
      >
        {MUTABLE_POST_STATUSES.map((status) => (
          <option key={status} value={status}>
            {POST_STATUS_LABELS[status]}
          </option>
        ))}
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

function MetaField({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-ink-500">{label}</dt>
      <dd className="mt-1 text-ink-900">{children ?? value}</dd>
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
