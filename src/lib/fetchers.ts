import { api } from './api';
import type {
  ActivityOverview,
  AdminPost,
  AdminReport,
  AdminReportStatus,
  AdminReportTargetType,
  AdminThreadDetail,
  AdminThreadListItem,
  AdminTransaction,
  AdminUserConversation,
  AdminUserPurchase,
  AdminUserThread,
  AdminUser,
  ChatOverview,
  EngagementActivity,
  EngagementSummary,
  ListingsOverview,
  OverviewStats,
  Paged,
  ReportsOverview,
  ThreadsOverview,
  TransactionsOverview,
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
  minMembers?: number;
  memberId?: string;
};

export const getOverview = () => api<OverviewStats>('/admin/overview');

export const getEngagementSummary = () =>
  api<EngagementSummary>('/admin/engagement/summary');

export const getEngagementActivity = () =>
  api<EngagementActivity>('/admin/engagement/activity');

export const getChatOverview = () =>
  api<ChatOverview>('/admin/chat/overview');

export const getThreadsOverview = () =>
  api<ThreadsOverview>('/admin/threads/overview');

export const getReportsOverview = () =>
  api<ReportsOverview>('/admin/reports/overview');

export const getTransactionsOverview = () =>
  api<TransactionsOverview>('/admin/transactions/overview');

export const getListingsOverview = () =>
  api<ListingsOverview>('/admin/listings/overview');

export const getActivityOverview = () =>
  api<ActivityOverview>('/admin/activity/overview');

export const getWeeklyMetrics = (date?: string) =>
  api<WeeklyMetricsResponse>(`/admin/metrics/weekly${qs({ date })}`);

export const getUsers = (filters: UserFilters = {}) =>
  api<Paged<AdminUser>>(`/admin/users${qs({ pageSize: 15, ...filters })}`);

export const getUser = (id: string) => api<AdminUser>(`/admin/users/${id}`);

export const getUserPosts = (id: string) =>
  api<Paged<AdminPost>>(`/admin/users/${id}/posts`);

export const getUserThreads = (id: string) =>
  api<AdminUserThread[]>(`/admin/users/${id}/threads`);

export const getUserConversations = (id: string) =>
  api<AdminUserConversation[]>(`/admin/users/${id}/conversations`);

export const getUserPurchases = (id: string) =>
  api<Paged<AdminUserPurchase>>(`/admin/users/${id}/purchases?pageSize=15`);

export const getPosts = (filters: PostFilters = {}) =>
  api<Paged<AdminPost>>(`/admin/posts${qs({ pageSize: 15, ...filters })}`);

export const getPost = (id: string) => api<AdminPost>(`/admin/posts/${id}`);

export const getTransactions = (filters: TransactionFilters = {}) =>
  api<Paged<AdminTransaction>>(`/admin/transactions${qs({ pageSize: 15, ...filters })}`);

export const getThreads = (filters: ThreadFilters = {}) =>
  api<Paged<AdminThreadListItem>>(`/admin/threads${qs({ pageSize: 15, ...filters })}`);

export const getThread = (id: string) => api<AdminThreadDetail>(`/admin/threads/${id}`);

export const getReports = (filters: ReportFilters = {}) =>
  api<Paged<AdminReport>>(`/admin/reports${qs({ pageSize: 15, ...filters })}`);

export const getReport = (id: string) => api<AdminReport>(`/admin/reports/${id}`);

export const getUserReports = (userId: string): Promise<AdminReport[]> =>
  api<AdminReport[]>(`/admin/users/${userId}/reports`);
