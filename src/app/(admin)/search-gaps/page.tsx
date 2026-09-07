import { Suspense } from 'react';
import { SearchX, TrendingUp, TriangleAlert } from 'lucide-react';
import clsx from 'clsx';
import { ExportCsvButton } from '@/components/ExportCsvButton';
import { PageHeader } from '@/components/PageHeader';
import { PeriodSelector } from '@/components/PeriodSelector';
import { Topbar } from '@/components/Topbar';
import { Card, EmptyState, StatCard } from '@/components/ui';
import { getSearchGaps, optional } from '@/lib/fetchers';
import {
  formatDateTime,
  formatDeltaPoints,
  formatNumber,
  formatPercent,
  formatRelative,
} from '@/lib/format';
import { computeDelta, formatDelta, maxBy, safeRate, sumBy } from '@/lib/metrics';
import { periodLabel, previousPeriod, resolvePeriodFromRecord } from '@/lib/period';
import type { SearchGapsResponse, TopQueryRow } from '@/lib/types';

/** How many rows the endpoint returns for each table (its own cap is 100). */
const ROW_LIMIT = 50;
/** How many gap queries the headline insight sums up. */
const TOP_N = 5;

export default async function SearchGapsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawParams = await searchParams;
  const { from, to } = resolvePeriodFromRecord(rawParams);
  const period = { from, to };
  const data = await optional(getSearchGaps(period, ROW_LIMIT));

  return (
    <>
      <Topbar breadcrumbs={[{ label: 'Search Gaps', href: '/search-gaps' }]} />
      <PageHeader
        title="Search Gaps"
        description="What buyers looked for and didn't find — the shortest path to knowing which sellers to recruit."
      />

      <div className="space-y-6 px-8 pb-10">
        <Suspense>
          <PeriodSelector />
        </Suspense>

        {data === null ? (
          <LoadError />
        ) : (
          <GapsBody data={data} from={from} to={to} />
        )}
      </div>
    </>
  );
}

function GapsBody({ data, from, to }: { data: SearchGapsResponse; from: string; to: string }) {
  const period = { from, to };
  const totals = data.totals;
  // Required by the contract and rebuilt by the fetcher even when the backend
  // omits it, so this is always safe to dereference.
  const prev = data.previousTotals;
  const comparison = `${periodLabel(period)} · against ${periodLabel(previousPeriod(period))}`;

  const searchesDelta = computeDelta(totals.searches, prev.searches);
  const zeroDelta = computeDelta(totals.zeroResultSearches, prev.zeroResultSearches);
  const rateDelta = computeDelta(totals.zeroResultRate, prev.zeroResultRate);
  const queriesDelta = computeDelta(totals.distinctQueries, prev.distinctQueries);

  // Each row's share of ALL zero-result searches in the period — the number
  // that says how much of the problem one query is, which its own
  // zero-result rate (a within-query figure) cannot.
  const gapRows = data.gaps.map((row) => ({
    ...row,
    shareOfGaps: safeRate(row.zeroResults, totals.zeroResultSearches),
  }));

  // `gaps` arrives ordered by zero results descending, so the head of the list
  // really is the top N.
  const topShare = safeRate(
    sumBy(gapRows.slice(0, TOP_N), (row) => row.zeroResults),
    totals.zeroResultSearches,
  );

  const busiestQuery = maxBy(data.topQueries, (row) => row.searches)?.searches ?? 0;

  // Exported already-rendered: a spreadsheet column of `0.9333` is a worse
  // artefact than one of "93.3%", and the rate is a fraction on the wire.
  const gapExportRows = gapRows.map((row) => ({
    query: row.query,
    searches: row.searches,
    zeroResults: row.zeroResults,
    shareOfGaps: formatPercent(row.shareOfGaps),
    zeroResultRate: formatPercent(row.zeroResultRate),
    lastSearchedAt: formatDateTime(row.lastSearchedAt),
  }));

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          className="col-span-2"
          label="Zero-result rate"
          value={formatPercent(totals.zeroResultRate)}
          // Up is bad: only the sign is negated, for colour. The printed
          // figure still reads in its true direction. Two rates differ in
          // percentage POINTS, never in percent.
          delta={{ raw: -rateDelta.raw, formatted: formatDeltaPoints(rateDelta.raw) }}
          hint="Share of this period's searches that came back with nothing."
          footer={
            <p className="tnum text-xs text-ink-500">
              {formatNumber(totals.zeroResultSearches)} of{' '}
              {formatNumber(totals.searches)} searches found nothing · was{' '}
              {formatPercent(prev.zeroResultRate)} last period
            </p>
          }
        />
        <StatCard
          label="Searches"
          value={formatNumber(totals.searches)}
          delta={{ raw: searchesDelta.raw, formatted: formatDelta(searchesDelta) }}
          hint="Signed-in, first-page searches only. Guests and later pages are not recorded."
        />
        <StatCard
          label="Zero-result searches"
          value={formatNumber(totals.zeroResultSearches)}
          delta={{ raw: -zeroDelta.raw, formatted: formatDelta(zeroDelta) }}
          hint="Searches that returned nothing. Each search counted, not each query."
        />
        <StatCard
          label="Distinct query strings"
          value={formatNumber(totals.distinctQueries)}
          delta={{ raw: queriesDelta.raw, formatted: formatDelta(queriesDelta) }}
          hint="Unique lower-cased strings. A trailing space makes a separate one."
        />
      </div>

      <Card
        title="Unmet demand"
        subtitle={comparison}
        bleed={gapRows.length > 0}
        actions={
          gapRows.length > 0 ? (
            <ExportCsvButton
              data={gapExportRows}
              filename={`search-gaps_${from}_${to}.csv`}
              columns={[
                { key: 'query', label: 'Query' },
                { key: 'searches', label: 'Searches' },
                { key: 'zeroResults', label: 'Zero results' },
                { key: 'shareOfGaps', label: 'Share of gaps' },
                { key: 'zeroResultRate', label: 'Zero-result rate' },
                { key: 'lastSearchedAt', label: 'Last searched' },
              ]}
            />
          ) : undefined
        }
      >
        {gapRows.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="Every search found something"
            description="No query came back empty in this period. Search events are only recorded from the day tracking shipped, so an older window can look this way for the wrong reason."
          />
        ) : (
          <>
            {topShare !== null && (
              <p className="px-5 pb-4 text-data leading-relaxed text-ink-500">
                The top {Math.min(TOP_N, gapRows.length)} queries account for{' '}
                <span className="tnum font-semibold text-ink-900">
                  {formatPercent(topShare)}
                </span>{' '}
                of every zero-result search in this period.
              </p>
            )}
            <div className="overflow-x-auto scroll-slim">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Query</th>
                    <th>Searches</th>
                    <th>Zero results</th>
                    <th>Share of gaps</th>
                    <th>Zero-result rate</th>
                    <th>Last searched</th>
                  </tr>
                </thead>
                <tbody>
                  {gapRows.map((row) => (
                    <tr key={row.query}>
                      <td>{row.query}</td>
                      <td className="tnum">{formatNumber(row.searches)}</td>
                      <td className="tnum">{formatNumber(row.zeroResults)}</td>
                      <td>
                        <ShareBar share={row.shareOfGaps} />
                      </td>
                      <td>
                        <span className={clsx('pill-status', rateTone(row.zeroResultRate))}>
                          {formatPercent(row.zeroResultRate, { digits: 0 })}
                        </span>
                      </td>
                      {/* Relative reads faster when scanning for staleness; the
                          exact stamp stays one hover away rather than eating a
                          column of width. */}
                      <td title={formatDateTime(row.lastSearchedAt)}>
                        {formatRelative(row.lastSearchedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      <Card
        title="Top searches"
        subtitle={periodLabel(period)}
        bleed={data.topQueries.length > 0}
      >
        {data.topQueries.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title="No searches recorded"
            description="Nothing was searched in this period, or search tracking had not shipped yet."
          />
        ) : (
          <>
            <p className="px-5 pb-4 text-data leading-relaxed text-ink-500">
              Average results is a mean over every run of that query, so a healthy
              average can still sit on top of many empty runs — read it next to the
              gaps table rather than on its own.
            </p>
            <div className="overflow-x-auto scroll-slim">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Query</th>
                    <th>Searches</th>
                    <th>Avg results</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topQueries.map((row) => (
                    <TopQueryTableRow key={row.query} row={row} busiest={busiestQuery} />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </>
  );
}

function TopQueryTableRow({ row, busiest }: { row: TopQueryRow; busiest: number }) {
  return (
    <tr>
      <td>{row.query}</td>
      <td>
        <CountBar value={row.searches} max={busiest} />
      </td>
      <td className="tnum">{row.avgResults.toFixed(1)}</td>
    </tr>
  );
}

/**
 * One query's share of every zero-result search in the period.
 *
 * The bar is redundant encoding — the number is right there — which is exactly
 * what makes it safe to draw in a neutral grey: it speeds up ranking a long
 * list without spending a colour that would then have to mean something.
 */
function ShareBar({ share }: { share: number | null }) {
  const width = share === null ? 0 : Math.min(Math.max(share * 100, share > 0 ? 2 : 0), 100);

  return (
    <div className="flex items-center gap-2.5">
      <span className="tnum w-14 shrink-0 text-right">
        {formatPercent(share, { digits: 1 })}
      </span>
      <span
        aria-hidden="true"
        className="hidden h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-ink-100 sm:block"
      >
        <span className="block h-full rounded-full bg-ink-400" style={{ width: `${width}%` }} />
      </span>
    </div>
  );
}

/** A count and its share of the table's largest. Same reasoning as `ShareBar`. */
function CountBar({ value, max }: { value: number; max: number }) {
  const width = max > 0 ? Math.max((value / max) * 100, 2) : 0;

  return (
    <div className="flex items-center gap-2.5">
      <span className="tnum w-12 shrink-0 text-right">{formatNumber(value)}</span>
      <span
        aria-hidden="true"
        className="hidden h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-ink-100 sm:block"
      >
        <span className="block h-full rounded-full bg-ink-400" style={{ width: `${width}%` }} />
      </span>
    </div>
  );
}

/** Almost-always-empty queries are the recruiting list; the rest is noise. */
function rateTone(rate: number): string {
  if (rate >= 0.9) return 'pill-danger';
  if (rate >= 0.5) return 'pill-warning';
  return 'pill-neutral';
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
        <span className="font-semibold">Search gaps</span> could not be loaded for this
        period. Refresh to try again.
      </p>
    </div>
  );
}
