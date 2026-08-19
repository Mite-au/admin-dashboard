export type CanonicalThreadType = 'SUBURB' | 'INTEREST' | 'SUBURB_INTEREST';
export type ThreadModelLabel = 'Regional General' | 'Regional Interest' | 'Legacy';

type ThreadModelInput = {
  type?: string | null;
  regionCode?: string | null;
  region_code?: string | null;
  suburbCode?: string | null;
  suburb_code?: string | null;
  interestKey?: string | null;
  interest_key?: string | null;
};

export function getThreadRegionCode(thread: ThreadModelInput): string | null {
  return thread.regionCode ?? thread.region_code ?? null;
}

export function getThreadSuburbCode(thread: ThreadModelInput): string | null {
  return thread.suburbCode ?? thread.suburb_code ?? null;
}

export function getThreadInterestKey(thread: ThreadModelInput): string | null {
  return thread.interestKey ?? thread.interest_key ?? null;
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
  if (
    normalized === 'SUBURB' ||
    normalized === 'INTEREST' ||
    normalized === 'SUBURB_INTEREST'
  ) {
    return normalized;
  }
  return null;
}

export function getThreadModelLabel(thread: ThreadModelInput): ThreadModelLabel {
  const type = normalizeThreadType(thread.type);
  const regionCode = getThreadRegionCode(thread);
  const suburbCode = getThreadSuburbCode(thread);
  const interestKey = getThreadInterestKey(thread);

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
  return normalized
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
