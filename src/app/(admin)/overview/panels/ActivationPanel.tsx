import { Sparkline, TimeSeriesChart } from '@/components/charts';
import { Card, StatCard } from '@/components/ui';
import { formatNumber, formatPercent } from '@/lib/format';
import { fillDailySeries, safeRate } from '@/lib/metrics';
import { periodLabel, type PeriodRange } from '@/lib/period';
import type { ActivityOverview, ActivityOverviewPoint } from '@/lib/types';
import { SectionError, StatGrid, StripLabel, columnOf, pctDelta } from '../parts';

/**
 * Sign-up through to verification. Only sign-ups are a period flow; the
 * verified counts are running totals, so they carry a live tick instead of a
 * delta that would compare a stock against a flow.
 */
export function ActivationPanel({
  data,
  period,
}: {
  data: ActivityOverview | null;
  period: PeriodRange;
}) {
  if (!data) return <SectionError label="Activation overview" />;

  const totals = data.totals;
  const prev = data.previousTotals;
  const days = fillDailySeries<ActivityOverviewPoint>(
    data.activityByDay,
    period.from,
    period.to,
  );
  const returningShare = safeRate(totals.weeklyReturningVerifiedUsers, totals.verifiedUsers);

  return (
    <>
      <StatGrid cols={3}>
        <StatCard
          label="Sign-ups"
          value={formatNumber(totals.signUpCount)}
          delta={prev ? pctDelta(totals.signUpCount, prev.signUpCount) : undefined}
          footer={<Sparkline data={columnOf(days, 'signUps')} />}
        />
        <StatCard
          label="Verified users"
          value={formatNumber(totals.verifiedUsers)}
          isSnapshot
          hint="Running total"
        />
        <StatCard
          label="Weekly returning"
          value={formatNumber(totals.weeklyReturningVerifiedUsers)}
          isSnapshot
          hint={`${formatPercent(returningShare)} of verified users`}
        />
      </StatGrid>

      <div className="space-y-3">
        <StripLabel>Verification channel</StripLabel>
        <StatGrid cols={2}>
          <StatCard
            label="Email verified"
            value={formatNumber(totals.emailVerifiedCount)}
            isSnapshot
          />
          <StatCard
            label="Phone verified"
            value={formatNumber(totals.phoneVerifiedCount)}
            isSnapshot
          />
        </StatGrid>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="Sign-ups" subtitle={periodLabel(period)}>
          <TimeSeriesChart
            data={days}
            series={[{ key: 'signUps', label: 'Sign-ups' }]}
            kind="area"
          />
        </Card>
        <Card title="Verified users, cumulative" subtitle={periodLabel(period)}>
          <TimeSeriesChart
            data={days}
            series={[{ key: 'verifiedUsers', label: 'Verified users' }]}
            kind="area"
          />
        </Card>
      </div>
    </>
  );
}
