import { Sparkline, TimeSeriesChart } from '@/components/charts';
import { Card, StatCard } from '@/components/ui';
import { formatNumber, formatPercent } from '@/lib/format';
import { fillDailySeries, sumBy } from '@/lib/metrics';
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
 *
 * "Listings started" has no producer in the app yet — the backend counts an
 * event nothing emits — so it is only shown once a non-zero value has been
 * seen, rather than as a permanent zero that reads like a broken step.
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
  const hasStarted =
    totals.listingStartedCount > 0 ||
    (prev?.listingStartedCount ?? 0) > 0 ||
    sumBy(days, (day) => day.listingStarted) > 0;
  const created = sumBy(days, (day) => day.listings);

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
          hint="First-time posters this period, as a share of all verified users"
        />
        <StatCard
          label="Listing detail views"
          value={formatNumber(totals.totalListingDetailViews)}
          isSnapshot
          hint="All time, including guests"
        />
        <StatCard
          label="Repeat listers"
          value={formatNumber(totals.repeatListingUserCount)}
          delta={prev ? pctDelta(totals.repeatListingUserCount, prev.repeatListingUserCount) : undefined}
          hint="Published more than once"
        />
      </StatGrid>

      <div className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <StripLabel>Creation steps</StripLabel>
          {!hasStarted && (
            <p className="text-2xs text-ink-400">
              Listing starts are not instrumented in the app yet
            </p>
          )}
        </div>
        <StatGrid cols={hasStarted ? 4 : 3}>
          {hasStarted && (
            <StatCard
              label="Listings started"
              value={formatNumber(totals.listingStartedCount)}
              delta={
                prev ? pctDelta(totals.listingStartedCount, prev.listingStartedCount) : undefined
              }
            />
          )}
          <StatCard
            label="Create tapped"
            value={formatNumber(totals.listingCreateClickedCount)}
            delta={
              prev
                ? pctDelta(totals.listingCreateClickedCount, prev.listingCreateClickedCount)
                : undefined
            }
          />
          <StatCard
            label="Created"
            value={formatNumber(created)}
            hint="Posts created this period, drafts included"
          />
          <StatCard
            label="Published"
            value={formatNumber(totals.listingPublishedCount)}
            delta={
              prev ? pctDelta(totals.listingPublishedCount, prev.listingPublishedCount) : undefined
            }
            hint="Includes listings created before this period"
          />
        </StatGrid>
      </div>

      <Card
        title="Listing creation, day by day"
        subtitle={periodLabel(period)}
      >
        {/* Each line is its own period count — a listing published today may
            have been created last month — so read the gaps as volume, not as
            one cohort narrowing step by step. */}
        <TimeSeriesChart
          data={days}
          series={[
            ...(hasStarted ? [{ key: 'listingStarted', label: 'Started' }] : []),
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
