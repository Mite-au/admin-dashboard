import { LogIn, TriangleAlert } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Topbar } from '@/components/Topbar';
import { DonutChart, Sparkline, TimeSeriesChart } from '@/components/charts';
import { Card, EmptyState, StatCard } from '@/components/ui';
import { getUserLogins, optional } from '@/lib/fetchers';
import {
  formatDateShort,
  formatDateTime,
  formatNumber,
  formatPercent,
  formatRelative,
} from '@/lib/format';
import { fillDailySeries, safeRate, sumBy } from '@/lib/metrics';
import { periodLabel } from '@/lib/period';
import type { DailyLoginPoint, UserLoginMethod, UserLoginsResponse } from '@/lib/types';

/** Most recent login events the endpoint will return (its own cap is 200). */
const RECENT_LIMIT = 100;

/**
 * Login activity, described in the endpoint's own units.
 *
 * Three things about `/admin/user-logins` decide the whole shape of this page:
 *
 *  1. `dau` is a COUNT OF LOGIN EVENTS in a rolling 24 hours, while `wau` and
 *     `mau` are DISTINCT USERS. Printing all three as "active users" invites a
 *     DAU/MAU ratio that divides events by people.
 *  2. The real daily-active figure is already in the payload — `daily[]`
 *     carries `uniqueUsers` per UTC day — so it is read from there instead.
 *  3. `daily[]` runs `date(now)−30 … date(now)−1`: today is excluded entirely
 *     and the FIRST bucket is the partial one, because the 30-day window
 *     starts at an instant mid-day rather than at midnight. So the last entry
 *     is yesterday UTC and is complete, and every average here drops the
 *     opening day rather than the closing one.
 */
export default async function UserLoginsPage() {
  const data = await optional(getUserLogins(RECENT_LIMIT));

  return (
    <>
      <Topbar breadcrumbs={[{ label: 'User Logins', href: '/user-logins' }]} />
      <PageHeader
        title="User Logins"
        description="Who is coming back, how often, and how they get in."
      />

      <div className="space-y-6 px-8 pb-10">
        {data === null ? <LoadError /> : <LoginsBody data={data} />}
      </div>
    </>
  );
}

function LoginsBody({ data }: { data: UserLoginsResponse }) {
  const source = data.daily;
  // The backend already zero-fills its 30 days, so this only repairs a hole if
  // one ever appears. Bounded by the series' OWN endpoints — bounding it by
  // today's LOCAL date would append a phantom day for most of an Australian
  // afternoon, when the local calendar is already a day ahead of UTC.
  const days =
    source.length > 0
      ? fillDailySeries<DailyLoginPoint>(source, source[0].date, source[source.length - 1].date)
      : [];

  const lastFullDay = days.length > 0 ? days[days.length - 1] : null;
  // Drop the opening bucket: it counts only the part of that UTC day that fell
  // inside the rolling 30-day window, so it drags any per-day average down.
  const fullDays = days.slice(1);

  const loginsPerActive = safeRate(
    sumBy(fullDays, (day) => day.logins),
    sumBy(fullDays, (day) => day.uniqueUsers),
  );
  const stickiness = safeRate(data.wau, data.mau);

  const breakdown = data.methodBreakdown;
  const methods = [
    { label: 'Email', value: breakdown.email },
    { label: 'Phone', value: breakdown.phone },
    { label: 'Google', value: breakdown.google },
    // The backend buckets only email/phone/google by name; Apple — a real
    // auth method — falls into the same "everything else" pile as a login
    // recorded without one. Calling that bucket "Unknown" hides a whole
    // sign-in route.
    { label: 'Other (incl. Apple)', value: breakdown.unknown },
  ];

  const seriesRange =
    fullDays.length > 0
      ? periodLabel({ from: fullDays[0].date, to: fullDays[fullDays.length - 1].date })
      : '—';

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Logins, last 24h"
          value={formatNumber(data.dau)}
          isSnapshot
          hint="Login events in the last 24 hours, not distinct people."
          footer={<Sparkline data={fullDays.map((day) => day.logins)} />}
        />
        <StatCard
          label="Active yesterday (UTC)"
          value={lastFullDay ? formatNumber(lastFullDay.uniqueUsers) : '—'}
          hint={
            lastFullDay
              ? `Distinct users who logged in on ${formatDateShort(lastFullDay.date)}, the last full UTC day.`
              : 'No daily series was returned for the last 30 days.'
          }
          footer={<Sparkline data={fullDays.map((day) => day.uniqueUsers)} />}
        />
        <StatCard
          label="Weekly active"
          value={formatNumber(data.wau)}
          isSnapshot
          hint="Distinct users with a login in the last 7 days, rolling."
        />
        <StatCard
          label="Monthly active"
          value={formatNumber(data.mau)}
          isSnapshot
          hint="Distinct users with a login in the last 30 days, rolling."
        />
      </div>

      <div className="space-y-4">
        <h3 className="label-micro">Derived from the same windows</h3>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <StatCard
            label="Stickiness"
            value={formatPercent(stickiness)}
            hint="Weekly active ÷ monthly active. How much of the month's audience came back this week."
          />
          <StatCard
            label="Logins per active user"
            value={loginsPerActive === null ? '—' : loginsPerActive.toFixed(1)}
            hint={`Login events ÷ daily active users, across the ${fullDays.length} full UTC days charted below.`}
          />
          <StatCard
            label="Logins, last 30 days"
            value={formatNumber(data.loginsLast30d)}
            hint={`Login events over a rolling 30 days; ${formatNumber(data.loginsLast7d)} of them in the last 7.`}
          />
        </div>
      </div>

      <Card title="Logins and the people behind them" subtitle={`${seriesRange} · UTC days`}>
        {/* Two series on one axis: the gap between them is repeat sessions
            per user, which neither line carries on its own. */}
        <TimeSeriesChart
          data={fullDays}
          series={[
            { key: 'logins', label: 'Logins' },
            { key: 'uniqueUsers', label: 'Unique users' },
          ]}
          kind="line"
          height={320}
        />
        <p className="mt-6 border-t border-ink-100 pt-4 text-data leading-relaxed text-ink-500">
          Days are bucketed in UTC, which for an Australian reader starts and ends
          mid-morning. The series stops at yesterday — today is not returned at all
          — and the first day is partial, because the 30-day window opens at the
          time of day you loaded this page rather than at midnight, so it is left
          out of the chart and the sparklines and flagged in the table below.
        </p>
      </Card>

      <Card
        title="Daily numbers"
        subtitle="The chart above, one row per UTC day"
        bleed={days.length > 0}
      >
        {days.length === 0 ? (
          <EmptyState
            icon={LogIn}
            title="No daily series returned"
            description="The endpoint sent no per-day breakdown for the last 30 days."
          />
        ) : (
          <div className="max-h-96 overflow-y-auto overflow-x-auto scroll-slim">
            <table className="data-table [&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-10">
              <thead>
                <tr>
                  <th>Day (UTC)</th>
                  <th>Logins</th>
                  <th>Unique users</th>
                  <th>Logins per user</th>
                </tr>
              </thead>
              <tbody>
                {days.map((day, i) => {
                  const perUser = safeRate(day.logins, day.uniqueUsers);
                  return (
                    <tr key={day.date}>
                      <td>
                        <span className="inline-flex items-center gap-2">
                          {formatDateShort(day.date)}
                          {i === 0 && <span className="pill-status pill-info">Partial</span>}
                        </span>
                      </td>
                      <td className="tnum">{formatNumber(day.logins)}</td>
                      <td className="tnum">{formatNumber(day.uniqueUsers)}</td>
                      <td className="tnum">{perUser === null ? '—' : perUser.toFixed(1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="How people sign in" subtitle="Login events by method, rolling 30 days">
        <DonutChart data={methods} valueKind="number" centerLabel="logins" />
        <p className="mt-6 border-t border-ink-100 pt-4 text-data leading-relaxed text-ink-500">
          The backend names only email, phone and Google. Apple sign-ins land in
          Other, alongside any login recorded without a method, so Other is not a
          single behaviour.
        </p>
      </Card>

      <Card
        title="Recent logins"
        subtitle={`The ${RECENT_LIMIT} newest login events, all time — not filtered to the windows above`}
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
                  <th>Type</th>
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
                    <td className="text-ink-700">{methodLabel(row.method)}</td>
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
    </>
  );
}

/** Same relabelling as the donut, so one row and one segment agree. */
function methodLabel(method: UserLoginMethod): string {
  switch (method) {
    case 'email':
      return 'Email';
    case 'phone':
      return 'Phone';
    case 'google':
      return 'Google';
    default:
      return 'Other';
  }
}

/**
 * The fetch failed. Stated where the cards would be rather than as an empty
 * state: nothing is missing from the data, the request is.
 */
function LoadError() {
  return (
    <div
      role="status"
      className="flex items-start gap-2.5 rounded-panel border border-danger-100 bg-danger-50 px-4 py-3"
    >
      <TriangleAlert
        aria-hidden="true"
        size={16}
        strokeWidth={2}
        className="mt-px shrink-0 text-danger-700"
      />
      <p className="text-data text-danger-700">
        <span className="font-semibold">Login activity</span> could not be loaded.
        Refresh to try again.
      </p>
    </div>
  );
}
