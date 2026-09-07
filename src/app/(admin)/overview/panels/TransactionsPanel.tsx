import { Sparkline, TimeSeriesChart } from '@/components/charts';
import { Card, StatCard } from '@/components/ui';
import { formatMoney, formatNumber } from '@/lib/format';
import { fillDailySeries } from '@/lib/metrics';
import { periodLabel, type PeriodRange } from '@/lib/period';
import type { TransactionsActivityPoint, TransactionsOverview } from '@/lib/types';
import { SectionError, StatGrid, columnOf, pctDelta } from '../parts';

/**
 * Demand side: trades that actually completed, and the value behind them.
 *
 * "Accepted offer value" is the wire's `acceptedOfferGmv`: offers accepted in
 * the period, whether or not both parties went on to confirm. "Confirmed
 * volume" is the value of trades confirmed in the period — a different set of
 * offers, some accepted before the window opened — so the two are shown side
 * by side but never divided into a completion rate.
 */
export function TransactionsPanel({
  data,
  period,
}: {
  data: TransactionsOverview | null;
  period: PeriodRange;
}) {
  if (!data) return <SectionError label="Transactions overview" />;

  const totals = data.totals;
  const prev = data.previousTotals;
  const days = fillDailySeries<TransactionsActivityPoint>(
    data.activityByDay,
    period.from,
    period.to,
  );
  const avgTrade =
    totals.confirmedTransactionCount > 0
      ? totals.confirmedTransactionVolume / totals.confirmedTransactionCount
      : null;

  return (
    <>
      <StatGrid cols={3}>
        <StatCard
          label="Confirmed transactions"
          value={formatNumber(totals.confirmedTransactionCount)}
          delta={
            prev
              ? pctDelta(totals.confirmedTransactionCount, prev.confirmedTransactionCount)
              : undefined
          }
          footer={<Sparkline data={columnOf(days, 'confirmedTransactionCount')} />}
        />
        <StatCard
          label="Confirmed volume"
          value={formatMoney(totals.confirmedTransactionVolume, null, { digits: 0 })}
          delta={
            prev
              ? pctDelta(totals.confirmedTransactionVolume, prev.confirmedTransactionVolume)
              : undefined
          }
          hint={
            avgTrade === null
              ? 'Offer value on trades both parties confirmed'
              : `Trades both parties confirmed · ${formatMoney(avgTrade)} per trade`
          }
        />
        <StatCard
          label="Accepted offer value"
          value={formatMoney(totals.acceptedOfferGmv, null, { digits: 0 })}
          delta={prev ? pctDelta(totals.acceptedOfferGmv, prev.acceptedOfferGmv) : undefined}
          hint="Offers accepted this period, before confirmation"
        />
      </StatGrid>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="Confirmed transactions" subtitle={periodLabel(period)}>
          <TimeSeriesChart
            data={days}
            series={[{ key: 'confirmedTransactionCount', label: 'Confirmed transactions' }]}
            kind="bar"
          />
        </Card>
        <Card title="Accepted vs confirmed value" subtitle={periodLabel(period)}>
          <TimeSeriesChart
            data={days}
            series={[
              { key: 'acceptedOfferGmv', label: 'Accepted offer value' },
              { key: 'confirmedTransactionVolume', label: 'Confirmed volume' },
            ]}
            kind="line"
            valueKind="currency"
          />
        </Card>
      </div>
    </>
  );
}
