import { apiOr } from './api';
import {
  mockOverview,
  mockPost,
  mockPosts,
  mockThreads,
  mockTransactions,
  mockUser,
  mockUsers,
} from './mock';
import type {
  AdminPost,
  AdminThread,
  AdminTransaction,
  AdminUser,
  OverviewStats,
  Paged,
} from './types';

/**
 * Server-side fetchers used by RSC pages. Each talks to the admin endpoint on
 * the NestJS backend, with a mock fallback so the UI stays renderable during
 * development. Replace the mocks once the backend endpoints land.
 */

export const getOverview = () =>
  apiOr<OverviewStats>('/admin/overview', mockOverview());

export const getUsers = (page = 1, pageSize = 12, status?: string, q?: string) =>
  apiOr<Paged<AdminUser>>(
    `/admin/users?page=${page}&pageSize=${pageSize}` +
      (status ? `&status=${status}` : '') +
      (q ? `&q=${encodeURIComponent(q)}` : ''),
    mockUsers(page, pageSize),
  );

export const getUser = (id: string) =>
  apiOr<AdminUser>(`/admin/users/${id}`, mockUser(id));

export const getUserPosts = (id: string) =>
  apiOr<Paged<AdminPost>>(`/admin/users/${id}/posts`, mockPosts(1, 6));

export const getPosts = (page = 1, pageSize = 12, status?: string, q?: string) =>
  apiOr<Paged<AdminPost>>(
    `/admin/posts?page=${page}&pageSize=${pageSize}` +
      (status ? `&status=${status}` : '') +
      (q ? `&q=${encodeURIComponent(q)}` : ''),
    mockPosts(page, pageSize),
  );

export const getPost = (id: string) =>
  apiOr<AdminPost>(`/admin/posts/${id}`, mockPost(id));

export const getTransactions = (page = 1, pageSize = 12) =>
  apiOr<Paged<AdminTransaction>>(
    `/admin/transactions?page=${page}&pageSize=${pageSize}`,
    mockTransactions(page, pageSize),
  );

export const getThreads = (page = 1, pageSize = 12, status?: string) =>
  apiOr<Paged<AdminThread>>(
    `/admin/threads?page=${page}&pageSize=${pageSize}` + (status ? `&status=${status}` : ''),
    mockThreads(page, pageSize),
  );
