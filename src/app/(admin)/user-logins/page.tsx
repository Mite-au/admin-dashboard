import { LogIn } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Topbar } from '@/components/Topbar';
import { DonutChart, Sparkline, TimeSeriesChart } from '@/components/charts';
import { Card, EmptyState, StatCard } from '@/components/ui';
import { getUserLogins } from '@/lib/fetchers';
import { formatDateTime, formatNumber, formatPercent, formatRelative } from '@/lib/format';
import { fillDailySeries, safeRate } from '@/lib/metrics';
import { addDays, periodLabel, todayDayKey } from '@/lib/period';
import type { DailyLoginPoint } from '@/lib/types';

/** The endpoint reports fixed trailing windows; 30 days is the longest. */
const WINDOW_DAYS = 30;

export default async function UserLoginsPage() {
  const data = await getUserLogins(100);

  const to = todayDayKey();
  const from = addDays(to, -(WINDOW_DAYS - 1));
  // The backend omits days nobody logged in. Left sparse, a line chart slopes
  // smoothly across those gaps and a quiet week reads as a slow one.
  const days = fillDailySeries<DailyLoginPoint>(data.daily, from, to);

  const breakdown = data.methodBreakdown;
  const methods = [
    { label: 'Email', value: breakdown.email },
    { label: 'Phone', value: breakdown.phone },
    { label: 'Google', value: breakdown.google },
    { label: 'Unknown', value: breakdown.unknown },
  ];

  const weeklyReach = safeRate(data.wau, data.mau);

  return (
    <>
      <Topbar breadcrumbs={[{ label: 'User Logins', href: '/user-logins' }]} />
      <PageHeader
        title="User Logins"
        description="Who is coming back, how often, and how they get in."
      />

      <div className="space-y-6 px-8 pb-10">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Daily active"
            value={formatNumber(data.dau)}
            isSnapshot
            hint="Last 24 hours"
            footer={<Sparkline data={days.map((day) => day.uniqueUsers)} />}
          />
          <StatCard
            label="Weekly active"
            value={formatNumber(data.wau)}
            isSnapshot
            // WAU over MAU is the stickiness ratio: what share of the month's
            // people showed up in the last seven days of it.
            hint={`${formatPercent(weeklyReach)} of monthly`}
          />
          <StatCard
            label="Monthly active"
            value={formatNumber(data.mau)}
            isSnapshot
            hint="Distinct users, 30 days"
          />
          <StatCard
            label="Logins"
            value={formatNumber(data.loginsLast30d)}
            hint={`${formatNumber(data.loginsLast7d)} in the last 7 days`}
            footer={<Sparkline data={days.map((day) => day.logins)} />}
          />
        </div>

        <Card
          title="Logins and the people behind them"
          subtitle={periodLabel({ from, to })}
        >
          {/* Two series on one axis: the gap between them is repeat sessions
              per user, which neither line carries on its own. */}
          <TimeSeriesChart
            data={days}
            series={[
              { key: 'logins', label: 'Logins' },
              { key: 'uniqueUsers', label: 'Unique users' },
            ]}
            kind="line"
            height={320}
          />
        </Card>

        <Card title="How people sign in" subtitle={periodLabel({ from, to })}>
          <DonutChart data={methods} valueKind="number" centerLabel="logins" />
        </Card>

        <Card
          title="Recent logins"
          subtitle="Most recent 100 sessions"
          bleed={data.recentLogins.length > 0}
        >
          {data.recentLogins.length === 0 ? (
            <EmptyState
              icon={LogIn}
              title="No logins recorded yet"
              description="Sessions appear here as soon as anyone signs in."
            />
          ) : (
            <div className="overflow-x-auto scroll-slim">
              <table className="data-table">
                <thead>
                  {/* User leads: `.data-table` gives its first column the ink
                      weight, and the row's identity is the person, not the clock. */}
                  <tr>
                    <th>User</th>
                    <th>When</th>
                    <th>Method</th>
                    <th>Event</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentLogins.map((row, i) => (
                    <tr key={`${row.userId}-${row.createdAt}-${i}`}>
                      <td>{row.email ?? row.phone ?? `user #${row.userId}`}</td>
                      {/* Relative for scanning; the exact stamp on hover. */}
                      <td title={formatDateTime(row.createdAt)}>
                        {formatRelative(row.createdAt)}
                      </td>
                      <td className="capitalize text-ink-700">{row.method}</td>
                      <td>
                        <span
                          className={
                            row.isSignUp
                              ? 'pill-status pill-success'
                              : 'pill-status pill-neutral'
                          }
                        >
                          {row.isSignUp ? 'Sign-up' : 'Sign-in'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
