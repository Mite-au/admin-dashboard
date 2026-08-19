import type { StatDelta } from '@/components/ui';
import { formatDeltaPoints, formatNumber, formatPercent } from '@/lib/format';
import { computeDelta, formatDelta, type Delta } from '@/lib/metrics';
import type {
  WeeklyCoreKpiKey,
  WeeklyMetricValue,
  WeeklyMetricsResponse,
} from '@/lib/types';

/** Reading order for the review: acquisition, supply, demand. */
const KPI_ORDER: { key: WeeklyCoreKpiKey; label: string }[] = [
  { key: 'verifiedUsers', label: 'Newly verified users' },
  { key: 'firstListingRate', label: 'First-listing rate' },
  { key: 'publishedListings', label: 'Listings published' },
  { key: 'chatStartRate', label: 'Listing → chat start' },
  { key: 'transactionSignals', label: 'Transaction signals' },
];

export interface WeeklyKpi {
  key: WeeklyCoreKpiKey;
  label: string;
  metric: WeeklyMetricValue;
  /**
   * Derived from `thisWeek` and `lastWeek` rather than read from the payload's
   * own `delta` field, so the chip can never contradict the two numbers
   * printed beside it. The fetcher already defaults that field to the same
   * subtraction.
   */
  delta: Delta;
}

export function readKpis(data: WeeklyMetricsResponse): WeeklyKpi[] {
  return KPI_ORDER.map(({ key, label }) => {
    const metric = data.coreKpis[key];
    return { key, label, metric, delta: computeDelta(metric.thisWeek, metric.lastWeek) };
  });
}

/** This week's headline number for a KPI, in its own unit. */
export function kpiValue(metric: WeeklyMetricValue): string {
  return metric.unit === 'rate' ? formatPercent(metric.thisWeek) : formatNumber(metric.thisWeek);
}

/** Last week's, for the comparison hint. */
export function kpiPriorValue(metric: WeeklyMetricValue): string {
  return metric.unit === 'rate' ? formatPercent(metric.lastWeek) : formatNumber(metric.lastWeek);
}

/**
 * The chip a `StatCard` renders. A rate moving 8% → 10% has gained two
 * percentage POINTS; calling that "+25%" is the standard dashboard lie, so
 * rates and counts take different renderings of the same delta.
 */
export function kpiDeltaChip(kpi: WeeklyKpi): StatDelta {
  return kpi.metric.unit === 'rate'
    ? { raw: kpi.delta.raw, formatted: formatDeltaPoints(kpi.delta.raw) }
    : { raw: kpi.delta.raw, formatted: formatDelta(kpi.delta) };
}

/**
 * The week's biggest gain and biggest drop.
 *
 * Ranked on RELATIVE change, not on the raw delta: the previous ranking put
 * counts and percentage points on one scale, so "+3 listings" outranked
 * "+2pp on the chat start rate" purely because 3 > 2. Relative change is the
 * only comparison the five KPIs share.
 *
 * A KPI that started from zero has no relative change to rank — `computeDelta`
 * returns null rather than inventing one — so it sits out the ranking instead
 * of pretending to infinite growth.
 */
export function pickMovers(kpis: WeeklyKpi[]): { riser: WeeklyKpi | null; faller: WeeklyKpi | null } {
  const rankable = kpis.filter((kpi) => kpi.delta.pct !== null);

  let riser: WeeklyKpi | null = null;
  let faller: WeeklyKpi | null = null;

  for (const kpi of rankable) {
    const pct = kpi.delta.pct as number;
    if (pct > 0 && (riser === null || pct > (riser.delta.pct as number))) riser = kpi;
    if (pct < 0 && (faller === null || pct < (faller.delta.pct as number))) faller = kpi;
  }

  return { riser, faller };
}
