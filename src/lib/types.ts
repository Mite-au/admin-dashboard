// Mirror the Prisma schema for types used across the dashboard.
export type PostStatus = 'draft' | 'published' | 'sold' | 'paused' | 'archived' | 'deleted';
export type ThreadAdminStatus = 'active' | 'flagged' | 'archived' | 'hidden';
export type ThreadType =
  | 'suburb'
  | 'interest'
  | 'suburb_interest'
  | 'SUBURB'
  | 'INTEREST'
  | 'SUBURB_INTEREST';
export type ThreadRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type AdminReportStatus = 'open' | 'resolved';
export type AdminReportTargetType = 'post' | 'user';
/**
 * Real DB enum values from `users.status`, plus the synthetic `'banned'`
 * which the backend returns when `user_penalties.active = true`.
 */
export type UserStatus = 'active' | 'suspended' | 'deleted' | 'pending_profile' | 'banned';

export interface AdminUser {
  id: string;
  name: string;
  email: string | null;
  phone?: string | null;
  createdAt: string;
  /** Set via a throttled middleware on authenticated requests. Null until first request. */
  lastActiveAt?: string | null;
  status: UserStatus;
  postsCount: number;
  reportsCount: number;
  avatarUrl?: string | null;
  /** ISO 3166-1 alpha-2 country code (e.g. "AU", "KR"). Frontend renders it to a name. */
  nationality?: string | null;
  /** Suburb label. */
  suburb?: string | null;
  stateCode?: string | null;
  /** Whether phone/email have been verified. */
  emailVerified?: boolean;
  phoneVerified?: boolean;
  /** True if suburb has been admin-verified; null if there's no suburb at all. */
  suburbVerified?: boolean | null;
  /** ISO dates. signInAt = users.last_sign_in_at, lastActiveAt = users.last_active_at. */
  signUpAt?: string | null;
  signInAt?: string | null;
  /** Totals in whole units of `currency` (AUD), not cents. */
  totalPurchases?: number | null;
  totalSales?: number | null;
}

/**
 * Outcome of a mutation Server Action that reports failure by returning
 * rather than throwing.
 *
 * Next.js replaces any error thrown out of a Server Action with an opaque
 * digest in a production build, so the backend's message — the part an admin
 * can actually act on ("user has no phone number on file") — never reaches
 * the client. A returned value crosses that boundary intact.
 *
 * Lives here rather than in `actions.ts` because a `'use server'` module may
 * only export async functions. `export type` is erased before that check
 * runs, but keeping the type out of there entirely removes the question.
 */
export type ActionResult = { ok: true } | { ok: false; error: string };

/** Response of PATCH /admin/users/:id/contact-verification. */
export interface ContactVerificationResult {
  id: string;
  email: string | null;
  phone: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
}

export interface AdminPostSeller {
  id: string;
  name: string;
}

export interface AdminPost {
  id: string;
  title: string;
  description?: string | null;
  price: number;
  currency: string;
  category: string;
  condition: string;
  status: PostStatus;
  /**
   * Absent for anonymised accounts — the backend drops the seller rather than
   * returning a tombstone, so a listing can outlive the account that posted
   * it. Both wire forms occur (the key omitted entirely, or an explicit
   * `null`), hence optional AND nullable: a DTO mapper that assigns
   * `undefined` loses the key to `JSON.stringify`, while a Prisma relation
   * that came back empty serialises as `null`.
   *
   * Reach for `post.seller?.id` — it handles both, and this used to be typed
   * as required, which is how `ListingActionsCard` ended up dereferencing it
   * straight into a crash.
   */
  seller?: AdminPostSeller | null;
  createdAt: string;
  photos: string[];
  reportsCount: number;
}

export interface AdminTransaction {
  id: string;
  postId: string;
  postTitle: string;
  buyer: string;
  seller: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'cancelled' | 'disputed' | 'refunded';
  createdAt: string;
  completedAt?: string | null;
  cancelledAt?: string | null;
}

export interface AdminUserPurchase {
  id: string;
  postId: string;
  postTitle: string;
  category: string | null;
  buyer: string;
  seller: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'cancelled' | 'disputed' | 'refunded';
  date: string;
  createdAt: string;
  completedAt?: string | null;
  cancelledAt?: string | null;
  sourceType?: string | null;
  offerId?: string | null;
  appointmentId?: string | null;
}

export interface AdminThreadListItem {
  id: string;
  name: string;
  type: ThreadType;
  regionCode?: string | null;
  region_code?: string | null;
  suburbCode?: string | null;
  suburb_code?: string | null;
  interestKey?: string | null;
  interest_key?: string | null;
  memberCount: number;
  messageCount: number;
  createdAt: string;
  /** Admin status, backed by `threads.admin_status`. */
  status: ThreadAdminStatus;
}

export interface AdminThreadDetail extends AdminThreadListItem {
  description?: string | null;
  slug?: string | null;
  lastActiveAt?: string | null;
  coverImage?: string | null;
  cover_image?: string | null;
}

export interface AdminUserThread {
  id: string;
  name: string;
  type: ThreadType;
  regionCode?: string | null;
  region_code?: string | null;
  suburbCode?: string | null;
  suburb_code?: string | null;
  interestKey?: string | null;
  interest_key?: string | null;
  memberCount: number;
  lastActiveAt: string | null;
  createdAt: string;
}

export interface ConsumerThreadDto {
  id: string;
  type: string;
  regionCode: string | null;
  interestKey: string | null;
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  isJoined: boolean;
  createdAt: string;
  memberCount: number;
  lastActiveAt: string | null;
  coverImage: string | null;
}

export interface AdminThreadRequest {
  id: string;
  title: string;
  reason: string;
  regionCode: string | null;
  suburbCode?: string | null;
  interestKey: string | null;
  status: ThreadRequestStatus;
  createdAt: string;
  reviewedAt?: string | null;
  reviewNote?: string | null;
  requester: {
    id: string;
    email: string | null;
    displayName: string | null;
  };
}

export interface AdminThreadRequestReviewResult {
  id: string;
  status: ThreadRequestStatus;
  reviewedAt: string | null;
  reviewNote: string | null;
  createdThreadIds?: string[];
}

export interface AdminUserConversationPartner {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface AdminUserConversationPost {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  priceCents: number | null;
  isPriceNegotiable: boolean;
  status: string;
}

export interface AdminUserConversation {
  id: string;
  partner: AdminUserConversationPartner;
  lastMessageSnippet: string | null;
  lastMessageAt: string | null;
  post?: AdminUserConversationPost | null;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminReport {
  id: string;
  targetType: AdminReportTargetType;
  targetId: string;
  targetTitle: string | null;
  reporterId: string;
  reporterName: string;
  reason: string;
  details: string | null;
  status: AdminReportStatus;
  createdAt: string;
}

// ── Analytics payloads ──────────────────────────────────────────────────
//
// Unit convention, enforced by the normalisers in `fetchers.ts`: every field
// named `*Rate` is a FRACTION in 0..1 (`0.124` = 12.4%). Only formatters
// multiply by 100. Every `*Count` / `*Users` field is a whole non-negative
// number; money fields (`gmv`, `*Volume`) are in whole AUD, not cents, and
// may be negative once refunds are netted off.
//
// `previousTotals` is optional on the section payloads and stays absent when
// the backend didn't send a comparison — undefined means "no comparison
// available" (hide the delta chip), which is not the same claim as an
// all-zero previous period. `SearchGapsResponse.previousTotals` is the one
// exception: it is required and always populated.
//
// `activityByDay` is always present and sorted ascending by `date`, and every
// value in a point is a `string` or `number` — the chart row type is
// `{ date: string } & Record<string, string | number>`, and the per-day key
// names are passed to recharts as untyped `dataKey` strings, so renaming one
// breaks a chart silently.
//
// The `*Point` shapes below are `type` aliases, not interfaces, and must stay
// that way: TypeScript only infers an implicit index signature for type
// aliases, so an interface here fails to satisfy the chart's
// `Record<string, string | number>` row constraint. Converting one back to an
// `interface` breaks every ChartPanel it feeds.

export type OverviewActivityPoint = {
  date: string;
  listings: number;
};

export interface OverviewTotals {
  users: number;
  verifiedUsers: number;
  activeListings: number;
  openReports: number;
  /** Posts with status=sold. Proxy only — not a confirmed transaction count.
   *  Absent (not 0) when the backend doesn't compute it. */
  soldPosts?: number;
}

export interface OverviewStats {
  activityByDay: OverviewActivityPoint[];
  totals: OverviewTotals;
}

export interface EngagementSummary {
  activeUsers: number;
  chatStartedCount: number;
  /** DM + thread messages combined. */
  messageSentCount: number;
  /** Distinct message senders in threads (not total thread members). */
  threadActiveUsers: number;
}

export type EngagementActivityPoint = {
  date: string;
  chats: number;
  /** DM + thread messages combined. */
  messages: number;
  threadActivity: number;
};

export interface EngagementActivity {
  activityByDay: EngagementActivityPoint[];
}

export interface ChatOverviewTotals {
  chatButtonClicks: number;
  chatStartedCount: number;
  /** DM user text messages only. */
  messageSentCount: number;
  /** Fraction 0..1. */
  listingToChatStartRate: number;
}

export type ChatActivityPoint = {
  date: string;
  chatButtonClicks: number;
  chatStarted: number;
  /** DM user text messages only. */
  messagesSent: number;
};

export interface ChatOverview {
  totals: ChatOverviewTotals;
  previousTotals?: ChatOverviewTotals;
  activityByDay: ChatActivityPoint[];
}

export interface ThreadsOverviewTotals {
  threadOpenCount: number;
  threadJoinCount: number;
  threadActiveUsers: number;
}

export type ThreadsActivityPoint = {
  date: string;
  threadOpens: number;
  threadJoins: number;
  threadActivity: number;
};

export interface ThreadsOverview {
  totals: ThreadsOverviewTotals;
  previousTotals?: ThreadsOverviewTotals;
  activityByDay: ThreadsActivityPoint[];
}

export interface ReportsOverviewTotals {
  /** Point-in-time backlog, not a period flow — hence absent from the
   *  comparison object below. */
  openReports: number;
  reportsCreatedCount: number;
  resolvedReportsCount: number;
}

export interface ReportsOverviewPreviousTotals {
  reportsCreatedCount: number;
  resolvedReportsCount: number;
}

export type ReportsActivityPoint = {
  date: string;
  reportsCreated: number;
  reportsResolved: number;
};

export interface ReportsOverview {
  totals: ReportsOverviewTotals;
  previousTotals?: ReportsOverviewPreviousTotals;
  activityByDay: ReportsActivityPoint[];
}

export interface TransactionsOverviewTotals {
  confirmedTransactionCount: number;
  /** Whole AUD. Can go negative once refunds are netted off. */
  confirmedTransactionVolume: number;
  /** Whole AUD. */
  gmv: number;
}

export type TransactionsActivityPoint = {
  date: string;
  confirmedTransactionCount: number;
  confirmedTransactionVolume: number;
  gmv: number;
};

export interface TransactionsOverview {
  totals: TransactionsOverviewTotals;
  previousTotals?: TransactionsOverviewTotals;
  activityByDay: TransactionsActivityPoint[];
}

export interface ListingsOverviewTotals {
  listingPublishedCount: number;
  /** Fraction 0..1. */
  firstListingRate: number;
  totalListingDetailViews: number;
  listingStartedCount: number;
  listingCreateClickedCount: number;
  repeatListingUserCount: number;
}

/** `totalListingDetailViews` has no period-over-period counterpart. */
export interface ListingsOverviewPreviousTotals {
  listingPublishedCount: number;
  /** Fraction 0..1. */
  firstListingRate: number;
  listingStartedCount: number;
  listingCreateClickedCount: number;
  repeatListingUserCount: number;
}

export type ListingsActivityPoint = {
  date: string;
  listingStarted: number;
  listingCreateClicked: number;
  listings: number;
  listingsPublished: number;
};

export interface ListingsOverview {
  totals: ListingsOverviewTotals;
  previousTotals?: ListingsOverviewPreviousTotals;
  activityByDay: ListingsActivityPoint[];
}

export interface ActivityOverviewTotals {
  signUpCount: number;
  /** Running total, not a period flow. */
  verifiedUsers: number;
  weeklyReturningVerifiedUsers: number;
  emailVerifiedCount: number;
  phoneVerifiedCount: number;
}

export interface ActivityOverviewPreviousTotals {
  /** Only period KPIs are comparable across periods. */
  signUpCount: number;
}

export type ActivityOverviewPoint = {
  date: string;
  signUps: number;
  verifiedUsers: number;
};

export interface ActivityOverview {
  totals: ActivityOverviewTotals;
  previousTotals?: ActivityOverviewPreviousTotals;
  activityByDay: ActivityOverviewPoint[];
}

export type WeeklyMetricUnit = 'count' | 'rate';
export type WeeklyCoreKpiKey =
  | 'verifiedUsers'
  | 'firstListingRate'
  | 'publishedListings'
  | 'chatStartRate'
  | 'transactionSignals';

export interface WeeklyMetricValue {
  thisWeek: number;
  lastWeek: number;
  delta: number;
  unit: WeeklyMetricUnit;
}

export interface WeeklyMetricsWeekWindow {
  thisWeekStart: string;
  thisWeekEnd: string;
  lastWeekStart: string;
  lastWeekEnd: string;
  timezone: string;
}

export interface WeeklyMetricsResponse {
  week: WeeklyMetricsWeekWindow;
  coreKpis: Record<WeeklyCoreKpiKey, WeeklyMetricValue>;
}

// ── User login activity ─────────────────────────────────────────────────

export type UserLoginMethod = 'email' | 'phone' | 'google' | 'unknown';

/** Type alias, not an interface — see the note above on chart row typing. */
export type DailyLoginPoint = {
  date: string;
  logins: number;
  uniqueUsers: number;
};

export interface LoginMethodBreakdown {
  email: number;
  phone: number;
  google: number;
  unknown: number;
}

export interface RecentUserLogin {
  userId: string;
  email: string | null;
  phone: string | null;
  method: UserLoginMethod;
  isSignUp: boolean;
  createdAt: string;
}

export interface UserLoginsResponse {
  dau: number;
  wau: number;
  mau: number;
  loginsLast7d: number;
  loginsLast30d: number;
  methodBreakdown: LoginMethodBreakdown;
  daily: DailyLoginPoint[];
  recentLogins: RecentUserLogin[];
}

// ── Funnel ──────────────────────────────────────────────────────────────

export type FunnelStageKey =
  | 'searches'
  | 'chatsStarted'
  | 'offersMade'
  | 'offersAccepted'
  | 'tradesCompleted';

export interface FunnelStage {
  key: FunnelStageKey;
  label: string;
  count: number;
  prevCount: number;
  /** count / previous-stage count, 0–1. Null for the first stage. */
  conversionFromPrev: number | null;
}

export interface FunnelResponse {
  since: string;
  until: string;
  stages: FunnelStage[];
  searchToTradeRate: number;
}

// ── Search gaps ─────────────────────────────────────────────────────────

export interface SearchGapTotals {
  searches: number;
  zeroResultSearches: number;
  zeroResultRate: number;
  distinctQueries: number;
}

export interface SearchGapRow {
  query: string;
  searches: number;
  zeroResults: number;
  zeroResultRate: number;
  lastSearchedAt: string;
}

export interface TopQueryRow {
  query: string;
  searches: number;
  avgResults: number;
}

export interface SearchGapsResponse {
  since: string;
  until: string;
  totals: SearchGapTotals;
  previousTotals: SearchGapTotals;
  gaps: SearchGapRow[];
  topQueries: TopQueryRow[];
}
