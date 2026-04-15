import { Topbar } from '@/components/Topbar';
import { ActivityChart } from '@/components/ActivityChart';
import { StatCard } from '@/components/StatCard';
import { getOverview, getPosts } from '@/lib/fetchers';
import { formatMoney, formatNumber, formatDate } from '@/lib/format';
import { StatusBadge } from '@/components/StatusBadge';
import { Users, Package, ShoppingBag, Flag, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
  const [overview, recent] = await Promise.all([getOverview(), getPosts(1, 6)]);

  return (
    <>
      <Topbar title="Overview" />
      <main className="flex-1 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          <StatCard label="Total users" value={formatNumber(overview.totals.users)} icon={Users} delta="+3.2% this week" />
          <StatCard label="Active listings" value={formatNumber(overview.totals.posts)} icon={Package} delta="+1.1% this week" />
          <StatCard label="Sales" value={formatNumber(overview.totals.sales)} icon={ShoppingBag} delta="+5.8% this week" />
          <StatCard label="Revenue" value={formatMoney(overview.totals.revenue)} icon={TrendingUp} delta="+4.4% this week" />
          <StatCard label="Open reports" value={formatNumber(overview.totals.reportsOpen)} icon={Flag} />
        </div>

        <section className="card">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-base font-semibold">Post activity</h2>
              <p className="text-sm text-ink-500">Posts created vs sales completed (last 14 days)</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-ink-500">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand-500" /> Posts</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success" /> Sales</span>
            </div>
          </div>
          <ActivityChart data={overview.activityByDay} />
        </section>

        <section className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Recent listings</h2>
            <Link href="/listings" className="text-sm text-brand-700 hover:underline">View all →</Link>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Seller</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {recent.items.map((p) => (
                  <tr key={p.id}>
                    <td className="font-medium text-ink-900">
                      <Link href={`/listings/${p.id}`} className="hover:underline">{p.title}</Link>
                    </td>
                    <td>{p.seller.name}</td>
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
      </main>
    </>
  );
}
