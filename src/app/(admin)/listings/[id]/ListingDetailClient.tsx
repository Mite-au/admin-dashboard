'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Download, Trash2, MoreVertical } from 'lucide-react';
import { DetailTabs } from '@/components/DetailTabs';
import { StatusBadge } from '@/components/StatusBadge';
import { Pagination } from '@/components/Pagination';
import { formatDate, formatMoney } from '@/lib/format';
import type { AdminPost } from '@/lib/types';

type TabKey = 'sold' | 'purchased' | 'thread' | 'chat' | 'reports' | 'logs';

export function ListingDetailClient({ post }: { post: AdminPost }) {
  const [tab, setTab] = useState<TabKey>('purchased');

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
              {src && (
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
          <div className="flex items-baseline gap-3 mt-1">
            <div className="text-xl font-bold">{formatMoney(post.price, post.currency)}</div>
            <StatusBadge status={post.status} />
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-ink-500">Category</dt>
            <dd>{post.category}</dd>
            <dt className="text-ink-500">Condition</dt>
            <dd className="capitalize">{post.condition.replace('-', ' ')}</dd>
            <dt className="text-ink-500">Seller</dt>
            <dd>
              <Link href={`/users/${post.seller.id}`} className="hover:underline">
                {post.seller.name}
              </Link>
            </dd>
            <dt className="text-ink-500">Created</dt>
            <dd>{formatDate(post.createdAt)}</dd>
          </dl>
        </div>
      </section>

      {/* ── Tabbed activity panel ───────────────────────────────────────── */}
      <section className="card-inner lg:col-span-7 p-6 flex flex-col">
        <DetailTabs
          active={tab}
          onChange={(k) => setTab(k as TabKey)}
          tabs={[
            { key: 'sold', label: 'Items sold' },
            { key: 'purchased', label: 'Items Purchased' },
            { key: 'thread', label: 'Thread' },
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

        <Pagination page={1} totalPages={10} />
      </section>
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
