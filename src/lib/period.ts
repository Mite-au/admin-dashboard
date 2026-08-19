/**
 * Period selection and calendar-day arithmetic.
 *
 * Everything here is *local-time* by design. Mite's admins and users are in
 * Australia (UTC+10/+11), so "today" in Sydney is already tomorrow's date in
 * UTC for the last 10–11 hours of every day. Using UTC to derive day keys
 * silently shifts every preset range back by one day for most of the working
 * afternoon — see `toISO` below.
 *
 * This module is pure and isomorphic: no `next/headers`, no fetch. Both the
 * client `PeriodSelector` and RSC pages import it.
 */

export type PeriodPreset =
  | 'last7d'
  | 'last28d'
  | 'last90d'
  | 'thisWeek'
  | 'lastWeek'
  | 'thisMonth'
  | 'lastMonth'
  | 'custom';

export interface PeriodRange {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
}

export interface PeriodParams extends PeriodRange {
  preset: PeriodPreset;
}

export const PRESETS: { id: PeriodPreset; label: string }[] = [
  { id: 'last7d', label: 'Last 7 days' },
  { id: 'last28d', label: 'Last 28 days' },
  { id: 'last90d', label: 'Last 90 days' },
  { id: 'thisWeek', label: 'This week' },
  { id: 'lastWeek', label: 'Last week' },
  { id: 'thisMonth', label: 'This month' },
  { id: 'lastMonth', label: 'Last month' },
  { id: 'custom', label: 'Custom range' },
];

export const DEFAULT_PRESET: PeriodPreset = 'last7d';

const VALID_PRESETS = new Set<PeriodPreset>([
  'last7d',
  'last28d',
  'last90d',
  'thisWeek',
  'lastWeek',
  'thisMonth',
  'lastMonth',
  'custom',
]);

/**
 * Format a Date as a `YYYY-MM-DD` key using its **local** calendar fields.
 *
 * This used to be `date.toISOString().split('T')[0]`, which reads the UTC
 * calendar instead. At 9am on 19 Aug in Sydney the underlying instant is
 * 18 Aug 23:00Z, so `toISOString()` yields "2026-08-18": every preset asked
 * the backend for a window ending yesterday, dropping today's data entirely
 * and padding the range with one stale day at the start.
 */
function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const DAY_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** True when `value` is a well-formed, real `YYYY-MM-DD` calendar date. */
export function isValidDayKey(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const m = DAY_KEY.exec(value);
  if (!m) return false;
  const [, y, mo, d] = m;
  const date = new Date(Number(y), Number(mo) - 1, Number(d), 12);
  // Round-trips only if the day actually exists (rejects 2026-02-31).
  return (
    date.getFullYear() === Number(y) &&
    date.getMonth() === Number(mo) - 1 &&
    date.getDate() === Number(d)
  );
}

/**
 * Parse a `YYYY-MM-DD` key to a local Date anchored at **noon**.
 *
 * Noon rather than midnight so that adding/subtracting days can never land on
 * a skipped or repeated wall-clock hour during a DST transition and roll into
 * the wrong calendar day. Returns null for anything that isn't a real date.
 *
 * (Note `new Date('2026-08-19')` is *not* equivalent — the spec parses the
 * date-only form as UTC midnight, which is the previous day in Australia.)
 */
export function parseDayKey(value: string): Date | null {
  if (!isValidDayKey(value)) return null;
  const [y, mo, d] = value.split('-').map(Number);
  return new Date(y, mo - 1, d, 12);
}

/** Shift a `YYYY-MM-DD` key by whole days. Returns the input if unparseable. */
export function addDays(dayKey: string, days: number): string {
  const d = parseDayKey(dayKey);
  if (!d) return dayKey;
  d.setDate(d.getDate() + days);
  return toISO(d);
}

/**
 * Whole calendar days from `from` to `to` (`to - from`). Negative when `to`
 * precedes `from`, 0 for the same day. Uses the noon anchor, so DST shifts
 * of ±1 hour can't round the division to the wrong integer.
 */
export function daysBetween(from: string, to: string): number {
  const a = parseDayKey(from);
  const b = parseDayKey(to);
  if (!a || !b) return 0;
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/** Number of days a range covers, inclusive of both endpoints (min 1). */
export function rangeLengthDays(range: PeriodRange): number {
  return Math.max(1, daysBetween(range.from, range.to) + 1);
}

/** Returns Monday of the week containing `d` (week starts Monday). */
function weekStart(d: Date): Date {
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  const result = new Date(d);
  result.setDate(d.getDate() + diff);
  return result;
}

export function getPresetRange(preset: Exclude<PeriodPreset, 'custom'>): PeriodRange {
  const today = new Date();
  const todayISO = toISO(today);

  /** Trailing window of `days` days ending today, inclusive. */
  const trailing = (days: number): PeriodRange => {
    const from = new Date(today);
    from.setDate(today.getDate() - (days - 1));
    return { from: toISO(from), to: todayISO };
  };

  switch (preset) {
    case 'last7d':
      return trailing(7);
    case 'last28d':
      return trailing(28);
    case 'last90d':
      return trailing(90);
    case 'thisWeek': {
      const from = weekStart(today);
      return { from: toISO(from), to: todayISO };
    }
    case 'lastWeek': {
      const thisMonday = weekStart(today);
      const lastMonday = new Date(thisMonday);
      lastMonday.setDate(thisMonday.getDate() - 7);
      const lastSunday = new Date(thisMonday);
      lastSunday.setDate(thisMonday.getDate() - 1);
      return { from: toISO(lastMonday), to: toISO(lastSunday) };
    }
    case 'thisMonth': {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: toISO(from), to: todayISO };
    }
    case 'lastMonth': {
      const firstOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      return { from: toISO(firstOfLastMonth), to: toISO(lastOfLastMonth) };
    }
  }
}

/**
 * The equal-length window immediately preceding `range`, for
 * previous-period comparisons.
 *
 * A 7-day range 12–18 Aug returns 5–11 Aug: contiguous, no overlap, same
 * number of days, so the two windows contain the same count of each weekday
 * and week-shaped traffic patterns compare fairly.
 */
export function previousPeriod(range: PeriodRange): PeriodRange {
  const normalised = normaliseRange(range);
  const length = rangeLengthDays(normalised);
  const to = addDays(normalised.from, -1);
  const from = addDays(to, -(length - 1));
  return { from, to };
}

/**
 * Put a range in order and drop unparseable endpoints.
 * A reversed range is swapped rather than rejected — the user clearly meant
 * the window between the two dates. An endpoint that isn't a real date falls
 * back to the other endpoint, degrading to a single day rather than to junk.
 */
export function normaliseRange(range: PeriodRange): PeriodRange {
  const fromOk = isValidDayKey(range.from);
  const toOk = isValidDayKey(range.to);

  if (!fromOk && !toOk) return getPresetRange('last7d');
  if (!fromOk) return { from: range.to, to: range.to };
  if (!toOk) return { from: range.from, to: range.from };

  return range.from <= range.to
    ? { from: range.from, to: range.to }
    : { from: range.to, to: range.from };
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * Compact human label for a range, for chart subtitles and export headers.
 *
 * Repeated month/year parts are elided: `5–19 Aug 2026`,
 * `28 Jul – 19 Aug 2026`, `28 Dec 2025 – 19 Jan 2026`. A single-day range
 * renders as just `19 Aug 2026`.
 *
 * Unparseable input renders "—" rather than being normalised first. Every
 * other consumer of a bad range wants a usable window to query, but a *label*
 * that quietly says "13–19 Aug 2026" for junk input is worse than one that
 * admits it doesn't know — it would caption a chart with a range nobody asked
 * for.
 */
export function periodLabel(range: PeriodRange): string {
  if (!isValidDayKey(range?.from) || !isValidDayKey(range?.to)) return '—';

  const { from, to } = normaliseRange(range);
  const a = parseDayKey(from);
  const b = parseDayKey(to);
  if (!a || !b) return '—';

  const day = (d: Date) => d.getDate();
  const mon = (d: Date) => MONTHS[d.getMonth()];
  const yr = (d: Date) => d.getFullYear();

  if (from === to) return `${day(a)} ${mon(a)} ${yr(a)}`;

  // Same month and year: "5–19 Aug 2026" (tight en dash, one month/year).
  if (yr(a) === yr(b) && a.getMonth() === b.getMonth()) {
    return `${day(a)}–${day(b)} ${mon(b)} ${yr(b)}`;
  }
  // Same year, different months: "28 Jul – 19 Aug 2026".
  if (yr(a) === yr(b)) {
    return `${day(a)} ${mon(a)} – ${day(b)} ${mon(b)} ${yr(b)}`;
  }
  // Spans a year boundary: spell both out.
  return `${day(a)} ${mon(a)} ${yr(a)} – ${day(b)} ${mon(b)} ${yr(b)}`;
}

/**
 * Resolves the active period from a URLSearchParams instance.
 * Falls back to DEFAULT_PRESET when params are missing or invalid.
 */
export function resolvePeriod(searchParams: URLSearchParams): PeriodParams {
  const raw = searchParams.get('preset') ?? '';
  const preset: PeriodPreset = VALID_PRESETS.has(raw as PeriodPreset)
    ? (raw as PeriodPreset)
    : DEFAULT_PRESET;

  if (preset === 'custom') {
    // A hand-edited or stale URL can carry junk here; fall back per-endpoint
    // and put the pair in order so downstream range math never sees to < from.
    const fallback = getPresetRange('last7d');
    const rawFrom = searchParams.get('from');
    const rawTo = searchParams.get('to');
    const from = isValidDayKey(rawFrom) ? rawFrom : fallback.from;
    const to = isValidDayKey(rawTo) ? rawTo : fallback.to;
    return { preset: 'custom', ...normaliseRange({ from, to }) };
  }

  return { preset, ...getPresetRange(preset) };
}

/** Builds the minimal searchParams object for a given period. */
export function buildPeriodParams(period: PeriodParams): Record<string, string> {
  if (period.preset === 'custom') {
    return { preset: 'custom', from: period.from, to: period.to };
  }
  return { preset: period.preset };
}

/**
 * Resolves period from a plain string record — for use in RSC pages where
 * searchParams arrive as `Promise<Record<string, string | undefined>>`.
 */
export function resolvePeriodFromRecord(
  params: Record<string, string | string[] | undefined>,
): PeriodParams {
  const sp = new URLSearchParams();
  const preset = params.preset;
  const from = params.from;
  const to = params.to;
  if (typeof preset === 'string') sp.set('preset', preset);
  if (typeof from === 'string') sp.set('from', from);
  if (typeof to === 'string') sp.set('to', to);
  return resolvePeriod(sp);
}

/** Today's calendar day key in the server's local timezone. */
export function todayDayKey(): string {
  return toISO(new Date());
}

/**
 * The Monday of the ISO week containing `dayKey` (defaults to today).
 * Used to rebuild week boundaries the backend left out of a weekly-metrics
 * payload.
 */
export function weekStartKey(dayKey?: string): string {
  const d = (dayKey && parseDayKey(dayKey)) || new Date();
  return toISO(weekStart(d));
}
