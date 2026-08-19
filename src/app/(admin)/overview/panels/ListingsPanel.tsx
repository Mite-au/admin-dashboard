import { Sparkline, TimeSeriesChart } from '@/components/charts';
import { Card, StatCard } from '@/components/ui';
import { formatNumber, formatPercent } from '@/lib/format';
import { fillDailySeries } from '@/lib/metrics';
import { periodLabel, type PeriodRange } from '@/lib/period';
import type { ListingsActivityPoint, ListingsOverview } from '@/lib/types';
import {
  SectionError,
  StatGrid,
  StripLabel,
  columnOf,
  pctDelta,
  pointsDelta,
} from '../parts';

/**
 * Supply side: how many listings get started, created and published, and how
 * much of that comes from people listing for the first time.
 */
export function ListingsPanel({
  data,
  period,
}: {
  data: ListingsOverview | null;
  period: PeriodRange;
}) {
  if (!data) return <SectionError label="Listings overview" />;

  const totals = data.totals;
  const prev = data.previousTotals;
  const days = fillDailySeries<ListingsActivityPoint>(
    data.activityByDay,
    period.from,
    period.to,
  );

  return (
    <>
      <StatGrid cols={4}>
        <StatCard
          label="Listings published"
          value={formatNumber(totals.listingPublishedCount)}
          delta={prev ? pctDelta(totals.listingPublishedCount, prev.listingPublishedCount) : undefined}
          footer={<Sparkline data={columnOf(days, 'listingsPublished')} />}
        />
        <StatCard
          label="First-listing rate"
          value={formatPercent(totals.firstListingRate)}
          delta={prev ? pointsDelta(totals.firstListingRate, prev.firstListingRate) : undefined}
          hint="Publishers listing for the first time"
        />
        <StatCard
          label="Listing detail views"
          value={formatNumber(totals.totalListingDetailViews)}
          hint="No period comparison available"
        />
        <StatCard
          label="Repeat listers"
          value={formatNumber(totals.repeatListingUserCount)}
          delta={prev ? pctDelta(totals.repeatListingUserCount, prev.repeatListingUserCount) : undefined}
          hint="Published more than once"
        />
      </StatGrid>

      <div className="space-y-3">
        <StripLabel>Creation steps</StripLabel>
        <StatGrid cols={2}>
          <StatCard
            label="Listings started"
            value={formatNumber(totals.listingStartedCount)}
            delta={prev ? pctDelta(totals.listingStartedCount, prev.listingStartedCount) : undefined}
          />
          <StatCard
            label="Create tapped"
            value={formatNumber(totals.listingCreateClickedCount)}
            delta={
              prev
                ? pctDelta(totals.listingCreateClickedCount, prev.listingCreateClickedCount)
                : undefined
            }
          />
        </StatGrid>
      </div>

      <Card
        title="Listing creation, day by day"
        subtitle={periodLabel(period)}
      >
        {/* Four nested magnitudes — each step is a subset of the one above it,
            so the vertical gaps between the lines are the drop-off. */}
        <TimeSeriesChart
          data={days}
          series={[
            { key: 'listingStarted', label: 'Started' },
            { key: 'listingCreateClicked', label: 'Create tapped' },
            { key: 'listings', label: 'Created' },
            { key: 'listingsPublished', label: 'Published' },
          ]}
          kind="line"
          height={300}
        />
      </Card>
    </>
  );
}
