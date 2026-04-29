'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Download, MoreVertical, Trash2 } from 'lucide-react';
import { DetailTabs } from '@/components/DetailTabs';
import { ListingActionsCard } from '@/components/ListingActionsCard';
import { Pagination } from '@/components/Pagination';
import { SellerCard } from '@/components/SellerCard';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate, formatMoney, isImageSrc } from '@/lib/format';
import type { AdminPost, AdminUser } from '@/lib/types';

type TabKey = 'transaction' | 'chat' | 'reports' | 'logs';

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
      {/* ── Photo gallery + metadata ────────────────────────────────────── */}
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
              <StatusBadge status={post.status} />
            </MetaField>
            <MetaField label="Item ID" value={`i${post.id}`} />
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

      {/* ── Actions + Seller column ─────────────────────────────────────── */}
      <div className="lg:col-span-3 flex flex-col gap-6">
        <ListingActionsCard post={post} />
        <SellerCard seller={seller} />
      </div>
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
