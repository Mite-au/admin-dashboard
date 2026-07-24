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
