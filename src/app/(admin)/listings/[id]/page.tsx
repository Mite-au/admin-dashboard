import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Archive, Trash2 } from 'lucide-react';
import { Topbar } from '@/components/Topbar';
import { StatusBadge } from '@/components/StatusBadge';
import { getPost } from '@/lib/fetchers';
import { formatDateTime, formatMoney } from '@/lib/format';

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPost(id);

  return (
    <>
      <Topbar title="Listing detail" />
      <main className="flex-1 p-6">
        <Link href="/listings" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900 mb-4">
          <ArrowLeft size={14} /> Back to listings
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="card lg:col-span-2 space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {post.photos.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-ink-100">
                  <Image src={src} alt="" fill sizes="(max-width: 768px) 50vw, 33vw" className="object-cover" />
                </div>
              ))}
            </div>

            <div>
              <h2 className="text-xl font-semibold">{post.title}</h2>
              <div className="mt-1 text-2xl font-semibold text-brand-700">{formatMoney(post.price, post.currency)}</div>
              <div className="mt-2"><StatusBadge status={post.status} /></div>
            </div>

            <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <Row label="Category" value={post.category} />
              <Row label="Condition" value={post.condition.replace('-', ' ')} />
              <Row label="Created" value={formatDateTime(post.createdAt)} />
              <Row label="Reports" value={String(post.reportsCount)} />
            </dl>
          </section>

          <section className="card lg:col-span-1 space-y-4">
            <div>
              <h3 className="text-sm font-medium text-ink-500">Seller</h3>
              <Link href={`/users/${post.seller.id}`} className="block mt-1 text-base font-semibold hover:underline">
                {post.seller.name}
              </Link>
            </div>

            <div className="border-t border-ink-100 pt-4 space-y-2">
              <h3 className="text-sm font-medium">Moderation</h3>
              <button className="btn btn-ghost border border-ink-100 w-full justify-start"><Archive size={14} /> Archive listing</button>
              <button className="btn btn-danger w-full justify-start"><Trash2 size={14} /> Remove listing</button>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-500">{label}</dt>
      <dd className="font-medium capitalize">{value}</dd>
    </div>
  );
}
