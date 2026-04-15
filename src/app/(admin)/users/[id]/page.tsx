import Link from 'next/link';
import { ArrowLeft, Mail, Phone, Calendar, Shield, Ban } from 'lucide-react';
import { Topbar } from '@/components/Topbar';
import { StatusBadge } from '@/components/StatusBadge';
import { getUser, getUserPosts } from '@/lib/fetchers';
import { formatDate, formatDateTime, formatMoney } from '@/lib/format';

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, posts] = await Promise.all([getUser(id), getUserPosts(id)]);

  return (
    <>
      <Topbar title="User detail" />
      <main className="flex-1 p-6">
        <Link href="/users" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900 mb-4">
          <ArrowLeft size={14} /> Back to users
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="card lg:col-span-1 space-y-5">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xl font-semibold">
                {user.name.charAt(0)}
              </div>
              <div>
                <div className="text-lg font-semibold">{user.name}</div>
                <div className="mt-1"><StatusBadge status={user.status} /></div>
              </div>
            </div>

            <dl className="text-sm space-y-3">
              <div className="flex items-start gap-2">
                <Mail size={14} className="mt-0.5 text-ink-500" />
                <div>
                  <dt className="text-ink-500 text-xs">Email</dt>
                  <dd>{user.email}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone size={14} className="mt-0.5 text-ink-500" />
                <div>
                  <dt className="text-ink-500 text-xs">Phone</dt>
                  <dd>{user.phone ?? '—'}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar size={14} className="mt-0.5 text-ink-500" />
                <div>
                  <dt className="text-ink-500 text-xs">Registered</dt>
                  <dd>{formatDate(user.createdAt)}</dd>
                </div>
              </div>
              {user.lastActiveAt && (
                <div className="flex items-start gap-2">
                  <Shield size={14} className="mt-0.5 text-ink-500" />
                  <div>
                    <dt className="text-ink-500 text-xs">Last active</dt>
                    <dd>{formatDateTime(user.lastActiveAt)}</dd>
                  </div>
                </div>
              )}
            </dl>

            <div className="grid grid-cols-2 gap-3 border-t border-ink-100 pt-4">
              <Stat label="Posts" value={String(user.postsCount)} />
              <Stat label="Reports" value={String(user.reportsCount)} />
            </div>

            <div className="flex gap-2">
              <button className="btn btn-ghost border border-ink-100 flex-1">Suspend</button>
              <button className="btn btn-danger flex-1"><Ban size={14} /> Ban</button>
            </div>
          </section>

          <section className="card lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Listings by this user</h2>
              <span className="text-sm text-ink-500">{posts.total} total</span>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.items.map((p) => (
                    <tr key={p.id}>
                      <td className="font-medium text-ink-900">
                        <Link href={`/listings/${p.id}`} className="hover:underline">{p.title}</Link>
                      </td>
                      <td>{p.category}</td>
                      <td>{formatMoney(p.price, p.currency)}</td>
                      <td><StatusBadge status={p.status} /></td>
                      <td>{formatDate(p.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-ink-500">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
