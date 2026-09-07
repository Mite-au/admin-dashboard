import { Sparkline, TimeSeriesChart } from '@/components/charts';
import { Card, StatCard } from '@/components/ui';
import { formatNumber, formatPercent } from '@/lib/format';
import { fillDailySeries, safeRate } from '@/lib/metrics';
import { periodLabel, type PeriodRange } from '@/lib/period';
import type { ActivityOverview, ActivityOverviewPoint } from '@/lib/types';
import { SectionError, StatGrid, StripLabel, columnOf, pctDelta } from '../parts';

/**
 * Sign-up through to verification. Sign-ups are a period flow. The verified
 * counts are running totals, so they carry a live tick instead of a delta that
 * would compare a stock against a flow. "Returning verified" is neither: it is
 * verified users who joined before the period and were seen online during it,
 * so it is period-scoped but has no backend comparison.
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
          label="Returning verified users"
          value={formatNumber(totals.weeklyReturningVerifiedUsers)}
          hint={`${formatPercent(returningShare)} of verified users · joined before this period, seen online during it`}
        />
      </StatGrid>

      <div className="space-y-3">
        <StripLabel>Verification channel</StripLabel>
        <StatGrid cols={2}>
          <StatCard
            label="Email verified"
            value={formatNumber(totals.emailVerifiedCount)}
            isSnapshot
            hint="Current total · a user verified both ways counts in each"
          />
          <StatCard
            label="Phone verified"
            value={formatNumber(totals.phoneVerifiedCount)}
            isSnapshot
            hint="Current total · a user verified both ways counts in each"
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
        <Card
          title="Users verifying per day"
          subtitle={`${periodLabel(period)} · distinct users who verified an email or phone that day`}
        >
          <TimeSeriesChart
            data={days}
            series={[{ key: 'verifiedUsers', label: 'Users verified' }]}
            kind="area"
          />
        </Card>
      </div>
    </>
  );
}
