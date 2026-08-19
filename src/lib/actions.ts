'use server';

/**
 * Server Actions for admin mutations.
 * Client components import these directly — Next.js routes the call
 * through the server so `api()` (which needs `cookies()`) works correctly.
 */

import { api } from './api';
import type {
  AdminReportStatus,
  AdminThreadRequestReviewResult,
  ContactVerificationResult,
  PostStatus,
  ThreadAdminStatus,
  ThreadRequestStatus,
} from './types';

type MutableUserStatus = 'active' | 'suspended' | 'pending_profile';
type MutablePostStatus = PostStatus;
type MutableThreadStatus = ThreadAdminStatus;

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

/**
 * Admin override for `users.email_verified` / `phone_verified`.
 * Backs the inline Verify / Unverify buttons on the user detail page — the
 * support path when a user can no longer receive their own OTP, and how a
 * test account gets a verified channel without a real inbox or SIM. The
 * backend rejects verifying a channel the account has no address/number for.
 */
export async function updateContactVerification(
  id: string,
  channel: 'email' | 'phone',
  verified: boolean,
): Promise<ContactVerificationResult> {
  return api<ContactVerificationResult>(
    `/admin/users/${id}/contact-verification`,
    {
      method: 'PATCH',
      body: JSON.stringify({ channel, verified }),
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

export async function updateThreadStatus(
  id: string,
  status: MutableThreadStatus,
): Promise<{ id: string; status: ThreadAdminStatus }> {
  return api<{ id: string; status: ThreadAdminStatus }>(`/admin/threads/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function reviewThreadRequest(
  id: string,
  status: Extract<ThreadRequestStatus, 'APPROVED' | 'REJECTED'>,
  reviewNote?: string,
): Promise<AdminThreadRequestReviewResult> {
  return api<AdminThreadRequestReviewResult>(`/admin/thread-requests/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, reviewNote }),
  });
}

export async function updateReportStatus(
  id: string,
  status: AdminReportStatus,
): Promise<{ id: string; status: AdminReportStatus }> {
  return api<{ id: string; status: AdminReportStatus }>(`/admin/reports/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function resetUserPassword(id: string): Promise<void> {
  await api<unknown>(`/admin/users/${id}/reset-password`, { method: 'POST' });
}

export async function resetUserAvatar(id: string): Promise<void> {
  await api<unknown>(`/admin/users/${id}/avatar`, { method: 'DELETE' });
}
