/**
 * Analytics derivations shared by the dashboard pages.
 *
 * Pages used to do this arithmetic inline, which is how the same "delta"
 * ended up meaning three different things in three cards. Everything here is
 * pure and isomorphic — safe to import from client components.
 *
 * ── Unit convention ───────────────────────────────────────────────────────
 * A RATE is always a FRACTION in 0..1. `0.124` is 12.4%. Nothing in this
 * module returns "a percent"; only the `format*` helpers multiply by 100.
 * Percentage-POINT differences between two rates are still fractions here
 * (`0.02` = 2pp) and are rendered by `formatDeltaPoints`.
 */

import { addDays, daysBetween, normaliseRange } from './period';

/**
 * Float noise threshold. Two values within this of each other count as
 * unchanged, so `0.1 + 0.2 - 0.3` doesn't render as a rise.
 */
const EPSILON = 1e-9;

export type DeltaDirection = 'up' | 'down' | 'flat';

export interface Delta {
  /** Absolute change, `current - previous`, in the source unit. */
  raw: number;
  /**
   * Relative change as a FRACTION: `0.124` means +12.4%.
   * Null when `previous` is 0 and `current` isn't — the percentage change
   * from nothing is undefined, and rendering "∞%" or "+100%" would invent a
   * number the data doesn't contain.
   */
  pct: number | null;
  direction: DeltaDirection;
}

/**
 * Compare a period against its predecessor.
 *
 * Non-finite inputs are treated as 0 so a single bad backend field can't
 * poison a card with `NaN`.
 *
 * @example computeDelta(112, 100) // { raw: 12, pct: 0.12, direction: 'up' }
 * @example computeDelta(38, 0)    // { raw: 38, pct: null, direction: 'up' }
 * @example computeDelta(0, 0)     // { raw: 0,  pct: 0,    direction: 'flat' }
 */
export function computeDelta(current: number, previous: number): Delta {
  const cur = Number.isFinite(current) ? current : 0;
  const prev = Number.isFinite(previous) ? previous : 0;
  const raw = cur - prev;

  const direction: DeltaDirection =
    Math.abs(raw) < EPSILON ? 'flat' : raw > 0 ? 'up' : 'down';

  // Zero baseline: 0 → 0 is genuinely no change; 0 → anything is unmeasurable
  // as a percentage. Distinguishing these keeps "new metric started counting"
  // from masquerading as explosive growth.
  let pct: number | null;
  if (Math.abs(prev) < EPSILON) {
    pct = Math.abs(raw) < EPSILON ? 0 : null;
  } else {
    pct = raw / Math.abs(prev);
  }

  return { raw, pct, direction };
}

/**
 * Render a `Delta` for a stat card chip.
 *
 * @param kind `'percent'` (default) shows the relative change and falls back
 *   to the absolute difference when `pct` is null — that fallback is the
 *   point of the API: a metric rising from 0 to 38 should read "+38", never
 *   "—" and never a fabricated percentage. `'count'` always shows the
 *   absolute difference.
 *
 * Pairs with the `{ raw, formatted }` delta prop that StatCard already takes:
 * `{ raw: delta.raw, formatted: formatDelta(delta) }`.
 */
export function formatDelta(delta: Delta, kind: 'count' | 'percent' = 'percent'): string {
  if (kind === 'percent' && delta.pct !== null) {
    const pctValue = delta.pct * 100;
    if (Math.abs(pctValue) < 0.05) return '0.0%';
    const rounded = Math.round(Math.abs(pctValue) * 10) / 10;
    return `${pctValue > 0 ? '+' : '−'}${rounded.toFixed(1)}%`;
  }

  if (Math.abs(delta.raw) < EPSILON) return '0';
  const magnitude = new Intl.NumberFormat('en-AU', { maximumFractionDigits: 2 }).format(
    Math.abs(delta.raw),
  );
  // U+2212 MINUS SIGN so a column of deltas aligns and doesn't read as a dash.
  return `${delta.raw > 0 ? '+' : '−'}${magnitude}`;
}

export interface FillDailySeriesOptions<T> {
  /** Property holding the `YYYY-MM-DD` key. Default `'date'`. */
  dateKey?: string;
  /**
   * Explicit values for synthesised days. Anything not covered here is
   * zero-filled for every numeric key seen in `points`.
   */
  fill?: Partial<T>;
}

/**
 * Expand a sparse daily series to one entry per calendar day in `from..to`.
 *
 * The backend omits days with no activity. A line chart plotting those points
 * straight draws a smooth slope across the gap, which reads as "low traffic"
 * rather than "no traffic" and silently compresses the x-axis. Zero-filling
 * makes the flat stretches honest.
 *
 * Missing days get `0` for every key that holds a number somewhere in
 * `points`, overridden by `opts.fill`. Values stay `string | number` so the
 * result remains assignable to the chart row type.
 *
 * Timezone-safe: day stepping goes through `period.addDays`, which works on
 * local calendar fields and can't drift across a DST boundary.
 *
 * Duplicate day keys in the input collapse to the last occurrence.
 * Points outside `from..to` are dropped.
 */
export function fillDailySeries<T extends Record<string, unknown>>(
  points: T[],
  from: string,
  to: string,
  opts: FillDailySeriesOptions<T> = {},
): T[] {
  const dateKey = opts.dateKey ?? 'date';
  const range = normaliseRange({ from, to });
  const source = Array.isArray(points) ? points : [];

  // Index by normalised day key; also learn which keys are numeric so we know
  // what to zero-fill. A key that is a string in the data (a label, a
  // currency code) must not be replaced with 0.
  const byDay = new Map<string, T>();
  const numericKeys = new Set<string>();

  for (const point of source) {
    if (!point || typeof point !== 'object') continue;
    const day = normaliseDayKey(point[dateKey]);
    if (day) byDay.set(day, { ...point, [dateKey]: day });
    for (const [k, v] of Object.entries(point)) {
      if (k !== dateKey && typeof v === 'number' && Number.isFinite(v)) numericKeys.add(k);
    }
  }

  const zeroTemplate: Record<string, unknown> = {};
  for (const key of numericKeys) zeroTemplate[key] = 0;

  const span = daysBetween(range.from, range.to);
  const out: T[] = [];
  for (let i = 0; i <= span; i += 1) {
    const day = addDays(range.from, i);
    const existing = byDay.get(day);
    out.push(
      existing ?? ({ ...zeroTemplate, [dateKey]: day, ...(opts.fill ?? {}) } as unknown as T),
    );
  }
  return out;
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}/;

/** Local copy of the day-key normaliser so metrics stays free of guard imports. */
function normaliseDayKey(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return DATE_ONLY.test(trimmed) ? trimmed.slice(0, 10) : null;
}

/**
 * Trailing moving average over `window` points.
 *
 * Index `i` averages the slots `i-window+1 .. i`. The first `window - 1`
 * results are null: a "7-day average" computed from two days isn't a 7-day
 * average, and drawing one makes every series look like it ramps up from the
 * left edge.
 *
 * Nulls inside a full window are skipped rather than counted as zero — a day
 * with no data shouldn't drag the mean down. A window whose slots are all
 * null yields null.
 *
 * @param window number of trailing points; values below 1 are clamped to 1.
 */
export function movingAverage(values: Array<number | null>, window: number): (number | null)[] {
  const source = Array.isArray(values) ? values : [];
  const size = Math.max(1, Math.floor(Number.isFinite(window) ? window : 1));

  return source.map((_, i) => {
    if (i < size - 1) return null;
    let sum = 0;
    let seen = 0;
    for (let j = i - size + 1; j <= i; j += 1) {
      const v = source[j];
      if (typeof v === 'number' && Number.isFinite(v)) {
        sum += v;
        seen += 1;
      }
    }
    return seen === 0 ? null : sum / seen;
  });
}

export interface StageConversion {
  /** Share of the first stage that reached this one, 0..1. Null if stage 1 was empty. */
  fromFirst: number | null;
  /** Share of the immediately previous stage that reached this one, 0..1. Null for stage 1, or when the previous stage was empty. */
  fromPrevious: number | null;
}

/**
 * Per-stage conversion for a funnel, as FRACTIONS 0..1.
 *
 * Null denominators stay null rather than collapsing to 0 — "nobody reached
 * the previous stage" is not the same claim as "0% converted", and the funnel
 * page renders the two differently.
 *
 * The first stage always has `fromPrevious: null` (there is no previous
 * stage), matching `FunnelStage.conversionFromPrev`'s contract.
 *
 * Note conversions above 1 are possible and are NOT clamped: a stage counting
 * more events than its parent is a real signal (double-counting, or users
 * entering mid-funnel) and hiding it behind a tidy 100% would bury the bug.
 */
export function stageConversions(stages: Array<{ count: number }>): StageConversion[] {
  const source = Array.isArray(stages) ? stages : [];
  const countAt = (i: number): number => {
    const v = source[i]?.count;
    return typeof v === 'number' && Number.isFinite(v) ? v : 0;
  };

  const first = countAt(0);
  return source.map((_, i) => {
    const current = countAt(i);
    const previous = i === 0 ? null : countAt(i - 1);
    return {
      fromFirst: first === 0 ? null : current / first,
      fromPrevious: previous === null || previous === 0 ? null : current / previous,
    };
  });
}

/** Sum a projected field, ignoring non-finite entries. Empty input sums to 0. */
export function sumBy<T>(items: T[], select: (item: T) => number | null | undefined): number {
  if (!Array.isArray(items)) return 0;
  let total = 0;
  for (const item of items) {
    const v = select(item);
    if (typeof v === 'number' && Number.isFinite(v)) total += v;
  }
  return total;
}

/**
 * The item with the largest projected value, or null for an empty list.
 * Ties resolve to the first occurrence; items projecting to a non-finite
 * value are skipped entirely.
 */
export function maxBy<T>(items: T[], select: (item: T) => number | null | undefined): T | null {
  if (!Array.isArray(items)) return null;
  let best: T | null = null;
  let bestValue = -Infinity;
  for (const item of items) {
    const v = select(item);
    if (typeof v !== 'number' || !Number.isFinite(v)) continue;
    if (v > bestValue) {
      bestValue = v;
      best = item;
    }
  }
  return best;
}

/**
 * Safe division as a FRACTION, null when the denominator is 0.
 * The one-liner every page kept re-inventing just before dividing by zero.
 */
export function safeRate(numerator: number, denominator: number): number | null {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) return null;
  if (Math.abs(denominator) < EPSILON) return null;
  return numerator / denominator;
}
