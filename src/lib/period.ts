export type PeriodPreset =
  | 'last7d'
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
  { id: 'thisWeek', label: 'This week' },
  { id: 'lastWeek', label: 'Last week' },
  { id: 'thisMonth', label: 'This month' },
  { id: 'lastMonth', label: 'Last month' },
  { id: 'custom', label: 'Custom range' },
];

export const DEFAULT_PRESET: PeriodPreset = 'last7d';

const VALID_PRESETS = new Set<PeriodPreset>([
  'last7d',
  'thisWeek',
  'lastWeek',
  'thisMonth',
  'lastMonth',
  'custom',
]);

function toISO(d: Date): string {
  return d.toISOString().split('T')[0];
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

  switch (preset) {
    case 'last7d': {
      const from = new Date(today);
      from.setDate(today.getDate() - 6);
      return { from: toISO(from), to: todayISO };
    }
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
 * Resolves the active period from a URLSearchParams instance.
 * Falls back to DEFAULT_PRESET when params are missing or invalid.
 */
export function resolvePeriod(searchParams: URLSearchParams): PeriodParams {
  const raw = searchParams.get('preset') ?? '';
  const preset: PeriodPreset = VALID_PRESETS.has(raw as PeriodPreset)
    ? (raw as PeriodPreset)
    : DEFAULT_PRESET;

  if (preset === 'custom') {
    const fallback = getPresetRange('last7d');
    const from = searchParams.get('from') ?? fallback.from;
    const to = searchParams.get('to') ?? fallback.to;
    return { preset: 'custom', from, to };
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
