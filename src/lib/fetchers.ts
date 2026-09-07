import { unstable_rethrow } from 'next/navigation';
import { api, isRedirectError } from './api';
import {
  arrayOf,
  bool,
  boolOrNull,
  count,
  dayKey,
  dayKeyOrNull,
  fraction,
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
import { addDays, isValidDayKey, todayDayKey, weekStartKey } from './period';
import { stageConversions } from './metrics';
import type {
  ActivityOverview,
  AdminPost,
  AdminPurchaseParty,
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
  PostStatus,
  PurchaseStatus,
  ReportsOverview,
  SearchGapRow,
  SearchGapTotals,
  SearchGapsResponse,
  ThreadAdminStatus,
  ThreadRequestStatus,
  ThreadType,
  ThreadsOverview,
  TransactionsOverview,
  UserLoginMethod,
  UserLoginsResponse,
  UserStatus,
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

/**
 * `toPaged` for a list whose *items* also need rebuilding.
 *
 * `toPaged`/`toArray` only ever guarded the envelope. The items went through
 * as raw casts, which is how a `buyer` that turned from a string into an
 * object reached JSX and took down the purchases tab. Every list endpoint now
 * maps its rows through the matching per-item normaliser instead.
 */
function pagedOf<T>(raw: unknown, mapItem: (item: unknown) => T | null): Paged<T> {
  const page = toPaged<unknown>(raw);
  // `total` counts the whole result set, not this page, so it stays exactly as
  // the backend reported it — recomputing it from the rows on screen would
  // break the pager.
  return { ...page, items: arrayOf(page.items, mapItem) };
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

/**
 * The analytics endpoints bucket `activityByDay` by calendar day but send the
 * key as a bare `MM-DD` — the backend slices the year off before responding.
 * Handed to `Date`, V8 reads `"04-30"` as a day in 2001, so every point fell
 * outside the requested window and the charts flat-lined at zero.
 *
 * The year is recovered from the window that was asked for. Two things make
 * that safe for any window, not only short ones:
 *   - the backend emits the series in ascending day order, so each key must
 *     land strictly after the one before it — a repeated `MM-DD` in a
 *     multi-year window is the next year, never the same day twice;
 *   - the backend never returns a future bucket, so a key past today is
 *     always the wrong year.
 * With no window the backend defaulted to a trailing range ending today, so
 * the latest year that fits wins. Full `YYYY-MM-DD` keys (user-logins) pass
 * through untouched.
 */
const MONTH_DAY = /^(\d{2})-(\d{2})$/;

/** Every calendar year the window touches, ascending. */
function candidateYears(period: PeriodFilter): number[] {
  const yearOf = (edge: string | undefined): number | null => {
    const year = Number(edge?.slice(0, 4));
    return Number.isFinite(year) && year > 0 ? year : null;
  };
  const now = new Date().getFullYear();
  const fromYear = yearOf(period.from);
  const toYear = yearOf(period.to);
  const start = fromYear ?? (toYear ?? now) - 1;
  const end = toYear ?? (fromYear === null ? now : Math.max(fromYear, now));
  const years: number[] = [];
  for (let year = Math.min(start, end); year <= Math.max(start, end); year += 1) {
    years.push(year);
  }
  return years;
}

function fullDayKey(value: unknown, period: PeriodFilter, after: string | null): string | null {
  if (typeof value === 'string') {
    const m = MONTH_DAY.exec(value.trim());
    if (m) {
      const [, mo, d] = m;
      const today = todayDayKey();
      // Earliest fit when the window's start is known; latest fit otherwise.
      const years = period.from ? candidateYears(period) : candidateYears(period).reverse();
      for (const year of years) {
        const key = `${year}-${mo}-${d}`;
        if (!isValidDayKey(key)) continue;
        if (after !== null && key <= after) continue;
        if (period.from && key < period.from) continue;
        if (period.to && key > period.to) continue;
        if (key > today) continue;
        return key;
      }
      return null;
    }
  }
  return dayKeyOrNull(value);
}

/**
 * Build a date-keyed series: drops undated points, sorts ascending. `period`
 * is the window the caller requested, used to pin the year on bare `MM-DD`
 * keys (see `fullDayKey`); the cursor keeps those keys monotonic.
 */
function seriesOf<T extends { date: string }>(
  raw: unknown,
  period: PeriodFilter,
  build: (source: unknown, date: string) => T,
): T[] {
  let after: string | null = null;
  const points = arrayOf(raw, (item) => {
    const date = fullDayKey(get(item, 'date'), period, after);
    if (date === null) return null;
    if (after === null || date > after) after = date;
    return build(item, date);
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

function normaliseOverviewStats(raw: unknown, period: PeriodFilter = {}): OverviewStats {
  const t = get(raw, 'totals');
  return {
    activityByDay: seriesOf(get(raw, 'activityByDay'), period, (s, date) => ({
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
      revenue: numOrNull(get(t, 'revenue')) ?? undefined,
    },
  };
}

function normaliseEngagementSummary(raw: unknown): EngagementSummary {
  return {
    activeUsers: count(get(raw, 'activeUsers')),
    chatStartedCount: count(get(raw, 'chatStartedCount')),
    messageSentCount: count(get(raw, 'messageSentCount')),
    threadActiveUsers: count(get(raw, 'threadActiveUsers')),
    previousTotals: prevTotalsOf(raw, (src) => ({
      chatStartedCount: count(get(src, 'chatStartedCount')),
      messageSentCount: count(get(src, 'messageSentCount')),
      threadActiveUsers: count(get(src, 'threadActiveUsers')),
    })),
  };
}

function normaliseEngagementActivity(raw: unknown, period: PeriodFilter = {}): EngagementActivity {
  return {
    activityByDay: seriesOf(get(raw, 'activityByDay'), period, (s, date) => ({
      date,
      chats: count(get(s, 'chats')),
      messages: count(get(s, 'messages')),
      threadActivity: count(get(s, 'threadActivity')),
    })),
  };
}

function normaliseChatOverview(raw: unknown, period: PeriodFilter = {}): ChatOverview {
  const totalsOf = (src: unknown) => ({
    chatButtonClicks: count(get(src, 'chatButtonClicks')),
    chatStartedCount: count(get(src, 'chatStartedCount')),
    messageSentCount: count(get(src, 'messageSentCount')),
    listingToChatStartRate: fraction(get(src, 'listingToChatStartRate')),
  });
  return {
    totals: totalsOf(get(raw, 'totals')),
    previousTotals: prevTotalsOf(raw, totalsOf),
    activityByDay: seriesOf(get(raw, 'activityByDay'), period, (s, date) => ({
      date,
      chatButtonClicks: count(get(s, 'chatButtonClicks')),
      chatStarted: count(get(s, 'chatStarted')),
      messagesSent: count(get(s, 'messagesSent')),
    })),
  };
}

function normaliseThreadsOverview(raw: unknown, period: PeriodFilter = {}): ThreadsOverview {
  const totalsOf = (src: unknown) => ({
    threadOpenCount: count(get(src, 'threadOpenCount')),
    threadJoinCount: count(get(src, 'threadJoinCount')),
    threadActiveUsers: count(get(src, 'threadActiveUsers')),
  });
  return {
    totals: totalsOf(get(raw, 'totals')),
    previousTotals: prevTotalsOf(raw, totalsOf),
    activityByDay: seriesOf(get(raw, 'activityByDay'), period, (s, date) => ({
      date,
      threadOpens: count(get(s, 'threadOpens')),
      threadJoins: count(get(s, 'threadJoins')),
      threadActivity: count(get(s, 'threadActivity')),
    })),
  };
}

function normaliseReportsOverview(raw: unknown, period: PeriodFilter = {}): ReportsOverview {
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
    activityByDay: seriesOf(get(raw, 'activityByDay'), period, (s, date) => ({
      date,
      reportsCreated: count(get(s, 'reportsCreated')),
      reportsResolved: count(get(s, 'reportsResolved')),
    })),
  };
}

function normaliseTransactionsOverview(raw: unknown, period: PeriodFilter = {}): TransactionsOverview {
  // Money stays `num` rather than `count`: both figures are plain sums of
  // accepted offer amounts (nothing in the product moves or refunds money),
  // and a sum should never be silently rounded to a whole number.
  const totalsOf = (src: unknown) => ({
    confirmedTransactionCount: count(get(src, 'confirmedTransactionCount')),
    confirmedTransactionVolume: num(get(src, 'confirmedTransactionVolume')),
    // The wire name is `acceptedOfferGmv`; the old `gmv` key never existed on
    // this endpoint, which is why the card used to read $0 forever.
    acceptedOfferGmv: num(get(src, 'acceptedOfferGmv')),
  });
  return {
    totals: totalsOf(get(raw, 'totals')),
    previousTotals: prevTotalsOf(raw, totalsOf),
    activityByDay: seriesOf(get(raw, 'activityByDay'), period, (s, date) => ({
      date,
      confirmedTransactionCount: count(get(s, 'confirmedTransactionCount')),
      confirmedTransactionVolume: num(get(s, 'confirmedTransactionVolume')),
      acceptedOfferGmv: num(get(s, 'acceptedOfferGmv')),
    })),
  };
}

function normaliseListingsOverview(raw: unknown, period: PeriodFilter = {}): ListingsOverview {
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
    activityByDay: seriesOf(get(raw, 'activityByDay'), period, (s, date) => ({
      date,
      listingStarted: count(get(s, 'listingStarted')),
      listingCreateClicked: count(get(s, 'listingCreateClicked')),
      listings: count(get(s, 'listings')),
      listingsPublished: count(get(s, 'listingsPublished')),
    })),
  };
}

function normaliseActivityOverview(raw: unknown, period: PeriodFilter = {}): ActivityOverview {
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
    activityByDay: seriesOf(get(raw, 'activityByDay'), period, (s, date) => ({
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

function normaliseUserLogins(raw: unknown, period: PeriodFilter = {}): UserLoginsResponse {
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
    daily: seriesOf(get(raw, 'daily'), period, (s, date) => ({
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

/** A ratio that may legitimately exceed 1; only negatives are rejected. */
function rateOrNull(value: unknown): number | null {
  const n = numOrNull(value);
  return n === null ? null : Math.max(n, 0);
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
    // Not clamped: stages are period totals counted independently, so a
    // stage can legitimately exceed the one before it and read above 100%.
    conversionFromPrev: rateOrNull(get(item, 'conversionFromPrev')),
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
    // Trades come from a table with full history, searches from an event
    // that only exists since instrumentation — early windows can exceed 1.
    searchToTradeRate: rateOrNull(get(raw, 'searchToTradeRate')) ?? 0,
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

// ── Record normalisation ────────────────────────────────────────────────
//
// Same argument as the analytics block above, for the CRUD surface. These
// endpoints were bare `api<T>()` casts: `toPaged`/`toArray` rebuilt the
// envelope and let the rows through untouched, so every component
// dereferenced backend fields on faith. That is exactly how a `buyer` field
// that turned from `string` into `{ id, name, email }` reached JSX and threw
// "Objects are not valid as a React child", taking down the whole tab.
//
// The contract each mapper keeps, so components can stop guarding:
//
//   * Required strings are always strings (missing becomes `''`, which every
//     formatter already renders as "—" and every `||` fallback catches).
//   * Required numbers are always finite.
//   * Optional fields are `null` when absent — never `undefined` mid-render.
//   * Unions are snapped to a known member, so `StatusBadge.toLowerCase()`
//     and `<select value=…>` can't be handed something unrenderable.
//   * Unknown extra keys are ignored rather than spread through.
//
// A row with no usable `id` returns `null` and is dropped: it cannot be keyed,
// linked to, or acted on, and one unusable row should not cost the page.

const USER_STATUSES: readonly UserStatus[] = [
  'active',
  'suspended',
  'deleted',
  'pending_profile',
  'pending_deletion',
  'banned',
];

const POST_STATUSES: readonly PostStatus[] = [
  'draft',
  'published',
  'sold',
  'paused',
  'archived',
  'deleted',
];

const PURCHASE_STATUSES: readonly PurchaseStatus[] = ['pending', 'completed', 'cancelled'];

const THREAD_ADMIN_STATUSES: readonly ThreadAdminStatus[] = [
  'active',
  'flagged',
  'archived',
  'hidden',
];


const REPORT_STATUSES: readonly AdminReportStatus[] = ['open', 'resolved'];

/** Ids arrive as strings (the BigInt interceptor stringifies them) but a raw
 *  numeric id has slipped through before, and `''` is not an id. */
function idOrNull(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return trimmedOrNull(value);
}

/**
 * The backend folds `SUBURB_INTEREST` into `interest` and lower-cases both
 * values before responding. Mirror that fold rather than falling back blindly,
 * so a raw DB enum leaking through still lands on the right side.
 */
function threadType(value: unknown): ThreadType {
  const raw = str(value).trim().toUpperCase().replace(/-/g, '_');
  return raw === 'SUBURB' ? 'suburb' : 'interest';
}

function normaliseUser(raw: unknown): AdminUser | null {
  const id = idOrNull(get(raw, 'id'));
  if (!id) return null;
  return {
    id,
    // The backend already defaults this to `user_${id}`; the empty string is
    // the last resort, and every caller has an "Unnamed account" fallback.
    name: str(get(raw, 'name')),
    email: strOrNull(get(raw, 'email')),
    phone: strOrNull(get(raw, 'phone')),
    createdAt: isoOrNull(get(raw, 'createdAt')) ?? '',
    lastActiveAt: isoOrNull(get(raw, 'lastActiveAt')),
    status: oneOf<UserStatus>(get(raw, 'status'), USER_STATUSES, 'active'),
    postsCount: count(get(raw, 'postsCount')),
    reportsCount: count(get(raw, 'reportsCount')),
    avatarUrl: strOrNull(get(raw, 'avatarUrl')),
    nationality: trimmedOrNull(get(raw, 'nationality')),
    suburb: trimmedOrNull(get(raw, 'suburb')),
    stateCode: trimmedOrNull(get(raw, 'stateCode')),
    emailVerified: bool(get(raw, 'emailVerified')),
    phoneVerified: bool(get(raw, 'phoneVerified')),
    // Tri-state on purpose: `null` means the profile has no suburb at all,
    // which the checklist renders differently from "has one, not verified".
    suburbVerified: boolOrNull(get(raw, 'suburbVerified')),
    signUpAt: isoOrNull(get(raw, 'signUpAt')),
    signInAt: isoOrNull(get(raw, 'signInAt')),
    totalPurchases: numOrNull(get(raw, 'totalPurchases')),
    totalSales: numOrNull(get(raw, 'totalSales')),
  };
}

function normalisePost(raw: unknown): AdminPost | null {
  const id = idOrNull(get(raw, 'id'));
  if (!id) return null;

  const rawSeller = get(raw, 'seller');
  const sellerId = idOrNull(get(rawSeller, 'id'));

  return {
    id,
    title: str(get(raw, 'title')),
    description: strOrNull(get(raw, 'description')),
    // Whole AUD, and legitimately fractional — `num`, not `count`.
    price: num(get(raw, 'price')),
    currency: str(get(raw, 'currency'), 'AUD'),
    category: str(get(raw, 'category')),
    condition: str(get(raw, 'condition')),
    status: oneOf<PostStatus>(get(raw, 'status'), POST_STATUSES, 'draft'),
    // An anonymised account drops the seller entirely, so `null` is a real
    // answer here — a half-built `{ id: '', name: '' }` would link to
    // `/users/` and read as a live account.
    seller: sellerId ? { id: sellerId, name: str(get(rawSeller, 'name')) } : null,
    createdAt: isoOrNull(get(raw, 'createdAt')) ?? '',
    // The list caps this at one photo; the detail endpoint sends all of them.
    photos: arrayOf(get(raw, 'photos'), (photo) => trimmedOrNull(photo)),
    reportsCount: count(get(raw, 'reportsCount')),
  };
}

function normaliseTransaction(raw: unknown): AdminTransaction | null {
  const id = idOrNull(get(raw, 'id'));
  if (!id) return null;
  return {
    id,
    postId: str(get(raw, 'postId')),
    postTitle: str(get(raw, 'postTitle')),
    // Already flattened to a display string by this endpoint — but if it ever
    // starts sending the party object its sibling sends, take the name out of
    // it rather than handing an object to JSX.
    buyer: partyLabel(get(raw, 'buyer')),
    seller: partyLabel(get(raw, 'seller')),
    amount: num(get(raw, 'amount')),
    currency: str(get(raw, 'currency'), 'AUD'),
    status: oneOf<PurchaseStatus>(get(raw, 'status'), PURCHASE_STATUSES, 'pending'),
    createdAt: isoOrNull(get(raw, 'createdAt')) ?? '',
    completedAt: isoOrNull(get(raw, 'completedAt')),
    cancelledAt: isoOrNull(get(raw, 'cancelledAt')),
  };
}

/** A party as a plain label, whichever of the two wire shapes arrived. */
function partyLabel(value: unknown): string {
  if (typeof value === 'string') return value;
  return str(get(value, 'name')) || str(get(value, 'email')) || str(get(value, 'id'));
}

/**
 * A purchase counterparty.
 *
 * `/admin/users/:id/purchases` sends `{ id, name, email }` while
 * `/admin/transactions` sends a display string for the same concept. Accept
 * either — an older backend must not be able to crash the tab — and always
 * hand the component an object it can render a name and a link from.
 */
function purchaseParty(value: unknown): AdminPurchaseParty | null {
  if (typeof value === 'string') {
    const label = value.trim();
    return label ? { id: '', name: label, email: null } : null;
  }
  const id = idOrNull(get(value, 'id')) ?? '';
  const name = trimmedOrNull(get(value, 'name'));
  const email = trimmedOrNull(get(value, 'email'));
  if (!id && !name && !email) return null;
  return { id, name, email };
}

function normalisePurchase(raw: unknown): AdminUserPurchase | null {
  const id = idOrNull(get(raw, 'id'));
  if (!id) return null;
  const createdAt = isoOrNull(get(raw, 'createdAt')) ?? '';
  return {
    id,
    postId: str(get(raw, 'postId')),
    // Unlike `/admin/posts`, this endpoint sends the raw title with no
    // fallback, so it really can be null.
    postTitle: str(get(raw, 'postTitle')),
    category: trimmedOrNull(get(raw, 'category')),
    buyer: purchaseParty(get(raw, 'buyer')),
    seller: purchaseParty(get(raw, 'seller')),
    amount: num(get(raw, 'amount')),
    currency: str(get(raw, 'currency'), 'AUD'),
    status: oneOf<PurchaseStatus>(get(raw, 'status'), PURCHASE_STATUSES, 'pending'),
    date: isoOrNull(get(raw, 'date')) ?? createdAt,
    createdAt,
    completedAt: isoOrNull(get(raw, 'completedAt')),
    cancelledAt: isoOrNull(get(raw, 'cancelledAt')),
    sourceType: trimmedOrNull(get(raw, 'sourceType')),
    offerId: idOrNull(get(raw, 'offerId')),
    appointmentId: idOrNull(get(raw, 'appointmentId')),
  };
}

/**
 * The three region/interest codes.
 *
 * No admin thread endpoint sends them today, so these read `null` on every
 * row. They are still normalised (rather than dropped) because the views treat
 * "absent" as unknown and light up the moment the backend selects the columns.
 */
function threadCodes(raw: unknown) {
  return {
    regionCode: trimmedOrNull(get(raw, 'regionCode')),
    suburbCode: trimmedOrNull(get(raw, 'suburbCode')),
    interestKey: trimmedOrNull(get(raw, 'interestKey')),
  };
}

function normaliseThreadListItem(raw: unknown): AdminThreadListItem | null {
  const id = idOrNull(get(raw, 'id'));
  if (!id) return null;
  return {
    id,
    name: str(get(raw, 'name')),
    type: threadType(get(raw, 'type')),
    ...threadCodes(raw),
    memberCount: count(get(raw, 'memberCount')),
    messageCount: count(get(raw, 'messageCount')),
    createdAt: isoOrNull(get(raw, 'createdAt')) ?? '',
    status: oneOf<ThreadAdminStatus>(get(raw, 'status'), THREAD_ADMIN_STATUSES, 'active'),
  };
}

function normaliseThreadDetail(raw: unknown): AdminThreadDetail | null {
  const base = normaliseThreadListItem(raw);
  if (!base) return null;
  return {
    ...base,
    description: strOrNull(get(raw, 'description')),
    slug: trimmedOrNull(get(raw, 'slug')),
    lastActiveAt: isoOrNull(get(raw, 'lastActiveAt')),
    // Not sent by any admin thread endpoint today (`threads.icon_url` is never
    // mapped in), so the hero image is simply skipped.
    coverImage: trimmedOrNull(get(raw, 'coverImage')),
  };
}

/**
 * Normalise a single record fetched by id.
 *
 * The list normalisers drop a row with no usable id — it can't be keyed or
 * linked to, and one bad row shouldn't cost the page. A detail endpoint has no
 * such option: a record with an empty name still beats an error boundary. So a
 * payload the mapper rejects is retried with the id that was requested, which
 * is by definition usable, and the second call therefore always succeeds.
 */
function detailOf<T>(raw: unknown, id: string, mapItem: (item: unknown) => T | null): T {
  const mapped = mapItem(raw);
  if (mapped) return mapped;
  return mapItem({ ...(isRecord(raw) ? raw : {}), id }) as T;
}

function normaliseUserThread(raw: unknown): AdminUserThread | null {
  const id = idOrNull(get(raw, 'id'));
  if (!id) return null;
  return {
    id,
    name: str(get(raw, 'name')),
    type: threadType(get(raw, 'type')),
    ...threadCodes(raw),
    memberCount: count(get(raw, 'memberCount')),
    lastActiveAt: isoOrNull(get(raw, 'lastActiveAt')),
    createdAt: isoOrNull(get(raw, 'createdAt')) ?? '',
  };
}

function normaliseUserConversation(raw: unknown): AdminUserConversation | null {
  const id = idOrNull(get(raw, 'id'));
  if (!id) return null;

  const rawPost = get(raw, 'post');
  const postId = idOrNull(get(rawPost, 'id'));
  const rawPartner = get(raw, 'partner');

  return {
    id,
    partner: {
      id: idOrNull(get(rawPartner, 'id')) ?? '',
      displayName: str(get(rawPartner, 'displayName')),
      avatarUrl: strOrNull(get(rawPartner, 'avatarUrl')),
    },
    lastMessageSnippet: strOrNull(get(raw, 'lastMessageSnippet')),
    lastMessageAt: isoOrNull(get(raw, 'lastMessageAt')),
    post: postId
      ? {
          id: postId,
          title: str(get(rawPost, 'title')),
          thumbnailUrl: strOrNull(get(rawPost, 'thumbnailUrl')),
          // The one CENTS-valued field on the whole admin surface; the
          // component divides by 100 itself, so `null` must survive as null
          // rather than becoming a confident $0.00.
          priceCents: numOrNull(get(rawPost, 'priceCents')),
          isPriceNegotiable: bool(get(rawPost, 'isPriceNegotiable')),
          status: str(get(rawPost, 'status')),
        }
      : null,
  };
}

function normaliseReport(raw: unknown): AdminReport | null {
  const id = idOrNull(get(raw, 'id'));
  if (!id) return null;
  return {
    id,
    // Preserved verbatim rather than snapped to a known member. `targetType`
    // drives both the chip label and the target link, so relabelling an
    // unrecognised surface as 'post' would send an admin to
    // `/listings/<a message id>`. `targetMeta` humanises whatever it is given
    // and `targetHref` is a lookup, so an unknown value reads as itself and
    // simply has no destination.
    targetType: str(get(raw, 'targetType')) as AdminReportTargetType,
    targetId: str(get(raw, 'targetId')),
    targetTitle: strOrNull(get(raw, 'targetTitle')),
    reporterId: str(get(raw, 'reporterId')),
    reporterName: str(get(raw, 'reporterName')),
    reason: str(get(raw, 'reason')),
    details: strOrNull(get(raw, 'details')),
    status: oneOf<AdminReportStatus>(get(raw, 'status'), REPORT_STATUSES, 'open'),
    createdAt: isoOrNull(get(raw, 'createdAt')) ?? '',
  };
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
    // Next signals redirects, notFound and "this route must render
    // dynamically" by throwing. Swallowing those would bake the fallback into
    // a static page at build time, so they always pass through.
    unstable_rethrow(err);
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
  /** `all | pending | completed | cancelled`. Anything else returns an empty
   *  page rather than a 400 — the DTO takes a free-form string here. */
  status?: string;
};

export type ReportFilters = {
  page?: number;
  pageSize?: number;
  status?: AdminReportStatus;
  targetType?: AdminReportTargetType;
};

/**
 * `AdminThreadsQueryDto` declares exactly these keys. The backend runs a global
 * `ValidationPipe({ forbidNonWhitelisted: true })`, so an undeclared param is a
 * `400 property X should not exist`, not a silently ignored filter — which is
 * what `regionCode` and `interestKey` used to do to this page.
 */
export type ThreadFilters = {
  page?: number;
  pageSize?: number;
  name?: string;
  type?: string;
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
  api(`/admin/overview${qs(period)}`).then((raw) => normaliseOverviewStats(raw, period));

export const getEngagementSummary = (period: PeriodFilter = {}): Promise<EngagementSummary> =>
  api(`/admin/engagement/summary${qs(period)}`).then(normaliseEngagementSummary);

export const getEngagementActivity = (period: PeriodFilter = {}): Promise<EngagementActivity> =>
  api(`/admin/engagement/activity${qs(period)}`).then((raw) => normaliseEngagementActivity(raw, period));

export const getChatOverview = (period: PeriodFilter = {}): Promise<ChatOverview> =>
  api(`/admin/chat/overview${qs(period)}`).then((raw) => normaliseChatOverview(raw, period));

export const getThreadsOverview = (period: PeriodFilter = {}): Promise<ThreadsOverview> =>
  api(`/admin/threads/overview${qs(period)}`).then((raw) => normaliseThreadsOverview(raw, period));

export const getReportsOverview = (period: PeriodFilter = {}): Promise<ReportsOverview> =>
  api(`/admin/reports/overview${qs(period)}`).then((raw) => normaliseReportsOverview(raw, period));

export const getTransactionsOverview = (
  period: PeriodFilter = {},
): Promise<TransactionsOverview> =>
  api(`/admin/transactions/overview${qs(period)}`).then((raw) => normaliseTransactionsOverview(raw, period));

export const getListingsOverview = (period: PeriodFilter = {}): Promise<ListingsOverview> =>
  api(`/admin/listings/overview${qs(period)}`).then((raw) => normaliseListingsOverview(raw, period));

export const getActivityOverview = (period: PeriodFilter = {}): Promise<ActivityOverview> =>
  api(`/admin/activity/overview${qs(period)}`).then((raw) => normaliseActivityOverview(raw, period));

export const getWeeklyMetrics = (date?: string): Promise<WeeklyMetricsResponse> =>
  api(`/admin/metrics/weekly${qs({ date })}`).then(normaliseWeeklyMetrics);

export const getUserLogins = (limit?: number): Promise<UserLoginsResponse> =>
  api(`/admin/user-logins${qs({ limit })}`).then((raw) => normaliseUserLogins(raw));

export const getFunnel = (period: PeriodFilter = {}): Promise<FunnelResponse> =>
  api(`/admin/funnel${qs(period)}`).then(normaliseFunnel);

export const getSearchGaps = (
  period: PeriodFilter = {},
  limit?: number,
): Promise<SearchGapsResponse> =>
  api(`/admin/search-gaps${qs({ ...period, limit })}`).then(normaliseSearchGaps);

export const getUsers = (filters: UserFilters = {}): Promise<Paged<AdminUser>> =>
  api(`/admin/users${qs({ pageSize: DEFAULT_PAGE_SIZE, ...filters })}`).then((raw) =>
    pagedOf(raw, normaliseUser),
  );

export const getUser = (id: string): Promise<AdminUser> =>
  api(`/admin/users/${id}`).then((raw) => detailOf(raw, id, normaliseUser));

export const getUserPosts = (id: string): Promise<Paged<AdminPost>> =>
  api(`/admin/users/${id}/posts`).then((raw) => pagedOf(raw, normalisePost));

export const getUserThreads = (id: string): Promise<AdminUserThread[]> =>
  api(`/admin/users/${id}/threads`).then((raw) => arrayOf(raw, normaliseUserThread));

export const getUserConversations = (id: string): Promise<AdminUserConversation[]> =>
  api(`/admin/users/${id}/conversations`).then((raw) =>
    arrayOf(raw, normaliseUserConversation),
  );

export const getUserPurchases = (id: string): Promise<Paged<AdminUserPurchase>> =>
  api(`/admin/users/${id}/purchases?pageSize=${DEFAULT_PAGE_SIZE}`).then((raw) =>
    pagedOf(raw, normalisePurchase),
  );

export const getPosts = (filters: PostFilters = {}): Promise<Paged<AdminPost>> =>
  api(`/admin/posts${qs({ pageSize: DEFAULT_PAGE_SIZE, ...filters })}`).then((raw) =>
    pagedOf(raw, normalisePost),
  );

export const getPost = (id: string): Promise<AdminPost> =>
  api(`/admin/posts/${id}`).then((raw) => detailOf(raw, id, normalisePost));

export const getTransactions = (
  filters: TransactionFilters = {},
): Promise<Paged<AdminTransaction>> =>
  api(`/admin/transactions${qs({ pageSize: DEFAULT_PAGE_SIZE, ...filters })}`).then((raw) =>
    pagedOf(raw, normaliseTransaction),
  );

export const getThreads = (filters: ThreadFilters = {}): Promise<Paged<AdminThreadListItem>> =>
  api(`/admin/threads${qs({ pageSize: DEFAULT_PAGE_SIZE, ...filters })}`).then((raw) =>
    pagedOf(raw, normaliseThreadListItem),
  );

export const getThread = (id: string): Promise<AdminThreadDetail> =>
  api(`/admin/threads/${id}`).then((raw) => detailOf(raw, id, normaliseThreadDetail));

export const getThreadRequests = (
  filters: ThreadRequestFilters = {},
): Promise<AdminThreadRequest[]> =>
  api(`/admin/thread-requests${qs(filters)}`).then(normaliseThreadRequests);

export const getReports = (filters: ReportFilters = {}): Promise<Paged<AdminReport>> =>
  api(`/admin/reports${qs({ pageSize: DEFAULT_PAGE_SIZE, ...filters })}`).then((raw) =>
    pagedOf(raw, normaliseReport),
  );

export const getReport = (id: string): Promise<AdminReport> =>
  api(`/admin/reports/${id}`).then((raw) => detailOf(raw, id, normaliseReport));

export const getUserReports = (userId: string): Promise<AdminReport[]> =>
  api(`/admin/users/${userId}/reports`).then((raw) => arrayOf(raw, normaliseReport));
