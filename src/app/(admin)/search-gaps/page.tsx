import { Suspense } from 'react';
import { SearchX, TrendingUp } from 'lucide-react';
import clsx from 'clsx';
import { ExportCsvButton } from '@/components/ExportCsvButton';
import { PageHeader } from '@/components/PageHeader';
import { PeriodSelector } from '@/components/PeriodSelector';
import { Topbar } from '@/components/Topbar';
import { Card, EmptyState, StatCard } from '@/components/ui';
import { getSearchGaps } from '@/lib/fetchers';
import {
  formatDateTime,
  formatDeltaPoints,
  formatNumber,
  formatPercent,
  formatRelative,
} from '@/lib/format';
import { computeDelta, formatDelta, maxBy } from '@/lib/metrics';
import { periodLabel, previousPeriod, resolvePeriodFromRecord } from '@/lib/period';
import type { SearchGapRow, TopQueryRow } from '@/lib/types';

export default async function SearchGapsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawParams = await searchParams;
  const { from, to } = resolvePeriodFromRecord(rawParams);
  const period = { from, to };
  const data = await getSearchGaps(period, 50);

  const totals = data.totals;
  const prev = data.previousTotals;
  const comparison = `${periodLabel(period)} · against ${periodLabel(previousPeriod(period))}`;

  const searchesDelta = computeDelta(totals.searches, prev.searches);
  const zeroDelta = computeDelta(totals.zeroResultSearches, prev.zeroResultSearches);
  const rateDelta = computeDelta(totals.zeroResultRate, prev.zeroResultRate);
  const queriesDelta = computeDelta(totals.distinctQueries, prev.distinctQueries);

  // The bar in each `searches` cell is scaled against the busiest row in its
  // own table, so the two tables stay independently readable.
  const busiestGap = maxBy(data.gaps, (row) => row.searches)?.searches ?? 0;
  const busiestQuery = maxBy(data.topQueries, (row) => row.searches)?.searches ?? 0;

  // Exported already-rendered: a spreadsheet column of `0.9333` is a worse
  // artefact than one of "93.3%", and the rate is a fraction on the wire.
  const gapExportRows = data.gaps.map((row) => ({
    query: row.query,
    searches: row.searches,
    zeroResults: row.zeroResults,
    zeroResultRate: formatPercent(row.zeroResultRate),
    lastSearchedAt: formatDateTime(row.lastSearchedAt),
  }));

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

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Searches"
            value={formatNumber(totals.searches)}
            delta={{ raw: searchesDelta.raw, formatted: formatDelta(searchesDelta) }}
            hint={`prev ${formatNumber(prev.searches)}`}
          />
          <StatCard
            label="Zero-result searches"
            value={formatNumber(totals.zeroResultSearches)}
            // Up is bad: the sign is negated for colour only, so the printed
            // figure still reads in its true direction.
            delta={{ raw: -zeroDelta.raw, formatted: formatDelta(zeroDelta) }}
            hint={`prev ${formatNumber(prev.zeroResultSearches)}`}
          />
          <StatCard
            label="Zero-result rate"
            value={formatPercent(totals.zeroResultRate)}
            // Two rates differ in percentage POINTS, never in percent.
            delta={{ raw: -rateDelta.raw, formatted: formatDeltaPoints(rateDelta.raw) }}
            hint={`prev ${formatPercent(prev.zeroResultRate)}`}
          />
          <StatCard
            label="Distinct queries"
            value={formatNumber(totals.distinctQueries)}
            delta={{ raw: queriesDelta.raw, formatted: formatDelta(queriesDelta) }}
            hint={`prev ${formatNumber(prev.distinctQueries)}`}
          />
        </div>

        <Card
          title="Unmet demand"
          subtitle={comparison}
          bleed={data.gaps.length > 0}
          actions={
            data.gaps.length > 0 ? (
              <ExportCsvButton
                data={gapExportRows}
                filename={`search-gaps_${from}_${to}.csv`}
                columns={[
                  { key: 'query', label: 'Query' },
                  { key: 'searches', label: 'Searches' },
                  { key: 'zeroResults', label: 'Zero results' },
                  { key: 'zeroResultRate', label: 'Zero-result rate' },
                  { key: 'lastSearchedAt', label: 'Last searched' },
                ]}
              />
            ) : undefined
          }
        >
          {data.gaps.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="Every search found something"
              description="No query came back empty in this period. Search events are only recorded from the day tracking shipped, so an older window can look this way for the wrong reason."
            />
          ) : (
            <div className="overflow-x-auto scroll-slim">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Query</th>
                    <th>Searches</th>
                    <th>Zero results</th>
                    <th>Zero-result rate</th>
                    <th>Last searched</th>
                  </tr>
                </thead>
                <tbody>
                  {data.gaps.map((row) => (
                    <GapRow key={row.query} row={row} busiest={busiestGap} />
                  ))}
                </tbody>
              </table>
            </div>
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
          )}
        </Card>
      </div>
    </>
  );
}

function GapRow({ row, busiest }: { row: SearchGapRow; busiest: number }) {
  return (
    <tr>
      <td>{row.query}</td>
      <td>
        <CountBar value={row.searches} max={busiest} />
      </td>
      <td className="tnum">{formatNumber(row.zeroResults)}</td>
      <td>
        <span className={clsx('pill-status', rateTone(row.zeroResultRate))}>
          {formatPercent(row.zeroResultRate, { digits: 0 })}
        </span>
      </td>
      {/* Relative reads faster when scanning for staleness; the exact stamp
          stays one hover away rather than eating a column of width. */}
      <td title={formatDateTime(row.lastSearchedAt)}>{formatRelative(row.lastSearchedAt)}</td>
    </tr>
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
 * A count and its share of the table's largest.
 *
 * The bar is redundant encoding — the number is right there — which is exactly
 * what makes it safe to draw in a neutral grey: it speeds up ranking a long
 * list without spending a colour that would then have to mean something.
 */
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
