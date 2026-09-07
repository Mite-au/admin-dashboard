'use server';

/**
 * Server Actions for admin mutations.
 * Client components import these directly — Next.js routes the call
 * through the server so `api()` (which needs `cookies()`) works correctly.
 */

import { ApiError, api, isRedirectError } from './api';
import { arrayOf, bool, get, oneOf, str, strOrNull } from './guards';
import type {
  ActionResult,
  AdminReportStatus,
  AdminThreadRequestReviewResult,
  ContactVerificationResult,
  PostStatus,
  ThreadAdminStatus,
  ThreadRequestStatus,
  UserPenaltyResult,
} from './types';

type MutableUserStatus = 'active' | 'suspended' | 'pending_profile';
type MutablePostStatus = PostStatus;
type MutableThreadStatus = ThreadAdminStatus;

/**
 * Run a mutation, normalise its response, and make failures legible.
 *
 * Three things this buys over calling `api()` directly:
 *
 * 1. A failed mutation leaves a server-side trace. Callers surface
 *    `err.message` in an alert and move on, so without this a rejected PATCH
 *    was invisible in the logs — nothing to correlate with a support ticket.
 * 2. Whatever is thrown is always an `ApiError` carrying the backend's human
 *    message (`api()` parses Nest's `{ message, statusCode }` envelope), so
 *    the `err instanceof Error ? err.message : …` branch at every call site
 *    gets the actionable sentence rather than a raw JSON blob.
 * 3. The response is rebuilt field by field, so a backend that returns 200
 *    with a partial body can't hand a component `undefined.status`.
 *
 * `redirect()` throws to unwind — that has to pass through untouched or the
 * 401 bounce to /login turns into an "update failed" alert.
 *
 * Caveat for callers: in a production build Next.js replaces errors thrown
 * out of a Server Action with a generic digest, so the parsed message is only
 * visible verbatim in development. Surfacing it in production needs an action
 * that *returns* an error result instead of throwing.
 */
async function mutate<T>(
  label: string,
  request: Promise<unknown>,
  shape: (raw: unknown) => T,
): Promise<T> {
  try {
    return shape(await request);
  } catch (err) {
    if (isRedirectError(err)) throw err;

    const message = err instanceof Error ? err.message : String(err);
    console.error(`[actions] ${label} failed:`, message);

    if (err instanceof ApiError) throw err;
    // Something below the HTTP layer broke (a serialisation bug, a thrown
    // non-Error). Give the call site the shape it already handles.
    throw new ApiError(500, message || `${label} failed`);
  }
}

export async function updateUserStatus(
  id: string,
  status: MutableUserStatus,
): Promise<{ id: string; status: string }> {
  return mutate(
    `updateUserStatus(${id})`,
    api(`/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
    // The request succeeded, so the value we asked for is the best available
    // truth when the backend doesn't echo one back.
    (raw) => ({ id: str(get(raw, 'id'), id), status: str(get(raw, 'status'), status) }),
  );
}

/**
 * Apply or lift an account penalty.
 *
 * This is the **only** ban/unban path: `users.status` has no `banned` member,
 * and `PATCH /admin/users/:id/status` explicitly refuses one. The synthetic
 * `banned` status the list and detail endpoints return is derived from
 * `user_penalties.active`, so it can only be changed here.
 *
 * `reason` is optional on the DTO and capped at 500 characters. It is trimmed
 * and omitted when blank rather than sent as `""` — the field is an audit
 * trail, and an empty string in it is worse than no entry.
 */
export async function setUserPenalty(
  id: string,
  active: boolean,
  reason?: string,
): Promise<UserPenaltyResult> {
  const trimmed = reason?.trim();
  return mutate(
    `setUserPenalty(${id}, ${active})`,
    api(`/admin/users/${id}/penalty`, {
      method: 'POST',
      body: JSON.stringify(trimmed ? { active, reason: trimmed } : { active }),
    }),
    (raw) => ({
      userId: str(get(raw, 'userId'), id),
      hasPenalty: bool(get(raw, 'hasPenalty'), active),
    }),
  );
}

export async function updateSuburbVerification(
  id: string,
  verified: boolean,
): Promise<{ id: string; suburbVerified: boolean }> {
  return mutate(
    `updateSuburbVerification(${id})`,
    api(`/admin/users/${id}/suburb-verification`, {
      method: 'PATCH',
      body: JSON.stringify({ verified }),
    }),
    (raw) => ({
      id: str(get(raw, 'id'), id),
      suburbVerified: bool(get(raw, 'suburbVerified'), verified),
    }),
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
  return mutate(
    `updateContactVerification(${id}, ${channel})`,
    api(`/admin/users/${id}/contact-verification`, {
      method: 'PATCH',
      body: JSON.stringify({ channel, verified }),
    }),
    (raw) => ({
      id: str(get(raw, 'id'), id),
      email: strOrNull(get(raw, 'email')),
      phone: strOrNull(get(raw, 'phone')),
      // Only the channel we just changed is known from the request; the other
      // falls back to false rather than inventing a verified state.
      emailVerified: bool(get(raw, 'emailVerified'), channel === 'email' ? verified : false),
      phoneVerified: bool(get(raw, 'phoneVerified'), channel === 'phone' ? verified : false),
    }),
  );
}

export async function updatePostStatus(
  id: string,
  status: MutablePostStatus,
): Promise<{ id: string; status: PostStatus }> {
  return mutate(
    `updatePostStatus(${id})`,
    api(`/admin/posts/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
    (raw) => ({
      id: str(get(raw, 'id'), id),
      status: oneOf<PostStatus>(
        get(raw, 'status'),
        ['draft', 'published', 'sold', 'paused', 'archived', 'deleted'],
        status,
      ),
    }),
  );
}

export async function updateThreadStatus(
  id: string,
  status: MutableThreadStatus,
): Promise<{ id: string; status: ThreadAdminStatus }> {
  return mutate(
    `updateThreadStatus(${id})`,
    api(`/admin/threads/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
    (raw) => ({
      id: str(get(raw, 'id'), id),
      status: oneOf<ThreadAdminStatus>(
        get(raw, 'status'),
        ['active', 'flagged', 'archived', 'hidden'],
        status,
      ),
    }),
  );
}

export async function reviewThreadRequest(
  id: string,
  status: Extract<ThreadRequestStatus, 'APPROVED' | 'REJECTED'>,
  reviewNote?: string,
): Promise<AdminThreadRequestReviewResult> {
  return mutate(
    `reviewThreadRequest(${id}, ${status})`,
    api(`/admin/thread-requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reviewNote }),
    }),
    (raw) => ({
      id: str(get(raw, 'id'), id),
      status: oneOf<ThreadRequestStatus>(
        get(raw, 'status'),
        ['PENDING', 'APPROVED', 'REJECTED'],
        status,
      ),
      reviewedAt: strOrNull(get(raw, 'reviewedAt')),
      reviewNote: strOrNull(get(raw, 'reviewNote')),
      createdThreadIds: arrayOf(get(raw, 'createdThreadIds'), (item) =>
        typeof item === 'string' && item ? item : null,
      ),
    }),
  );
}

export async function updateReportStatus(
  id: string,
  status: AdminReportStatus,
): Promise<{ id: string; status: AdminReportStatus }> {
  return mutate(
    `updateReportStatus(${id})`,
    api(`/admin/reports/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
    (raw) => ({
      id: str(get(raw, 'id'), id),
      status: oneOf<AdminReportStatus>(get(raw, 'status'), ['open', 'resolved'], status),
    }),
  );
}

export async function resetUserPassword(id: string): Promise<void> {
  await mutate(
    `resetUserPassword(${id})`,
    api(`/admin/users/${id}/reset-password`, { method: 'POST' }),
    () => undefined,
  );
}

export async function resetUserAvatar(id: string): Promise<void> {
  await mutate(
    `resetUserAvatar(${id})`,
    api(`/admin/users/${id}/avatar`, { method: 'DELETE' }),
    () => undefined,
  );
}

// ── Result-returning variants ───────────────────────────────────────────
//
// Same mutations, same arguments, but failure comes back as a value instead
// of an exception. The throwing versions above stay exported and unchanged —
// existing call sites keep working until they're migrated.
//
// Why both exist: Next.js replaces anything thrown out of a Server Action
// with an opaque digest in a production build, so `err.message` at the call
// site becomes "An error occurred in the Server Components render" and the
// backend's actual complaint is lost. `api()` goes to real trouble to parse
// Nest's `{ message, statusCode }` envelope; returning the result is what
// gets that sentence to the admin looking at the screen.

/**
 * Run a mutation and convert failure into an `ActionResult`.
 *
 * `redirect()` unwinds by throwing, and that throw MUST keep propagating —
 * catching it here would turn the 401 bounce to /login into a permanent
 * "Unauthorized" toast on a page that never re-authenticates.
 *
 * Everything else is already an `ApiError` carrying the parsed backend
 * message, because `mutate()` normalised it on the way out.
 */
async function toActionResult(run: () => Promise<unknown>): Promise<ActionResult> {
  try {
    await run();
    return { ok: true };
  } catch (err) {
    if (isRedirectError(err)) throw err;

    if (err instanceof ApiError) return { ok: false, error: err.message };

    // Nothing below should reach here — `mutate()` wraps every failure — but
    // an honest fallback beats leaking "[object Object]" into the UI.
    const message = err instanceof Error ? err.message.trim() : '';
    return {
      ok: false,
      error: message || 'The update could not be completed. Please try again.',
    };
  }
}

export async function updateUserStatusResult(
  id: string,
  status: MutableUserStatus,
): Promise<ActionResult> {
  return toActionResult(() => updateUserStatus(id, status));
}

export async function setUserPenaltyResult(
  id: string,
  active: boolean,
  reason?: string,
): Promise<ActionResult> {
  return toActionResult(() => setUserPenalty(id, active, reason));
}

export async function updateSuburbVerificationResult(
  id: string,
  verified: boolean,
): Promise<ActionResult> {
  return toActionResult(() => updateSuburbVerification(id, verified));
}

export async function updateContactVerificationResult(
  id: string,
  channel: 'email' | 'phone',
  verified: boolean,
): Promise<ActionResult> {
  return toActionResult(() => updateContactVerification(id, channel, verified));
}

export async function updatePostStatusResult(
  id: string,
  status: MutablePostStatus,
): Promise<ActionResult> {
  return toActionResult(() => updatePostStatus(id, status));
}

export async function updateThreadStatusResult(
  id: string,
  status: MutableThreadStatus,
): Promise<ActionResult> {
  return toActionResult(() => updateThreadStatus(id, status));
}

export async function reviewThreadRequestResult(
  id: string,
  status: Extract<ThreadRequestStatus, 'APPROVED' | 'REJECTED'>,
  reviewNote?: string,
): Promise<ActionResult> {
  return toActionResult(() => reviewThreadRequest(id, status, reviewNote));
}

export async function updateReportStatusResult(
  id: string,
  status: AdminReportStatus,
): Promise<ActionResult> {
  return toActionResult(() => updateReportStatus(id, status));
}

export async function resetUserPasswordResult(id: string): Promise<ActionResult> {
  return toActionResult(() => resetUserPassword(id));
}

export async function resetUserAvatarResult(id: string): Promise<ActionResult> {
  return toActionResult(() => resetUserAvatar(id));
}
