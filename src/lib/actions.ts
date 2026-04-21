'use server';

/**
 * Server Actions for admin mutations.
 * Client components import these directly — Next.js routes the call
 * through the server so `api()` (which needs `cookies()`) works correctly.
 */

import { api } from './api';
import type { PostStatus } from './types';

type MutableUserStatus = 'active' | 'suspended' | 'pending_profile';
type MutablePostStatus = PostStatus;

export async function updateUserStatus(
  id: string,
  status: MutableUserStatus,
): Promise<{ id: string; status: string }> {
  return api<{ id: string; status: string }>(`/admin/users/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function updateSuburbVerification(
  id: string,
  verified: boolean,
): Promise<{ id: string; suburbVerified: boolean }> {
  return api<{ id: string; suburbVerified: boolean }>(
    `/admin/users/${id}/suburb-verification`,
    {
      method: 'PATCH',
      body: JSON.stringify({ verified }),
    },
  );
}

export async function updatePostStatus(
  id: string,
  status: MutablePostStatus,
): Promise<{ id: string; status: PostStatus }> {
  return api<{ id: string; status: PostStatus }>(`/admin/posts/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}
