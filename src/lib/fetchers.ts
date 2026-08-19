import { api, isRedirectError } from './api';
import {
  arrayOf,
  bool,
  count,
  dayKey,
  dayKeyOrNull,
  fraction,
  fractionOrNull,
  get,
  isRecord,
  isoOrNull,
  num,
  numOrNull,
  oneOf,
  str,
  strOrNull,
  trimmedOrNull,
} from './guards';
import { addDays, todayDayKey, weekStartKey } from './period';
import { stageConversions } from './metrics';
import type {
  ActivityOverview,
  AdminPost,
  AdminReport,
  AdminReportStatus,
  AdminReportTargetType,
  AdminThreadDetail,
  AdminThreadListItem,
  AdminThreadRequest,
  AdminTransaction,
  AdminUserConversation,
  AdminUserPurchase,
  AdminUserThread,
  AdminUser,
  ChatOverview,
  EngagementActivity,
  EngagementSummary,
  FunnelResponse,
  FunnelStage,
  FunnelStageKey,
  ListingsOverview,
  OverviewStats,
  Paged,
  ReportsOverview,
  SearchGapRow,
  SearchGapTotals,
  SearchGapsResponse,
  ThreadRequestStatus,
  ThreadsOverview,
  TransactionsOverview,
  UserLoginMethod,
  UserLoginsResponse,
  WeeklyCoreKpiKey,
  WeeklyMetricUnit,
  WeeklyMetricValue,
  WeeklyMetricsResponse,
} from './types';

/**
 * Server-side fetchers used by RSC pages. Each talks to the admin endpoint on
 * the NestJS backend. Any failure (auth, network, 5xx) propagates up so the
 * caller sees the real error instead of silently rendering stale data.
 */

/** Turn a filter object into a query string, skipping empty values. */
function qs(params: Record<string, string | number | undefined | null>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  }
  return parts.length ? `?${parts.join('&')}` : '';
}

const DEFAULT_PAGE_SIZE = 15;

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/**
 * List clients call `data.items.map(...)` directly, so a response that isn't
 * exactly `{ items, total, page, pageSize }` used to crash the whole render.
 * Accept the shapes the backend has actually returned (`items`, `data`, or a
 * bare array) and always hand back a well-formed page.
 */
function toPaged<T>(raw: unknown): Paged<T> {
  const src = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const items = Array.isArray(raw)
    ? (raw as T[])
    : Array.isArray(src.items)
      ? (src.items as T[])
      : Array.isArray(src.data)
        ? (src.data as T[])
        : [];

  const pageSize = finiteNumber(src.pageSize, DEFAULT_PAGE_SIZE) || DEFAULT_PAGE_SIZE;
  return {
    items,
    total: finiteNumber(src.total, items.length),
    page: finiteNumber(src.page, 1),
    pageSize,
  };
}

/** Same idea for endpoints typed as a plain array. */
function toArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  const items = (raw as { items?: unknown } | null)?.items;
  return Array.isArray(items) ? (items as T[]) : [];
}

// ── Analytics normalisation ─────────────────────────────────────────────
//
// `api<ChatOverview>()` is a cast, not a check: at runtime the backend can
// (and has) returned a missing `totals`, a null where a number was declared,
// a numeric string from a Prisma Decimal, or a 204 with no body at all —
// which `api()` surfaces as `undefined`. Renderers dereference
// `totals.foo.toLocaleString()` and `activityByDay.map()` directly, so any of
// those is an uncaught TypeError mid-render.
//
// Every analytics payload is therefore rebuilt field by field here. The
// guarantees pages can rely on after this point:
//
//   * `totals` is always an object with every declared key present and finite.
//   * `activityByDay` is always an array, sorted by date ascending, with every
//     value a `string` or `number` (never null/nested — the chart row type is
//     `{ date: string } & Record<string, string | number>`).
//   * Rates are always finite fractions in 0..1, so no renderer prints "NaN%".
//   * `previousTotals` stays *absent* when the backend omitted it. That is a
//     deliberate distinction: undefined means "no comparison available" and
//     the cards hide their delta chip, whereas an all-zero object would claim
//     the previous period genuinely measured nothing.
//
// Per-day key names are load-bearing — the charts pass them to recharts as
// untyped `dataKey` strings, so a rename here fails silently as a flat line.
// Do not rename them without grepping the chart components.

/** Build a date-keyed series: drops undated points, sorts ascending. */
function seriesOf<T extends { date: string }>(
  raw: unknown,
  build: (source: unknown, date: string) => T,
): T[] {
  const points = arrayOf(raw, (item) => {
    const date = dayKeyOrNull(get(item, 'date'));
    return date === null ? null : build(item, date);
  });
  return points.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/**
 * Rebuild `previousTotals` only when the backend actually sent it.
 * See the note above on why absence is preserved rather than zero-filled.
 */
function prevTotalsOf<T>(raw: unknown, build: (source: unknown) => T): T | undefined {
  const prev = get(raw, 'previousTotals');
  return isRecord(prev) ? build(prev) : undefined;
}

function normaliseOverviewStats(raw: unknown): OverviewStats {
  const t = get(raw, 'totals');
  return {
    activityByDay: seriesOf(get(raw, 'activityByDay'), (s, date) => ({
      date,
      listings: count(get(s, 'listings')),
    })),
    totals: {
      users: count(get(t, 'users')),
      verifiedUsers: count(get(t, 'verifiedUsers')),
      activeListings: count(get(t, 'activeListings')),
      openReports: count(get(t, 'openReports')),
      // Optional in the contract and left optional here: it's a proxy metric
      // the backend doesn't always compute, and a card reading "—" is more
      // truthful than one reading "0 sold".
      soldPosts: numOrNull(get(t, 'soldPosts')) ?? undefined,
    },
  };
}

function normaliseEngagementSummary(raw: unknown): EngagementSummary {
  return {
    activeUsers: count(get(raw, 'activeUsers')),
    chatStartedCount: count(get(raw, 'chatStartedCount')),
    messageSentCount: count(get(raw, 'messageSentCount')),
    threadActiveUsers: count(get(raw, 'threadActiveUsers')),
  };
}

function normaliseEngagementActivity(raw: unknown): EngagementActivity {
  return {
    activityByDay: seriesOf(get(raw, 'activityByDay'), (s, date) => ({
      date,
      chats: count(get(s, 'chats')),
      messages: count(get(s, 'messages')),
      threadActivity: count(get(s, 'threadActivity')),
    })),
  };
}

function normaliseChatOverview(raw: unknown): ChatOverview {
  const totalsOf = (src: unknown) => ({
    chatButtonClicks: count(get(src, 'chatButtonClicks')),
    chatStartedCount: count(get(src, 'chatStartedCount')),
    messageSentCount: count(get(src, 'messageSentCount')),
    listingToChatStartRate: fraction(get(src, 'listingToChatStartRate')),
  });
  return {
    totals: totalsOf(get(raw, 'totals')),
    previousTotals: prevTotalsOf(raw, totalsOf),
    activityByDay: seriesOf(get(raw, 'activityByDay'), (s, date) => ({
      date,
      chatButtonClicks: count(get(s, 'chatButtonClicks')),
      chatStarted: count(get(s, 'chatStarted')),
      messagesSent: count(get(s, 'messagesSent')),
    })),
  };
}

function normaliseThreadsOverview(raw: unknown): ThreadsOverview {
  const totalsOf = (src: unknown) => ({
    threadOpenCount: count(get(src, 'threadOpenCount')),
    threadJoinCount: count(get(src, 'threadJoinCount')),
    threadActiveUsers: count(get(src, 'threadActiveUsers')),
  });
  return {
    totals: totalsOf(get(raw, 'totals')),
    previousTotals: prevTotalsOf(raw, totalsOf),
    activityByDay: seriesOf(get(raw, 'activityByDay'), (s, date) => ({
      date,
      threadOpens: count(get(s, 'threadOpens')),
      threadJoins: count(get(s, 'threadJoins')),
      threadActivity: count(get(s, 'threadActivity')),
    })),
  };
}

function normaliseReportsOverview(raw: unknown): ReportsOverview {
  const t = get(raw, 'totals');
  return {
    totals: {
      openReports: count(get(t, 'openReports')),
      reportsCreatedCount: count(get(t, 'reportsCreatedCount')),
      resolvedReportsCount: count(get(t, 'resolvedReportsCount')),
    },
    // `openReports` is a point-in-time backlog, not a period total, so the
    // contract deliberately omits it from the comparison object.
    previousTotals: prevTotalsOf(raw, (src) => ({
      reportsCreatedCount: count(get(src, 'reportsCreatedCount')),
      resolvedReportsCount: count(get(src, 'resolvedReportsCount')),
    })),
    activityByDay: seriesOf(get(raw, 'activityByDay'), (s, date) => ({
      date,
      reportsCreated: count(get(s, 'reportsCreated')),
      reportsResolved: count(get(s, 'reportsResolved')),
    })),
  };
}

function normaliseTransactionsOverview(raw: unknown): TransactionsOverview {
  // Volume and GMV are money: `num`, not `count`, because a period net of
  // refunds can legitimately be negative and clamping that to 0 would
  // overstate revenue.
  const totalsOf = (src: unknown) => ({
    confirmedTransactionCount: count(get(src, 'confirmedTransactionCount')),
    confirmedTransactionVolume: num(get(src, 'confirmedTransactionVolume')),
    gmv: num(get(src, 'gmv')),
  });
  return {
    totals: totalsOf(get(raw, 'totals')),
    previousTotals: prevTotalsOf(raw, totalsOf),
    activityByDay: seriesOf(get(raw, 'activityByDay'), (s, date) => ({
      date,
      confirmedTransactionCount: count(get(s, 'confirmedTransactionCount')),
      confirmedTransactionVolume: num(get(s, 'confirmedTransactionVolume')),
      gmv: num(get(s, 'gmv')),
    })),
  };
}

function normaliseListingsOverview(raw: unknown): ListingsOverview {
  const t = get(raw, 'totals');
  return {
    totals: {
      listingPublishedCount: count(get(t, 'listingPublishedCount')),
      firstListingRate: fraction(get(t, 'firstListingRate')),
      totalListingDetailViews: count(get(t, 'totalListingDetailViews')),
      listingStartedCount: count(get(t, 'listingStartedCount')),
      listingCreateClickedCount: count(get(t, 'listingCreateClickedCount')),
      repeatListingUserCount: count(get(t, 'repeatListingUserCount')),
    },
    previousTotals: prevTotalsOf(raw, (src) => ({
      listingPublishedCount: count(get(src, 'listingPublishedCount')),
      firstListingRate: fraction(get(src, 'firstListingRate')),
      listingStartedCount: count(get(src, 'listingStartedCount')),
      listingCreateClickedCount: count(get(src, 'listingCreateClickedCount')),
      repeatListingUserCount: count(get(src, 'repeatListingUserCount')),
    })),
    activityByDay: seriesOf(get(raw, 'activityByDay'), (s, date) => ({
      date,
      listingStarted: count(get(s, 'listingStarted')),
      listingCreateClicked: count(get(s, 'listingCreateClicked')),
      listings: count(get(s, 'listings')),
      listingsPublished: count(get(s, 'listingsPublished')),
    })),
  };
}

function normaliseActivityOverview(raw: unknown): ActivityOverview {
  const t = get(raw, 'totals');
  return {
    totals: {
      signUpCount: count(get(t, 'signUpCount')),
      verifiedUsers: count(get(t, 'verifiedUsers')),
      weeklyReturningVerifiedUsers: count(get(t, 'weeklyReturningVerifiedUsers')),
      emailVerifiedCount: count(get(t, 'emailVerifiedCount')),
      phoneVerifiedCount: count(get(t, 'phoneVerifiedCount')),
    },
    // Only sign-ups are a period flow; the verified-user counts are running
    // totals and comparing them period-over-period would be meaningless.
    previousTotals: prevTotalsOf(raw, (src) => ({
      signUpCount: count(get(src, 'signUpCount')),
    })),
    activityByDay: seriesOf(get(raw, 'activityByDay'), (s, date) => ({
      date,
      signUps: count(get(s, 'signUps')),
      verifiedUsers: count(get(s, 'verifiedUsers')),
    })),
  };
}

/**
 * Which core KPIs are rates (fractions 0..1) rather than counts. The backend
 * sends `unit` per metric, but it has shipped without it; this is the
 * fallback so a rate never renders as a raw "0.12 users".
 */
const WEEKLY_KPI_UNITS: Record<WeeklyCoreKpiKey, WeeklyMetricUnit> = {
  verifiedUsers: 'count',
  firstListingRate: 'rate',
  publishedListings: 'count',
  chatStartRate: 'rate',
  transactionSignals: 'count',
};

const WEEKLY_KPI_KEYS = Object.keys(WEEKLY_KPI_UNITS) as WeeklyCoreKpiKey[];

function normaliseWeeklyMetrics(raw: unknown): WeeklyMetricsResponse {
  const rawWeek = get(raw, 'week');
  // The client reads all five boundary strings unguarded, so rebuild any the
  // backend left out from whichever anchor we do have.
  const thisWeekStart = dayKeyOrNull(get(rawWeek, 'thisWeekStart')) ?? weekStartKey(todayDayKey());
  const week = {
    thisWeekStart,
    thisWeekEnd: dayKeyOrNull(get(rawWeek, 'thisWeekEnd')) ?? addDays(thisWeekStart, 6),
    lastWeekStart: dayKeyOrNull(get(rawWeek, 'lastWeekStart')) ?? addDays(thisWeekStart, -7),
    lastWeekEnd: dayKeyOrNull(get(rawWeek, 'lastWeekEnd')) ?? addDays(thisWeekStart, -1),
    timezone: str(get(rawWeek, 'timezone'), 'Australia/Sydney'),
  };

  const rawKpis = get(raw, 'coreKpis');
  const coreKpis = {} as Record<WeeklyCoreKpiKey, WeeklyMetricValue>;
  for (const key of WEEKLY_KPI_KEYS) {
    const src = get(rawKpis, key);
    const fallbackUnit = WEEKLY_KPI_UNITS[key];
    const unit: WeeklyMetricUnit =
      get(src, 'unit') === 'rate' ? 'rate' : get(src, 'unit') === 'count' ? 'count' : fallbackUnit;

    // Rates arrive as fractions; counts as plain numbers.
    const read = (field: string) =>
      unit === 'rate' ? fraction(get(src, field)) : num(get(src, field));

    const thisWeek = read('thisWeek');
    const lastWeek = read('lastWeek');
    coreKpis[key] = {
      thisWeek,
      lastWeek,
      // For a rate this difference is in percentage POINTS (still a fraction:
      // 0.02 = 2pp), which is what the weekly client renders as "pp".
      delta: numOrNull(get(src, 'delta')) ?? thisWeek - lastWeek,
      unit,
    };
  }

  return { week, coreKpis };
}

const LOGIN_METHODS: readonly UserLoginMethod[] = ['email', 'phone', 'google', 'unknown'];

function normaliseUserLogins(raw: unknown): UserLoginsResponse {
  const breakdown = get(raw, 'methodBreakdown');
  return {
    dau: count(get(raw, 'dau')),
    wau: count(get(raw, 'wau')),
    mau: count(get(raw, 'mau')),
    loginsLast7d: count(get(raw, 'loginsLast7d')),
    loginsLast30d: count(get(raw, 'loginsLast30d')),
    methodBreakdown: {
      email: count(get(breakdown, 'email')),
      phone: count(get(breakdown, 'phone')),
      google: count(get(breakdown, 'google')),
      unknown: count(get(breakdown, 'unknown')),
    },
    daily: seriesOf(get(raw, 'daily'), (s, date) => ({
      date,
      logins: count(get(s, 'logins')),
      uniqueUsers: count(get(s, 'uniqueUsers')),
    })),
    recentLogins: arrayOf(get(raw, 'recentLogins'), (item) => ({
      userId: str(get(item, 'userId')),
      email: strOrNull(get(item, 'email')),
      phone: strOrNull(get(item, 'phone')),
      // An unrecognised method is bucketed as 'unknown' rather than rendered
      // raw — the column is a label, not a passthrough.
      method: LOGIN_METHODS.includes(get(item, 'method') as UserLoginMethod)
        ? (get(item, 'method') as UserLoginMethod)
        : 'unknown',
      isSignUp: bool(get(item, 'isSignUp')),
      // Empty string rather than a bogus date: `formatDateTime('')` is "—".
      createdAt: isoOrNull(get(item, 'createdAt')) ?? '',
    })),
  };
}

function normaliseFunnel(raw: unknown): FunnelResponse {
  const stages: FunnelStage[] = arrayOf(get(raw, 'stages'), (item) => ({
    // Preserved verbatim rather than snapped to a known enum member: an
    // unrecognised key means the backend added a stage, and relabelling it as
    // an existing one would silently attribute its numbers to the wrong step.
    key: str(get(item, 'key')) as FunnelStageKey,
    label: str(get(item, 'label')),
    count: count(get(item, 'count')),
    prevCount: count(get(item, 'prevCount')),
    conversionFromPrev: fractionOrNull(get(item, 'conversionFromPrev')),
  }));

  // The page tests `conversionFromPrev !== null` before multiplying, so an
  // omitted key would slip through the guard and render "NaN%". Fill any hole
  // from the stage counts we already have, and force stage 1 to an explicit
  // null — it has no predecessor to convert from.
  const derived = stageConversions(stages);
  for (let i = 0; i < stages.length; i += 1) {
    stages[i].conversionFromPrev =
      i === 0 ? null : (stages[i].conversionFromPrev ?? derived[i].fromPrevious);
  }

  return {
    since: dayKey(get(raw, 'since')),
    until: dayKey(get(raw, 'until')),
    stages,
    searchToTradeRate: fraction(get(raw, 'searchToTradeRate')),
  };
}

function searchGapTotals(src: unknown): SearchGapTotals {
  return {
    searches: count(get(src, 'searches')),
    zeroResultSearches: count(get(src, 'zeroResultSearches')),
    zeroResultRate: fraction(get(src, 'zeroResultRate')),
    distinctQueries: count(get(src, 'distinctQueries')),
  };
}

function normaliseSearchGaps(raw: unknown): SearchGapsResponse {
  return {
    since: dayKey(get(raw, 'since')),
    until: dayKey(get(raw, 'until')),
    totals: searchGapTotals(get(raw, 'totals')),
    // Unlike the overview sections, this one is REQUIRED by the contract and
    // the page dereferences it unguarded, so it is always built — never left
    // undefined even when the backend omits it.
    previousTotals: searchGapTotals(get(raw, 'previousTotals')),
    gaps: arrayOf<SearchGapRow>(get(raw, 'gaps'), (item) => ({
      query: str(get(item, 'query')),
      searches: count(get(item, 'searches')),
      zeroResults: count(get(item, 'zeroResults')),
      zeroResultRate: fraction(get(item, 'zeroResultRate')),
      lastSearchedAt: isoOrNull(get(item, 'lastSearchedAt')) ?? '',
    })),
    topQueries: arrayOf(get(raw, 'topQueries'), (item) => ({
      query: str(get(item, 'query')),
      searches: count(get(item, 'searches')),
      // An average, so fractional and `num` rather than `count`.
      avgResults: num(get(item, 'avgResults')),
    })),
  };
}

const THREAD_REQUEST_STATUSES: readonly ThreadRequestStatus[] = [
  'PENDING',
  'APPROVED',
  'REJECTED',
];

/**
 * The thread-request review queue.
 *
 * `arrayOf` handles the envelope (bare array, `{ items }`, or `{ data }`) and
 * a 204/empty body, which previously reached the page's `.map` as
 * `undefined`. Per-item fields are rebuilt too, because this page gates real
 * actions on them rather than just displaying them:
 *
 *   * `status` drives whether the Approve/Reject controls render at all
 *     (`status === 'PENDING'`), so it is upper-cased before matching — a
 *     lowercase `"pending"` from the backend would silently render a pending
 *     request as un-reviewable. An unrecognised value falls back to PENDING:
 *     a request an admin can see and act on beats one that quietly vanishes
 *     from every tab.
 *   * `regionCode` gates the Approve button (`Boolean(request.regionCode)`),
 *     so `strOrNull` collapses `""` to null — an empty string is not a region
 *     and must not enable approval.
 *   * `requester` is always emitted as a well-formed object. The client
 *     already defends with `requester?.displayName || … || 'Unknown
 *     requester'`, which keeps working: an absent requester normalises to
 *     all-null fields and still renders that fallback label.
 *
 * Rows are NOT reordered — the backend's ordering is the queue's ordering.
 */
function normaliseThreadRequests(raw: unknown): AdminThreadRequest[] {
  return arrayOf(raw, (item) => {
    const requester = get(item, 'requester');
    return {
      id: trimmedOrNull(get(item, 'id')) ?? '',
      title: str(get(item, 'title')),
      reason: str(get(item, 'reason')),
      // `trimmedOrNull`, not `strOrNull`: `"   "` is not a region code, and
      // the Approve button is gated on `Boolean(request.regionCode)`.
      regionCode: trimmedOrNull(get(item, 'regionCode')),
      suburbCode: trimmedOrNull(get(item, 'suburbCode')),
      interestKey: trimmedOrNull(get(item, 'interestKey')),
      status: oneOf<ThreadRequestStatus>(
        str(get(item, 'status')).trim().toUpperCase(),
        THREAD_REQUEST_STATUSES,
        'PENDING',
      ),
      // `formatDateTime('')`/`formatRelative('')` render "—", and the empty
      // string is falsy, so the `{request.reviewedAt && …}` block correctly
      // stays hidden for an unreviewed or unparseable timestamp.
      createdAt: isoOrNull(get(item, 'createdAt')) ?? '',
      reviewedAt: isoOrNull(get(item, 'reviewedAt')),
      // A whitespace-only note would otherwise render an empty note block.
      reviewNote: trimmedOrNull(get(item, 'reviewNote')),
      requester: {
        id: trimmedOrNull(get(requester, 'id')) ?? '',
        email: trimmedOrNull(get(requester, 'email')),
        displayName: trimmedOrNull(get(requester, 'displayName')),
      },
    };
  });
}

/**
 * Run a non-critical fetch, degrading to `fallback` when it fails so one dead
 * endpoint doesn't take the page down with it. Auth redirects still propagate.
 */
export async function optional<T>(promise: Promise<T>, fallback: T): Promise<T>;
export async function optional<T>(promise: Promise<T>): Promise<T | null>;
export async function optional<T>(
  promise: Promise<T>,
  fallback: T | null = null,
): Promise<T | null> {
  try {
    return await promise;
  } catch (err) {
    if (isRedirectError(err)) throw err;
    console.error('[fetchers] optional fetch failed:', err);
    return fallback;
  }
}

export const emptyPage = <T>(): Paged<T> => ({
  items: [],
  total: 0,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
});

export type UserFilters = {
  page?: number;
  pageSize?: number;
  name?: string;
  email?: string;
  phone?: string;
  memberId?: string;
  status?: string;
};

export type PostFilters = {
  page?: number;
  pageSize?: number;
  title?: string;
  priceMin?: number;
  priceMax?: number;
  category?: string;
  memberId?: string;
  status?: string;
};

export type TransactionFilters = {
  page?: number;
  pageSize?: number;
  postTitle?: string;
  buyer?: string;
  seller?: string;
  transactionId?: string;
};

export type ReportFilters = {
  page?: number;
  pageSize?: number;
  status?: AdminReportStatus;
  targetType?: AdminReportTargetType;
};

export type ThreadFilters = {
  page?: number;
  pageSize?: number;
  name?: string;
  type?: string;
  regionCode?: string;
  interestKey?: string;
  status?: string;
  minMembers?: number;
  memberId?: string;
};

export type ThreadRequestFilters = {
  status?: string;
};

export type PeriodFilter = {
  from?: string;
  to?: string;
};

// Each analytics fetcher normalises at the boundary, so its declared return
// type is a runtime guarantee rather than a cast. Return types are pinned
// explicitly to keep the promise of a stable shape visible in the signature.

export const getOverview = (period: PeriodFilter = {}): Promise<OverviewStats> =>
  api(`/admin/overview${qs(period)}`).then(normaliseOverviewStats);

export const getEngagementSummary = (period: PeriodFilter = {}): Promise<EngagementSummary> =>
  api(`/admin/engagement/summary${qs(period)}`).then(normaliseEngagementSummary);

export const getEngagementActivity = (period: PeriodFilter = {}): Promise<EngagementActivity> =>
  api(`/admin/engagement/activity${qs(period)}`).then(normaliseEngagementActivity);

export const getChatOverview = (period: PeriodFilter = {}): Promise<ChatOverview> =>
  api(`/admin/chat/overview${qs(period)}`).then(normaliseChatOverview);

export const getThreadsOverview = (period: PeriodFilter = {}): Promise<ThreadsOverview> =>
  api(`/admin/threads/overview${qs(period)}`).then(normaliseThreadsOverview);

export const getReportsOverview = (period: PeriodFilter = {}): Promise<ReportsOverview> =>
  api(`/admin/reports/overview${qs(period)}`).then(normaliseReportsOverview);

export const getTransactionsOverview = (
  period: PeriodFilter = {},
): Promise<TransactionsOverview> =>
  api(`/admin/transactions/overview${qs(period)}`).then(normaliseTransactionsOverview);

export const getListingsOverview = (period: PeriodFilter = {}): Promise<ListingsOverview> =>
  api(`/admin/listings/overview${qs(period)}`).then(normaliseListingsOverview);

export const getActivityOverview = (period: PeriodFilter = {}): Promise<ActivityOverview> =>
  api(`/admin/activity/overview${qs(period)}`).then(normaliseActivityOverview);

export const getWeeklyMetrics = (date?: string): Promise<WeeklyMetricsResponse> =>
  api(`/admin/metrics/weekly${qs({ date })}`).then(normaliseWeeklyMetrics);

export const getUserLogins = (limit?: number): Promise<UserLoginsResponse> =>
  api(`/admin/user-logins${qs({ limit })}`).then(normaliseUserLogins);

export const getFunnel = (period: PeriodFilter = {}): Promise<FunnelResponse> =>
  api(`/admin/funnel${qs(period)}`).then(normaliseFunnel);

export const getSearchGaps = (
  period: PeriodFilter = {},
  limit?: number,
): Promise<SearchGapsResponse> =>
  api(`/admin/search-gaps${qs({ ...period, limit })}`).then(normaliseSearchGaps);

export const getUsers = (filters: UserFilters = {}) =>
  api(`/admin/users${qs({ pageSize: DEFAULT_PAGE_SIZE, ...filters })}`).then(toPaged<AdminUser>);

export const getUser = (id: string) => api<AdminUser>(`/admin/users/${id}`);

export const getUserPosts = (id: string) =>
  api(`/admin/users/${id}/posts`).then(toPaged<AdminPost>);

export const getUserThreads = (id: string) =>
  api(`/admin/users/${id}/threads`).then(toArray<AdminUserThread>);

export const getUserConversations = (id: string) =>
  api(`/admin/users/${id}/conversations`).then(toArray<AdminUserConversation>);

export const getUserPurchases = (id: string) =>
  api(`/admin/users/${id}/purchases?pageSize=${DEFAULT_PAGE_SIZE}`).then(
    toPaged<AdminUserPurchase>,
  );

export const getPosts = (filters: PostFilters = {}) =>
  api(`/admin/posts${qs({ pageSize: DEFAULT_PAGE_SIZE, ...filters })}`).then(toPaged<AdminPost>);

export const getPost = (id: string) => api<AdminPost>(`/admin/posts/${id}`);

export const getTransactions = (filters: TransactionFilters = {}) =>
  api(`/admin/transactions${qs({ pageSize: DEFAULT_PAGE_SIZE, ...filters })}`).then(
    toPaged<AdminTransaction>,
  );

export const getThreads = (filters: ThreadFilters = {}) =>
  api(`/admin/threads${qs({ pageSize: DEFAULT_PAGE_SIZE, ...filters })}`).then(
    toPaged<AdminThreadListItem>,
  );

export const getThread = (id: string) => api<AdminThreadDetail>(`/admin/threads/${id}`);

export const getThreadRequests = (
  filters: ThreadRequestFilters = {},
): Promise<AdminThreadRequest[]> =>
  api(`/admin/thread-requests${qs(filters)}`).then(normaliseThreadRequests);

export const getReports = (filters: ReportFilters = {}) =>
  api(`/admin/reports${qs({ pageSize: DEFAULT_PAGE_SIZE, ...filters })}`).then(
    toPaged<AdminReport>,
  );

export const getReport = (id: string) => api<AdminReport>(`/admin/reports/${id}`);

export const getUserReports = (userId: string): Promise<AdminReport[]> =>
  api(`/admin/users/${userId}/reports`).then(toArray<AdminReport>);
