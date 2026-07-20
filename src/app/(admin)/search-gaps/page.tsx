import { Search, SearchX, ListFilter, Hash } from 'lucide-react';
import { Topbar } from '@/components/Topbar';
import { PageHeader } from '@/components/PageHeader';
import { PeriodSelector } from '@/components/PeriodSelector';
import { getSearchGaps } from '@/lib/fetchers';
import { formatDateTime, formatNumber } from '@/lib/format';
import { resolvePeriodFromRecord } from '@/lib/period';

export default async function SearchGapsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawParams = await searchParams;
  const { from, to } = resolvePeriodFromRecord(rawParams);
  const data = await getSearchGaps({ from, to }, 50);

  return (
    <>
      <Topbar breadcrumbs={[{ label: 'Search Gaps', href: '/search-gaps' }]} />
      <PageHeader title="Search Gaps" />

      <div className="px-8 pb-10 space-y-8">
        <PeriodSelector />

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Searches"
            sub={`prev ${formatNumber(data.previousTotals.searches)}`}
            value={data.totals.searches}
            Icon={Search}
          />
          <StatCard
            label="Zero-result searches"
            sub={`prev ${formatNumber(data.previousTotals.zeroResultSearches)}`}
            value={data.totals.zeroResultSearches}
            Icon={SearchX}
          />
          <StatCard
            label="Zero-result rate"
            sub={`prev ${(data.previousTotals.zeroResultRate * 100).toFixed(1)}%`}
            value={`${(data.totals.zeroResultRate * 100).toFixed(1)}%`}
            Icon={ListFilter}
          />
          <StatCard
            label="Distinct queries"
            sub={`prev ${formatNumber(data.previousTotals.distinctQueries)}`}
            value={data.totals.distinctQueries}
            Icon={Hash}
          />
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-base font-semibold text-ink-900">
              Unmet demand — searches with zero results
            </h2>
            <p className="text-xs text-ink-500 mt-1">
              What buyers looked for and didn&apos;t find. Recruit sellers or seed
              listings for the top rows. Tracking starts from the search-event
              deploy; older periods show no data.
            </p>
          </div>
          <div className="inner-card overflow-x-auto">
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
                {data.gaps.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-ink-500 py-8">
                      No zero-result searches recorded in this period.
                    </td>
                  </tr>
                ) : (
                  data.gaps.map((row) => (
                    <tr key={row.query}>
                      <td className="font-medium">{row.query}</td>
                      <td className="text-ink-700 tabular-nums">
                        {formatNumber(row.searches)}
                      </td>
                      <td className="text-ink-700 tabular-nums">
                        {formatNumber(row.zeroResults)}
                      </td>
                      <td>
                        <span
                          className={
                            row.zeroResultRate >= 0.9
                              ? 'pill bg-red-50 text-red-700'
                              : 'pill bg-ink-50 text-ink-700'
                          }
                        >
                          {(row.zeroResultRate * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="text-ink-700">
                        {formatDateTime(row.lastSearchedAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-ink-900">Top searches</h2>
          <div className="inner-card overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Query</th>
                  <th>Searches</th>
                  <th>Avg results</th>
                </tr>
              </thead>
              <tbody>
                {data.topQueries.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center text-ink-500 py-8">
                      No searches recorded in this period.
                    </td>
                  </tr>
                ) : (
                  data.topQueries.map((row) => (
                    <tr key={row.query}>
                      <td className="font-medium">{row.query}</td>
                      <td className="text-ink-700 tabular-nums">
                        {formatNumber(row.searches)}
                      </td>
                      <td className="text-ink-700 tabular-nums">
                        {row.avgResults.toFixed(1)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}

function StatCard({
  label,
  sub,
  value,
  Icon,
}: {
  label: string;
  sub: string;
  value: number | string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
}) {
  return (
    <div className="inner-card p-5 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-ink-500 font-semibold">{label}</p>
        <p className="mt-2 text-3xl font-extrabold text-ink-900">
          {typeof value === 'number' ? formatNumber(value) : value}
        </p>
        <p className="mt-1 text-xs text-ink-500">{sub}</p>
      </div>
      <span className="rounded-xl bg-ink-50 p-2.5 text-ink-700 shrink-0">
        <Icon size={18} strokeWidth={1.75} />
      </span>
    </div>
  );
}
