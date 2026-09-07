'use client';

import { Sparkline, seriesColor } from '@/components/charts';
import { Card, DeltaChip } from '@/components/ui';
import { formatCompact, formatNumber, formatPercent } from '@/lib/format';
import { safeRate } from '@/lib/metrics';
import { periodLabel, type PeriodParams, type PeriodRange } from '@/lib/period';
import type { SearchGapsResponse, UserLoginsResponse } from '@/lib/types';
import { DetailLink, SectionError, invertedPointsDelta, periodHref } from '../parts';

function Figure({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="min-w-0">
      <dt className="label-micro">{label}</dt>
      <dd className="tnum mt-1 text-title font-semibold text-ink-900">{value}</dd>
      {note && <dd className="mt-0.5 text-2xs text-ink-400">{note}</dd>}
    </div>
  );
}

/**
 * Who is actually signing in. These are trailing windows measured to now —
 * the backend fixes them at 1, 7 and 30 days — so the tile says so rather
 * than pretending to follow the period selector.
 *
 * "Yesterday" is the last entry of the daily series. The backend's 30-day
 * range runs to the start of today (UTC) and never returns today's bucket,
 * so the final point is the last complete day; the FIRST point is the partial
 * one, cut at a mid-day instant, and is left out of the trend so it cannot
 * read as a dip. The raw `dau` field counts login events, not people, so it
 * is not the daily-active figure either.
 */
export function ActivesTile({ data }: { data: UserLoginsResponse | null }) {
  const link = <DetailLink href="/user-logins">Logins</DetailLink>;

  if (!data) {
    return (
      <Card title="Signed-in users" actions={link} className="h-full">
        <SectionError label="Login activity" />
      </Card>
    );
  }

  const daily = data.daily;
  const yesterday = daily.length > 0 ? daily[daily.length - 1] : null;
  const trend = daily.length > 1 ? daily.slice(1) : daily;
  const stickiness = safeRate(data.wau, data.mau);

  return (
    <Card
      title="Signed-in users"
      subtitle="Trailing windows to now, not the selected period"
      actions={link}
      className="h-full"
    >
      <dl className="grid grid-cols-3 gap-x-4">
        <Figure
          label="Yesterday"
          value={yesterday ? formatNumber(yesterday.uniqueUsers) : '—'}
          note="Last full UTC day"
        />
        <Figure label="Last 7 days" value={formatNumber(data.wau)} note="Distinct users" />
        <Figure
          label="Last 30 days"
          value={formatNumber(data.mau)}
          note={
            stickiness === null
              ? 'Distinct users'
              : `Stickiness ${formatPercent(stickiness, { digits: 0 })} (7d ÷ 30d)`
          }
        />
      </dl>
      <div className="mt-4 border-t border-ink-100 pt-3">
        <p className="text-2xs text-ink-500">
          Distinct users signing in per day, last {trend.length} full days
        </p>
        <Sparkline data={trend.map((day) => day.uniqueUsers)} className="mt-2" />
      </div>
    </Card>
  );
}

/**
 * Demand the catalogue is not meeting: the share of searches that returned
 * nothing, and the queries behind most of them. Up is bad, so the chip's
 * colour is inverted. The chip is withheld when either period had no
 * searches — a rate against an empty window is not a comparison.
 */
export function DemandTile({
  data,
  period,
  periodParams,
}: {
  data: SearchGapsResponse | null;
  period: PeriodRange;
  periodParams: PeriodParams;
}) {
  const link = <DetailLink href={periodHref('/search-gaps', periodParams)}>Search gaps</DetailLink>;

  if (!data) {
    return (
      <Card title="Unmet demand" actions={link} className="h-full">
        <SectionError label="Search gaps" />
      </Card>
    );
  }

  const { totals, previousTotals } = data;
  const gaps = data.gaps.slice(0, 5);
  const top = gaps[0]?.zeroResults ?? 0;
  const gapShare = safeRate(
    gaps.reduce((sum, gap) => sum + gap.zeroResults, 0),
    totals.zeroResultSearches,
  );
  const comparable = totals.searches > 0 && previousTotals.searches > 0;

  return (
    <Card
      title="Unmet demand"
      subtitle={`${periodLabel(period)} · searches that found nothing`}
      actions={link}
      className="h-full"
    >
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <span className="tnum text-display font-bold text-ink-900">
          {formatPercent(totals.zeroResultRate)}
        </span>
        {comparable && (
          <DeltaChip
            delta={invertedPointsDelta(totals.zeroResultRate, previousTotals.zeroResultRate)}
          />
        )}
      </div>
      <p className="mt-1 text-xs text-ink-500">
        {formatNumber(totals.zeroResultSearches)} of {formatNumber(totals.searches)} searches
        returned no listings
      </p>

      {gaps.length > 0 ? (
        <ol
          className="mt-4 space-y-2 border-t border-ink-100 pt-3"
          aria-label="Most-searched queries with no results"
        >
          {gaps.map((gap) => (
            <li key={gap.query} className="flex items-center gap-3 text-data">
              <span className="min-w-0 flex-1 truncate text-ink-800">{gap.query}</span>
              <span
                aria-hidden="true"
                className="h-1.5 w-14 shrink-0 overflow-hidden rounded-full bg-ink-100"
              >
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: `${top > 0 ? Math.max((gap.zeroResults / top) * 100, 2) : 0}%`,
                    background: seriesColor(0),
                  }}
                />
              </span>
              <span className="tnum w-8 shrink-0 text-right text-ink-500">
                {formatCompact(gap.zeroResults)}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-4 border-t border-ink-100 pt-3 text-xs text-ink-400">
          Every search found something this period.
        </p>
      )}

      {gapShare !== null && gaps.length > 1 && (
        <p className="mt-3 text-2xs text-ink-400">
          These {gaps.length} queries are {formatPercent(gapShare, { digits: 0 })} of all empty
          searches.
        </p>
      )}
    </Card>
  );
}
