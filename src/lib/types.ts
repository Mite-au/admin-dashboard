// Mirror the Prisma schema for types used across the dashboard.
export type PostStatus = 'draft' | 'published' | 'sold' | 'paused' | 'archived' | 'deleted';
export type ThreadAdminStatus = 'active' | 'flagged' | 'archived' | 'hidden';
export type ThreadType = 'suburb' | 'interest';
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

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface OverviewStats {
  activityByDay: { date: string; posts: number; sales: number }[];
  totals: {
    users: number;
    posts: number;
    sales: number;
    revenue: number;
    reportsOpen: number;
  };
}
