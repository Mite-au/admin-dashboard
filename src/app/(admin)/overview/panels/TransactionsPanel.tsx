import { Sparkline, TimeSeriesChart } from '@/components/charts';
import { Card, StatCard } from '@/components/ui';
import { formatMoney, formatNumber } from '@/lib/format';
import { fillDailySeries } from '@/lib/metrics';
import { periodLabel, type PeriodRange } from '@/lib/period';
import type { TransactionsActivityPoint, TransactionsOverview } from '@/lib/types';
import { SectionError, StatGrid, columnOf, pctDelta } from '../parts';

/**
 * Demand side: trades that actually completed, and the money behind them.
 * Volume can go negative once refunds net off, which is why the money charts
 * keep a real zero baseline rather than a compacted one.
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
          value={formatMoney(totals.confirmedTransactionVolume)}
          delta={
            prev
              ? pctDelta(totals.confirmedTransactionVolume, prev.confirmedTransactionVolume)
              : undefined
          }
          hint="Net of refunds"
        />
        <StatCard
          label="GMV"
          value={formatMoney(totals.gmv)}
          delta={prev ? pctDelta(totals.gmv, prev.gmv) : undefined}
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
        <Card title="Volume and GMV" subtitle={periodLabel(period)}>
          <TimeSeriesChart
            data={days}
            series={[
              { key: 'confirmedTransactionVolume', label: 'Confirmed volume' },
              { key: 'gmv', label: 'GMV' },
            ]}
            kind="line"
            valueKind="currency"
          />
        </Card>
      </div>
    </>
  );
}
