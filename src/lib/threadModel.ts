/**
 * The only two thread types the admin API can produce. The DB enum has a third,
 * `SUBURB_INTEREST`, but `admin.util.ts` folds it into `interest` and both
 * thread mappers apply that fold before responding — so `normalizeThreadType`
 * mirrors the fold rather than admitting a third member.
 */
export type CanonicalThreadType = 'SUBURB' | 'INTEREST';
export type ThreadModelLabel = 'Regional General' | 'Regional Interest' | 'Legacy';

type ThreadModelInput = {
  type?: string | null;
  regionCode?: string | null;
  suburbCode?: string | null;
  interestKey?: string | null;
};

export function getThreadRegionCode(thread: ThreadModelInput): string | null {
  return thread.regionCode ?? null;
}

export function getThreadSuburbCode(thread: ThreadModelInput): string | null {
  return thread.suburbCode ?? null;
}

export function getThreadInterestKey(thread: ThreadModelInput): string | null {
  return thread.interestKey ?? null;
}

// Region-scoped interest threads are named "<Region> > <Topic>"
// (e.g. "South-Western Suburbs > Gardening"). General region threads have no
// separator. Splitting lets admin views lead with the topic instead of the
// region prefix, which otherwise buries the part that identifies the thread.
const THREAD_NAME_SEPARATOR = ' > ';

export function splitThreadName(name: string): {
  topicName: string;
  regionName: string | null;
} {
  // Thread lists come off `toPaged` unnormalised, so `name` really can be
  // null for a half-written row. Bail before dereferencing rather than
  // taking down the whole table.
  if (typeof name !== 'string') return { topicName: '', regionName: null };

  const idx = name.lastIndexOf(THREAD_NAME_SEPARATOR);
  if (idx === -1) {
    return { topicName: name, regionName: null };
  }
  return {
    topicName: name.slice(idx + THREAD_NAME_SEPARATOR.length).trim(),
    regionName: name.slice(0, idx).trim(),
  };
}

export function normalizeThreadType(type?: string | null): CanonicalThreadType | null {
  if (!type) return null;
  const normalized = type.trim().toUpperCase().replace(/-/g, '_');
  if (normalized === 'SUBURB') return 'SUBURB';
  // The same fold the backend applies: a region-scoped interest thread is an
  // interest thread.
  if (normalized === 'INTEREST' || normalized === 'SUBURB_INTEREST') return 'INTEREST';
  return null;
}

/**
 * Which model a thread belongs to, or `null` when there is nothing to judge by.
 *
 * The classification is a function of the region / suburb / interest codes, and
 * **no admin thread endpoint sends them** — `toAdminThreadListItem` and
 * `listUserThreads` select neither. With all three absent, the old version fell
 * through to `Legacy` on every single row, which reads as "this thread predates
 * the region model and needs migrating". That is a claim about the data made
 * from the absence of data.
 *
 * So: absent codes now return `null` ("we can't tell"), and callers render no
 * chip. `Legacy` is reserved for a thread that carries codes which genuinely
 * match neither model — the only case where the warning is earned.
 */
export function getThreadModelLabel(thread: ThreadModelInput): ThreadModelLabel | null {
  const type = normalizeThreadType(thread.type);
  const regionCode = getThreadRegionCode(thread);
  const suburbCode = getThreadSuburbCode(thread);
  const interestKey = getThreadInterestKey(thread);

  if (!regionCode && !suburbCode && !interestKey) return null;

  if (type === 'SUBURB' && regionCode && !suburbCode && !interestKey) {
    return 'Regional General';
  }

  if (type === 'INTEREST' && regionCode && interestKey && !suburbCode) {
    return 'Regional Interest';
  }

  return 'Legacy';
}

export function formatThreadType(type?: string | null): string {
  const normalized = normalizeThreadType(type);
  if (!normalized) return type || 'Unknown';
  return normalized.charAt(0) + normalized.slice(1).toLowerCase();
}
