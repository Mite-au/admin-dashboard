import { LogIn, Sun, CalendarDays, CalendarRange } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Topbar } from '@/components/Topbar';
import { getUserLogins } from '@/lib/fetchers';
import { formatDateTime, formatNumber } from '@/lib/format';
import { UserLoginsChart } from './UserLoginsChart';

export default async function UserLoginsPage() {
  const data = await getUserLogins(100);

  const methodTotal =
    data.methodBreakdown.email +
    data.methodBreakdown.phone +
    data.methodBreakdown.google +
    data.methodBreakdown.unknown;

  return (
    <>
      <Topbar breadcrumbs={[{ label: 'User Logins', href: '/user-logins' }]} />
      <PageHeader title="User Logins" />

      <div className="px-8 pb-10 space-y-8">
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="DAU"
            sub="Logins · last 24h"
            value={data.dau}
            Icon={Sun}
          />
          <StatCard
            label="WAU"
            sub="Distinct users · last 7d"
            value={data.wau}
            Icon={CalendarDays}
          />
          <StatCard
            label="MAU"
            sub="Distinct users · last 30d"
            value={data.mau}
            Icon={CalendarRange}
          />
          <StatCard
            label="Logins · last 30d"
            sub={`${formatNumber(data.loginsLast7d)} in last 7d`}
            value={data.loginsLast30d}
            Icon={LogIn}
          />
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-ink-900">Logins · last 30 days</h2>
          <div className="inner-card p-5">
            <UserLoginsChart data={data.daily} />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-ink-900">
            Method split · last 30 days
          </h2>
          <div className="inner-card p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <MethodCell label="Email" value={data.methodBreakdown.email} total={methodTotal} />
            <MethodCell label="Phone" value={data.methodBreakdown.phone} total={methodTotal} />
            <MethodCell label="Google" value={data.methodBreakdown.google} total={methodTotal} />
            <MethodCell label="Unknown" value={data.methodBreakdown.unknown} total={methodTotal} />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-ink-900">Recent logins</h2>
          <div className="inner-card overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>User</th>
                  <th>Method</th>
                  <th>Event</th>
                </tr>
              </thead>
              <tbody>
                {data.recentLogins.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-ink-500 py-8">
                      No user logins recorded yet.
                    </td>
                  </tr>
                ) : (
                  data.recentLogins.map((row, i) => (
                    <tr key={`${row.userId}-${row.createdAt}-${i}`}>
                      <td className="text-ink-700">{formatDateTime(row.createdAt)}</td>
                      <td className="font-medium">
                        {row.email ?? row.phone ?? `user #${row.userId}`}
                      </td>
                      <td className="text-ink-700 capitalize">{row.method}</td>
                      <td>
                        <span
                          className={
                            row.isSignUp
                              ? 'pill pill-success'
                              : 'pill bg-ink-50 text-ink-700'
                          }
                        >
                          {row.isSignUp ? 'Sign-up' : 'Sign-in'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}

function StatCard({
  label,
  sub,
  value,
  Icon,
}: {
  label: string;
  sub: string;
  value: number;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
}) {
  return (
    <div className="inner-card p-5 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-ink-500 font-semibold">{label}</p>
        <p className="mt-2 text-3xl font-extrabold text-ink-900">{formatNumber(value)}</p>
        <p className="mt-1 text-xs text-ink-500">{sub}</p>
      </div>
      <span className="rounded-xl bg-ink-50 p-2.5 text-ink-700 shrink-0">
        <Icon size={18} strokeWidth={1.75} />
      </span>
    </div>
  );
}

function MethodCell({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-ink-500 font-semibold">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-ink-900">{formatNumber(value)}</p>
      <p className="mt-0.5 text-xs text-ink-500 tabular-nums">{pct.toFixed(1)}%</p>
    </div>
  );
}
