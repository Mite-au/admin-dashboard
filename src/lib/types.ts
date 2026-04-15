// Mirror the Prisma schema for types used across the dashboard.
export type PostStatus = 'draft' | 'published' | 'sold' | 'paused' | 'archived' | 'deleted';
export type UserStatus = 'active' | 'banned' | 'suspended';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  createdAt: string;
  lastActiveAt?: string | null;
  status: UserStatus;
  postsCount: number;
  reportsCount: number;
  avatarUrl?: string | null;
}

export interface AdminPost {
  id: string;
  title: string;
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
  status: 'pending' | 'completed' | 'cancelled' | 'disputed';
  createdAt: string;
}

export interface AdminThread {
  id: string;
  name: string;
  type: 'suburb' | 'interest';
  memberCount: number;
  messageCount: number;
  createdAt: string;
  status: 'active' | 'flagged' | 'archived';
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
