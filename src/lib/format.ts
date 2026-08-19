/**
 * All four formatters take whatever the backend sent. `Intl` throws on a bad
 * currency code and `new Date(null)` silently means 1970, so null/garbage is
 * normalised here rather than at ~40 call sites.
 */
function toDate(iso: string | null | undefined): Date | null {
  if (typeof iso !== 'string' || iso === '') return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(iso: string | null | undefined) {
  const d = toDate(iso);
  if (!d) return '—';
  return d.toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: '2-digit' });
}
export function formatDateTime(iso: string | null | undefined) {
  const d = toDate(iso);
  if (!d) return '—';
  return d.toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' });
}
export function formatMoney(value: number | null | undefined, currency?: string | null) {
  const amount = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  // Intl throws a RangeError on anything that isn't a 3-letter ISO code.
  const code =
    typeof currency === 'string' && /^[A-Za-z]{3}$/.test(currency)
      ? currency.toUpperCase()
      : 'AUD';
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: code }).format(amount);
}
export function formatNumber(value: number | null | undefined) {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('en-AU').format(n);
}

/**
 * Render an ISO 3166-1 alpha-2 country code (e.g. "AU", "KR") as a
 * localised display name. Falls back to the raw code if the Intl API
 * can't resolve it or if the input isn't a 2-char code. Backend stores
 * `user_profiles.nationality` as `CHAR(2)`.
 */
/** Backend sometimes returns placeholder strings like "pending" for unprocessed
 *  uploads. Only treat http(s) URLs or rooted paths as displayable. */
export function isImageSrc(src: unknown): src is string {
  return typeof src === 'string' && /^(https?:\/\/|\/)/.test(src);
}

export function formatCountry(code: string | null | undefined): string {
  if (!code) return '—';
  const upper = code.trim().toUpperCase();
  if (upper.length !== 2) return upper;
  try {
    const dn = new Intl.DisplayNames(['en'], { type: 'region' });
    return dn.of(upper) ?? upper;
  } catch {
    return upper;
  }
}

// ── Analytics formatters ────────────────────────────────────────────────
//
// Unit convention, applied without exception across the data layer: a "rate"
// is a FRACTION in 0..1. `0.124` means 12.4%. Only the formatters below
// multiply by 100. Nothing upstream of a formatter should ever hold a value
// that is already "a percent" — that ambiguity is how a chart ends up
// claiming a 1240% conversion rate.

/** The em-dash every formatter uses for "no value". */
const EMPTY = '—';

function finite(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * Abbreviated count for tight spaces — cards, axis ticks, chips.
 * `1200 → "1.2k"`, `3_400_000 → "3.4M"`. Non-finite input renders as 0, to
 * match `formatNumber`'s existing tolerance rather than introducing a second
 * convention for the same kind of value.
 *
 * `Intl` yields an uppercase "K"; we lower it because "1.2k" is the standard
 * form in dashboards and reads less like a units symbol.
 */
export function formatCompact(value: number | null | undefined): string {
  const n = finite(value) ?? 0;
  return new Intl.NumberFormat('en-AU', {
    notation: 'compact',
    maximumFractionDigits: 1,
  })
    .format(n)
    .replace('K', 'k');
}

/**
 * Render a FRACTION as a percent: `0.124 → "12.4%"`.
 *
 * Returns "—" for null/undefined/non-finite, so an un-wired metric stays
 * visibly absent instead of claiming 0%.
 *
 * @param opts.digits fraction digits after the point (default 1)
 * @param opts.signed prefix "+" on positive values (default false)
 */
export function formatPercent(
  value: number | null | undefined,
  opts: { digits?: number; signed?: boolean } = {},
): string {
  const n = finite(value);
  if (n === null) return EMPTY;

  const digits = Math.max(0, Math.min(4, opts.digits ?? 1));
  const pct = n * 100;
  const body = new Intl.NumberFormat('en-AU', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Math.abs(pct));

  // U+2212 MINUS SIGN, not a hyphen: it aligns with digit width and doesn't
  // read as a bullet or a range dash when a column of deltas is stacked up.
  if (pct < 0) return `−${body}%`;
  return opts.signed ? `+${body}%` : `${body}%`;
}

/**
 * Signed percent for delta chips: `0.124 → "+12.4%"`, `-0.031 → "−3.1%"`.
 *
 * Takes the delta as a FRACTION (i.e. `computeDelta().pct`), not a percent.
 * Null renders "—", which is the honest answer when the previous period was
 * zero and a percentage change is undefined.
 */
export function formatDeltaPct(value: number | null | undefined): string {
  const n = finite(value);
  if (n === null) return EMPTY;
  // Collapse float noise so "+0.0%" never appears next to an unchanged value.
  if (Math.abs(n) < 0.00005) return '0.0%';
  return formatPercent(n, { digits: 1, signed: true });
}

/**
 * Delta between two rates, in percentage POINTS: `+0.012 → "+1.2pp"`.
 *
 * A rate moving 10% → 12% has risen 2 points, not 20% — conflating the two is
 * the classic dashboard lie. Use this whenever both operands are already
 * rates; use `formatDeltaPct` for changes in counts.
 */
export function formatDeltaPoints(value: number | null | undefined): string {
  const n = finite(value);
  if (n === null) return EMPTY;
  const points = n * 100;
  if (Math.abs(points) < 0.05) return '0pp';
  const rounded = Math.round(points * 10) / 10;
  return `${rounded > 0 ? '+' : rounded < 0 ? '−' : ''}${Math.abs(rounded).toFixed(1)}pp`;
}

/** Day-and-month only, for chart axes: `"12 Aug"`. */
export function formatDateShort(iso: string | null | undefined): string {
  const d = toDate(iso);
  if (!d) return EMPTY;
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

const RELATIVE_UNITS: [limitSeconds: number, perUnit: number, unit: Intl.RelativeTimeFormatUnit][] = [
  [60, 1, 'second'],
  [3600, 60, 'minute'],
  [86_400, 3600, 'hour'],
  [2_592_000, 86_400, 'day'],
  [31_536_000, 2_592_000, 'month'],
  [Infinity, 31_536_000, 'year'],
];

/**
 * Time elapsed since `iso`, phrased for en-AU: `"2 hrs ago"`, `"3 days ago"`,
 * `"yesterday"`. Garbage or missing input renders "—".
 *
 * Future timestamps are rendered as such ("in 5 mins") rather than clamped —
 * a record dated ahead of now means backend clock skew or a scheduling bug,
 * and hiding it behind "just now" would make that invisible.
 */
export function formatRelative(iso: string | null | undefined): string {
  const d = toDate(iso);
  if (!d) return EMPTY;

  const deltaSeconds = (d.getTime() - Date.now()) / 1000;
  const magnitude = Math.abs(deltaSeconds);
  if (magnitude < 5) return 'just now';

  const rtf = new Intl.RelativeTimeFormat('en-AU', { numeric: 'auto', style: 'short' });
  for (const [limit, perUnit, unit] of RELATIVE_UNITS) {
    if (magnitude < limit) {
      return rtf.format(Math.round(deltaSeconds / perUnit), unit);
    }
  }
  return EMPTY;
}
