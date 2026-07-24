import { api, isRedirectError } from './api';
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
  ListingsOverview,
  OverviewStats,
  Paged,
  ReportsOverview,
  SearchGapsResponse,
  ThreadsOverview,
  TransactionsOverview,
  UserLoginsResponse,
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

export const getOverview = (period: PeriodFilter = {}) =>
  api<OverviewStats>(`/admin/overview${qs(period)}`);

export const getEngagementSummary = (period: PeriodFilter = {}) =>
  api<EngagementSummary>(`/admin/engagement/summary${qs(period)}`);

export const getEngagementActivity = (period: PeriodFilter = {}) =>
  api<EngagementActivity>(`/admin/engagement/activity${qs(period)}`);

export const getChatOverview = (period: PeriodFilter = {}) =>
  api<ChatOverview>(`/admin/chat/overview${qs(period)}`);

export const getThreadsOverview = (period: PeriodFilter = {}) =>
  api<ThreadsOverview>(`/admin/threads/overview${qs(period)}`);

export const getReportsOverview = (period: PeriodFilter = {}) =>
  api<ReportsOverview>(`/admin/reports/overview${qs(period)}`);

export const getTransactionsOverview = (period: PeriodFilter = {}) =>
  api<TransactionsOverview>(`/admin/transactions/overview${qs(period)}`);

export const getListingsOverview = (period: PeriodFilter = {}) =>
  api<ListingsOverview>(`/admin/listings/overview${qs(period)}`);

export const getActivityOverview = (period: PeriodFilter = {}) =>
  api<ActivityOverview>(`/admin/activity/overview${qs(period)}`);

export const getWeeklyMetrics = (date?: string) =>
  api<WeeklyMetricsResponse>(`/admin/metrics/weekly${qs({ date })}`);

export const getUserLogins = (limit?: number) =>
  api<UserLoginsResponse>(`/admin/user-logins${qs({ limit })}`);

export const getFunnel = (period: PeriodFilter = {}) =>
  api<FunnelResponse>(`/admin/funnel${qs(period)}`);

export const getSearchGaps = (period: PeriodFilter = {}, limit?: number) =>
  api<SearchGapsResponse>(`/admin/search-gaps${qs({ ...period, limit })}`);

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

export const getThreadRequests = (filters: ThreadRequestFilters = {}) =>
  api<AdminThreadRequest[]>(`/admin/thread-requests${qs(filters)}`);

export const getReports = (filters: ReportFilters = {}) =>
  api(`/admin/reports${qs({ pageSize: DEFAULT_PAGE_SIZE, ...filters })}`).then(
    toPaged<AdminReport>,
  );

export const getReport = (id: string) => api<AdminReport>(`/admin/reports/${id}`);

export const getUserReports = (userId: string): Promise<AdminReport[]> =>
  api(`/admin/users/${userId}/reports`).then(toArray<AdminReport>);
