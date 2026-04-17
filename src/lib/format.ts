export function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: '2-digit' });
}
export function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' });
}
export function formatMoney(value: number, currency = 'AUD') {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency }).format(value);
}
export function formatNumber(value: number) {
  return new Intl.NumberFormat('en-AU').format(value);
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
