/**
 * Hand-rolled runtime guards for the backend boundary.
 *
 * The admin API is a NestJS/Prisma service that has, in practice, returned:
 * numbers as strings (Prisma `Decimal` and `BigInt` serialise that way),
 * `null` where the type says `number`, objects where the type says array, and
 * whole keys missing when a feature isn't wired yet. TypeScript types are
 * erased at runtime, so `api<ChatOverview>()` is a promise, not a proof.
 *
 * These helpers are deliberately tiny and dependency-free, and they are pure —
 * no `next/headers`, no `fetch` — so client components can import them too.
 *
 * Convention: every helper takes `unknown` and always returns the declared
 * type. They never throw. Where "absent" is meaningfully different from
 * "zero" (an un-wired metric vs. a real count of nothing) use the `*OrNull`
 * variants and let the UI render an em-dash instead of a confident 0.
 */

/** Narrow to a plain object. Arrays and null are rejected. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Read a property off an unknown value without throwing on non-objects. */
export function get(source: unknown, key: string): unknown {
  return isRecord(source) ? source[key] : undefined;
}

/**
 * Coerce to a finite number, falling back when that isn't possible.
 *
 * Numeric strings are accepted because Prisma serialises `Decimal`/`BigInt`
 * columns as strings — `"1234.50"` is a real amount, not garbage. Empty
 * strings, booleans, `null` and `NaN` are not: they all fall back rather than
 * silently becoming 0 via `Number()`'s looser rules.
 */
export function num(value: unknown, fallback = 0): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return fallback;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

/**
 * Like `num`, but returns null when the value is absent or unparseable.
 *
 * Use this when the UI should distinguish "we have no number" from "the
 * number is zero" — e.g. a KPI the backend hasn't implemented yet should read
 * "—", not a confident "0".
 */
export function numOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/** Coerce to a non-negative finite number (counts can't be negative). */
export function count(value: unknown, fallback = 0): number {
  const n = num(value, fallback);
  return n < 0 ? fallback : n;
}

/**
 * Coerce to a rate expressed as a fraction 0..1.
 *
 * Fractions are the house convention: the backend sends `zeroResultRate`,
 * `searchToTradeRate`, `firstListingRate` and `conversionFromPrev` as 0..1,
 * and every renderer multiplies by 100 itself. Out-of-range input is clamped
 * rather than rescaled — silently dividing a stray `12.4` by 100 would hide a
 * real backend contract break behind a plausible-looking 12.4%.
 */
export function fraction(value: unknown, fallback = 0): number {
  const n = numOrNull(value);
  if (n === null) return fallback;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

/** `fraction` that preserves "not measured" as null rather than 0. */
export function fractionOrNull(value: unknown): number | null {
  const n = numOrNull(value);
  if (n === null) return null;
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

/** Coerce to a string, falling back for non-strings. */
export function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

/** Coerce to a string, or null when absent/empty. Preserves surrounding
 *  whitespace — use `trimmedOrNull` when blank should mean absent. */
export function strOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  return value === '' ? null : value;
}

/**
 * Coerce to a trimmed string, treating blank-but-present as absent.
 *
 * For identifier-ish fields (region codes, interest keys) and free text that
 * drives a truthiness check. `"   "` is not a region code, and a UI that gates
 * an action on `Boolean(regionCode)` would otherwise enable it on whitespace.
 */
export function trimmedOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

/** Coerce to a boolean. Accepts the string/number forms JSON APIs leak. */
export function bool(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    if (v === 'true' || v === '1' || v === 'yes') return true;
    if (v === 'false' || v === '0' || v === 'no') return false;
  }
  return fallback;
}

/** Coerce to a boolean, or null when absent (tri-state flags). */
export function boolOrNull(value: unknown): boolean | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    if (v === 'true' || v === '1' || v === 'yes') return true;
    if (v === 'false' || v === '0' || v === 'no') return false;
  }
  return null;
}

/**
 * Map an unknown value to an array of `T`.
 *
 * Accepts a bare array or the `{ items: [...] }` / `{ data: [...] }` envelopes
 * the backend uses inconsistently, and always returns an array so callers can
 * `.map()` without a guard. `mapItem` may return `null` to drop an entry that
 * can't be salvaged (e.g. a row with no id).
 */
export function arrayOf<T>(
  value: unknown,
  mapItem: (item: unknown, index: number) => T | null,
): T[] {
  const source = Array.isArray(value)
    ? value
    : Array.isArray(get(value, 'items'))
      ? (get(value, 'items') as unknown[])
      : Array.isArray(get(value, 'data'))
        ? (get(value, 'data') as unknown[])
        : [];

  const out: T[] = [];
  for (let i = 0; i < source.length; i += 1) {
    const mapped = mapItem(source[i], i);
    if (mapped !== null) out.push(mapped);
  }
  return out;
}

/** Constrain a value to a known set of literals, falling back otherwise. */
export function oneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})/;

/**
 * Normalise a value to a `YYYY-MM-DD` calendar-day key, or null.
 *
 * When the input already starts with a `YYYY-MM-DD` prefix we take that prefix
 * verbatim and never re-interpret it through `Date`. This matters: the backend
 * buckets `activityByDay` in Australian local time, so parsing
 * `"2026-08-19T00:00:00.000Z"` and re-formatting it would shift the bucket a
 * day. Only non-date-shaped inputs go through `Date` parsing.
 */
export function dayKeyOrNull(value: unknown): string | null {
  if (typeof value === 'string') {
    const m = DATE_ONLY.exec(value.trim());
    if (m) {
      // Reject impossible calendar dates like 2026-13-45 that match the shape.
      const [, y, mo, d] = m;
      const month = Number(mo);
      const day = Number(d);
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return `${y}-${mo}-${d}`;
      }
    }
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const mo = String(parsed.getMonth() + 1).padStart(2, '0');
      const d = String(parsed.getDate()).padStart(2, '0');
      return `${y}-${mo}-${d}`;
    }
  }
  return null;
}

/** `dayKeyOrNull` with a fallback, for series points that must have a date. */
export function dayKey(value: unknown, fallback = ''): string {
  return dayKeyOrNull(value) ?? fallback;
}

/**
 * Keep a timestamp string only if it parses to a real date, else null.
 * Formatters already render null as "—", so this stops `new Date(null)`
 * silently meaning 1970 in a "last active" column.
 */
export function isoOrNull(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim() === '') return null;
  return Number.isNaN(new Date(value).getTime()) ? null : value;
}
