import { Topbar } from '@/components/Topbar';
import { PageHeader } from '@/components/PageHeader';
import { getOverview } from '@/lib/fetchers';
import { ActivityChart } from './ActivityChart';

export default async function OverviewPage() {
  const data = await getOverview();
  const { totals, activityByDay } = data;

  const cards = [
    { label: 'Total Users', value: totals.users.toLocaleString() },
    { label: 'Active Listings', value: totals.posts.toLocaleString() },
    { label: 'Total Sales', value: totals.sales.toLocaleString() },
    { label: 'Revenue', value: `$${totals.revenue.toLocaleString()} AUD` },
    { label: 'Open Reports', value: totals.reportsOpen.toLocaleString() },
  ];

  return (
    <>
      <Topbar breadcrumbs={[{ label: 'Overview', href: '/overview' }]} />
      <PageHeader title="Overview" />

      <div className="px-8 pb-8 space-y-8">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
          {cards.map(({ label, value }) => (
            <div
              key={label}
              className="rounded-2xl border border-ink-100 bg-white p-5 flex flex-col gap-1.5 shadow-sm"
            >
              <span className="text-xs font-medium text-ink-500 uppercase tracking-wide">
                {label}
              </span>
              <span className="text-2xl font-extrabold text-ink-900">{value}</span>
            </div>
          ))}
        </div>

        {/* Activity chart */}
        <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-ink-700 mb-4">
            14-Day Activity
          </h2>
          <ActivityChart data={activityByDay} />
        </div>
      </div>
    </>
  );
}
