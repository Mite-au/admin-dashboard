import type { StatDelta } from '@/components/ui';
import { formatDeltaPoints, formatNumber, formatPercent } from '@/lib/format';
import { computeDelta, formatDelta, type Delta } from '@/lib/metrics';
import type {
  WeeklyCoreKpiKey,
  WeeklyMetricValue,
  WeeklyMetricsResponse,
} from '@/lib/types';

/**
 * Reading order for the review: acquisition, supply, demand.
 *
 * Labels and hints are written against what `/admin/metrics/weekly` actually
 * queries, which in three places is not what the field name suggests:
 *
 *  * `verifiedUsers` is an EVENT count for the week, not the all-time verified
 *    total the Overview page shows under the same word.
 *  * `chatStartRate` is a same-week set intersection — listings published this
 *    week that also drew a chat this week — not listing-to-chat attribution.
 *    A chat on an older listing is invisible to it.
 *  * `transactionSignals` no longer means "intent". Its source event,
 *    `listing_marked_sold`, moved off offer-acceptance and now fires only when
 *    both parties confirm an appointment — once per listing, ever. So it
 *    counts listings sold on a confirmed trade, which is why it is no longer
 *    labelled as a signal.
 */
const KPI_ORDER: { key: WeeklyCoreKpiKey; label: string; hint: string }[] = [
  {
    key: 'verifiedUsers',
    label: 'Newly verified users',
    hint: 'Distinct users who verified an email or phone this week.',
  },
  {
    key: 'firstListingRate',
    label: 'First-time seller rate',
    hint: 'Users publishing their first ever listing ÷ all verified users at week end.',
  },
  {
    key: 'publishedListings',
    label: 'Listings published',
    hint: 'Distinct listings published this week.',
  },
  {
    key: 'chatStartRate',
    label: 'New listings getting chats',
    hint: "Share of this week's published listings that drew a chat in the same week.",
  },
  {
    key: 'transactionSignals',
    label: 'Listings sold',
    hint: 'Distinct listings marked sold — recorded once both parties confirm the trade.',
  },
];

export interface WeeklyKpi {
  key: WeeklyCoreKpiKey;
  label: string;
  /** One line saying exactly what the number counts, and over what window. */
  hint: string;
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
  return KPI_ORDER.map(({ key, label, hint }) => {
    const metric = data.coreKpis[key];
    return { key, label, hint, metric, delta: computeDelta(metric.thisWeek, metric.lastWeek) };
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
