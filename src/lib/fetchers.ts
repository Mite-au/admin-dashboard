import { api } from './api';
import type {
  AdminPost,
  AdminReport,
  AdminThreadDetail,
  AdminThreadListItem,
  AdminTransaction,
  AdminUserConversation,
  AdminUserThread,
  AdminUser,
  OverviewStats,
  Paged,
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
  status?: string;
  targetType?: string;
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
  api<Paged<AdminTransaction>>(`/admin/users/${id}/purchases?pageSize=15`);

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

export const getUserReports = async (userId: string): Promise<AdminReport[]> => {
  const data = await api<Paged<AdminReport>>(`/admin/reports?targetType=user&pageSize=100`);
  return data.items.filter((r) => r.targetId === userId);
};
