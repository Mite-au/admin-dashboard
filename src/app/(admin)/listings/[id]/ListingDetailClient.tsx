'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';
import { History, ImageOff } from 'lucide-react';
import { ListingActionsCard } from '@/components/ListingActionsCard';
import { SellerCard } from '@/components/SellerCard';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, EmptyState } from '@/components/ui';
import {
  formatDate,
  formatDateTime,
  formatMoney,
  formatNumber,
  formatRelative,
  isImageSrc,
} from '@/lib/format';
import type { AdminPost, AdminUser } from '@/lib/types';

export function ListingDetailClient({
  post,
  seller,
}: {
  post: AdminPost;
  seller: AdminUser | null;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 px-8 pb-8 lg:grid-cols-12 lg:items-start">
      <div className="space-y-6 lg:col-span-8">
        <Gallery photos={post.photos} title={post.title} />

        <Card title="Item details">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <p className="tnum text-display font-bold text-ink-900">
              {formatMoney(post.price, post.currency)}
            </p>
            <StatusBadge status={post.status} />
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
            <Fact label="Item ID" value={`i${post.id}`} numeric />
            <Fact label="Category" value={post.category || '—'} />
            <Fact label="Condition" value={formatCondition(post.condition)} capitalize />
            <Fact
              label="Listed"
              value={formatDate(post.createdAt)}
              hint={formatRelative(post.createdAt)}
              title={formatDateTime(post.createdAt)}
            />
            <div className="min-w-0">
              <dt className="label-micro">Seller</dt>
              <dd className="mt-1 truncate text-data text-ink-900">
                {post.seller?.id ? (
                  <Link
                    href={`/users/${post.seller.id}`}
                    className="rounded-sm hover:text-brand-600 hover:underline"
                  >
                    {post.seller.name || `m${post.seller.id}`}
                  </Link>
                ) : (
                  'Account unavailable'
                )}
              </dd>
            </div>
            <Fact label="Reports" value={formatNumber(post.reportsCount)} numeric />
          </dl>

          <div className="mt-5 border-t border-ink-100 pt-4">
            <p className="label-micro">Description</p>
            <p className="mt-1.5 whitespace-pre-wrap break-words text-data leading-relaxed text-ink-700">
              {post.description?.trim() || 'No description was written for this listing.'}
            </p>
          </div>
        </Card>

        <Card title="History">
          <EmptyState
            icon={History}
            title="No transaction or message history"
            description="Per-listing orders and chat aren't exposed by the admin API yet. Reports filed against items are on the Trust & safety page."
            action={
              <Link href="/trust-safety?targetType=post" className="btn btn-pill-ghost">
                View post reports
              </Link>
            }
          />
        </Card>
      </div>

      <div className="flex flex-col gap-6 lg:col-span-4">
        <ListingActionsCard post={post} />
        <SellerCard seller={seller} />
      </div>
    </div>
  );
}

function formatCondition(condition: string | null | undefined) {
  if (!condition) return '—';
  return condition.replace(/[_-]/g, ' ');
}

/**
 * Photo review: one large frame plus a thumbnail strip.
 *
 * `object-contain` on a sunken backdrop rather than `object-cover` — an admin
 * checking a listing needs the whole frame, including whatever is at the
 * edges of it.
 */
function Gallery({ photos, title }: { photos: string[] | undefined; title: string }) {
  const images = (photos ?? []).filter(isImageSrc);
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <Card bleed>
        <EmptyState
          icon={ImageOff}
          title="No photos on this listing"
          description="The seller published this item without usable images, or the uploads are still processing."
        />
      </Card>
    );
  }

  const current = images[Math.min(active, images.length - 1)];

  return (
    <Card bleed>
      <div className="relative aspect-[4/3] w-full bg-ink-50">
        <Image
          key={current}
          src={current}
          alt={title ? `${title} — photo ${active + 1}` : `Listing photo ${active + 1}`}
          fill
          sizes="(max-width: 1024px) 100vw, 60vw"
          className="object-contain"
          priority
        />
      </div>

      {images.length > 1 && (
        <div className="scroll-slim flex gap-2 overflow-x-auto border-t border-ink-100 p-3">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              aria-label={`Show photo ${i + 1} of ${images.length}`}
              aria-pressed={i === active}
              onClick={() => setActive(i)}
              className={clsx(
                'relative h-14 w-14 shrink-0 overflow-hidden rounded-control bg-ink-50 transition-shadow',
                i === active
                  ? 'ring-2 ring-ink-900'
                  : 'ring-1 ring-ink-200 hover:ring-ink-300',
              )}
            >
              <Image src={src} alt="" fill sizes="56px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}

function Fact({
  label,
  value,
  hint,
  title,
  numeric,
  capitalize,
}: {
  label: string;
  value: string;
  hint?: string;
  title?: string;
  numeric?: boolean;
  capitalize?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="label-micro">{label}</dt>
      <dd
        title={title}
        className={clsx(
          'mt-1 break-words text-data text-ink-900',
          numeric && 'tnum',
          capitalize && 'capitalize',
        )}
      >
        {value}
        {hint && <span className="ml-1.5 text-ink-500">({hint})</span>}
      </dd>
    </div>
  );
}
