// Mirror the Prisma schema for types used across the dashboard.
export type PostStatus = 'draft' | 'published' | 'sold' | 'paused' | 'archived' | 'deleted';
export type ThreadAdminStatus = 'active' | 'flagged' | 'archived' | 'hidden';
export type ThreadType = 'suburb' | 'interest';
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

export interface AdminPost {
  id: string;
  title: string;
  description?: string | null;
  price: number;
  currency: string;
  category: string;
  condition: string;
  status: PostStatus;
  seller: { id: string; name: string };
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
}

export interface AdminUserThread {
  id: string;
  name: string;
  type: ThreadType;
  memberCount: number;
  lastActiveAt: string | null;
  createdAt: string;
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

export interface OverviewStats {
  activityByDay: { date: string; listings: number }[];
  totals: {
    users: number;
    verifiedUsers: number;
    activeListings: number;
    openReports: number;
    /** Posts with status=sold. Proxy only — not a confirmed transaction count. */
    soldPosts?: number;
  };
}

export interface EngagementSummary {
  activeUsers: number;
  chatStartedCount: number;
  /** DM + thread messages combined. */
  messageSentCount: number;
  /** Distinct message senders in threads (not total thread members). */
  threadActiveUsers: number;
}

export interface EngagementActivityPoint {
  date: string;
  chats: number;
  /** DM + thread messages combined. */
  messages: number;
  threadActivity: number;
}

export interface EngagementActivity {
  activityByDay: EngagementActivityPoint[];
}

export interface ChatOverview {
  totals: {
    chatButtonClickCount: number;
    chatStartedCount: number;
    /** DM user text messages only. */
    messageSentCount: number;
    listingToChatStartRate: number;
  };
  activityByDay: {
    date: string;
    chatStartedCount: number;
    /** DM user text messages only. */
    messageSentCount: number;
  }[];
}

export interface ReportsOverview {
  totals: {
    openReports: number;
    reportsCreatedCount: number;
    resolvedReportsCount: number;
  };
  activityByDay: {
    date: string;
    reportsCreated: number;
    reportsResolved: number;
  }[];
}

export interface TransactionsOverview {
  totals: {
    confirmedTransactionCount: number;
    confirmedTransactionVolume: number;
    gmv: number;
  };
  activityByDay: {
    date: string;
    confirmedTransactionCount: number;
    confirmedTransactionVolume: number;
    gmv: number;
  }[];
}

export interface ListingsOverview {
  totals: {
    listingPublishedCount: number;
    totalListingDetailViews: number;
    repeatListingUserCount: number;
  };
  activityByDay: {
    date: string;
    listings: number;
    listingsPublished: number;
  }[];
}

export interface ActivityOverview {
  totals: {
    signUpCount: number;
    verifiedUsers: number;
    weeklyReturningVerifiedUsers: number;
    emailVerifiedCount: number;
    phoneVerifiedCount: number;
  };
  activityByDay: {
    date: string;
    signUps: number;
    verifiedUsers: number;
  }[];
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
