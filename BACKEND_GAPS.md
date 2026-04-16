# Backend gaps for the admin dashboard

This is the list of fields and actions the Figma-designed admin UI needs but
the backend doesn't currently provide. Everything below is scoped so it can
ship without breaking the consumer frontend (`miteApp/frontend`) — all
schema changes are additive (nullable columns, new tables/enums), and all
new endpoints live under `/admin/*`.

Legend:
- **[ ]** Not started
- **[~]** In progress
- **[x]** Done (merged to main)

Pages explicitly out of scope for now (left as sidebar stubs): Trust &
Safety, Notification, Ads.

---

## 1. User detail page

### Columns missing from `users`

- [ ] `users.last_sign_in_at  TIMESTAMP(6) NULL` — stamp on successful
  `/auth/otp/sign-in/verify` (and any other token-issuing path). Fire-and-
  forget write; failures must not block the login response.
- [ ] `users.last_active_at   TIMESTAMP(6) NULL` — stamp once per 5 min per
  user from an authenticated-request middleware (throttled so chatty
  clients don't hammer the DB). Also written on socket connect.

### Columns missing from `user_profiles`

- [ ] `user_profiles.suburb_verified_at  TIMESTAMP(6) NULL` — set by an
  admin action. The Figma "Verification required" badge is computed as
  `suburb IS NOT NULL AND suburb_verified_at IS NULL`.

### `GET /admin/users/:id` response additions

Currently returns: `id, name, email, phone, createdAt, lastActiveAt (fake),
status, postsCount, reportsCount, avatarUrl`.

Needs to also return:
- [ ] `nationality` — raw 2-char ISO code from `user_profiles.nationality`.
  Frontend does the code→name lookup.
- [ ] `suburb` — `user_profiles.suburb`
- [ ] `stateCode` — `user_profiles.state_code`
- [ ] `emailVerified` — `users.email_verified`
- [ ] `phoneVerified` — `users.phone_verified`
- [ ] `suburbVerified` — `user_profiles.suburb_verified_at IS NOT NULL`
- [ ] `signUpAt` — alias of `users.created_at` (kept distinct from
  `createdAt` so the UI label matches Figma; backend can return both)
- [ ] `signInAt` — `users.last_sign_in_at` (new column above)
- [ ] `lastActiveAt` — `users.last_active_at` (new column above; stop
  aliasing `updated_at`)
- [ ] `totalPurchases` — aggregation (see below)
- [ ] `totalSales` — aggregation (see below)

### Aggregations (no new columns; `AdminService.getUser` changes only)

- [ ] `totalSales` — `SUM(price_cents)` from `posts` where
  `seller_id = user.id AND status = 'sold'`, divided by 100.
- [ ] `totalPurchases` — provisional definition: `SUM(amount_cents)` from
  `offers` where `buyer_id = user.id AND status = 'accepted'`, divided by
  100. This becomes exact once the `transactions` table lands (see §3).

### Admin mutations (new endpoints)

- [ ] `PATCH /admin/users/:id/status` — body `{ status: 'active' |
  'suspended' | 'deleted' | 'pending_profile' }`. Updates
  `users.status`. "Banned" is a `user_penalties.active = true` row, already
  handled by the existing `admin-user-penalty.controller`.
- [ ] `PATCH /admin/users/:id/suburb-verification` — body `{ verified:
  boolean }`. Sets `user_profiles.suburb_verified_at` to `now()` or `null`.
- [ ] `POST /admin/users/:id/password-reset` — generates an OTP / password-
  reset email via the existing Brevo email service. Logs an audit event
  (once the audit table exists; see §7).
- [ ] `DELETE /admin/users/:id/avatar` — clears `user_profiles.avatar_url`
  and deletes the underlying R2 object.

### Tabs on user detail — status per tab

- [x] **Items sold** — already works via `listUserPosts` + status filter.
- [ ] **Items Purchased** — requires `transactions` table (see §3). Until
  then, show "Coming soon" in the tab.
- [ ] **Thread** — new endpoint `GET /admin/users/:id/threads` returning
  `thread_members` joined to `threads` (joined_at, last_read_at, thread
  summary).
- [ ] **Chat** — new endpoint `GET /admin/users/:id/conversations` listing
  `conversations` with last message and counterparty. Reading individual
  messages is a privacy question — add a separate `GET
  /admin/conversations/:id/messages` gated behind an admin-view permission.
- [ ] **Reports** — endpoint `GET /admin/users/:id/reports` returning both
  (a) reports filed BY the user (`post_reports.reporter_id = user.id`) and
  (b) reports filed against the user's posts
  (`post_reports.posts.seller_id = user.id`). No user-level reports exist
  yet; deferred with Trust & Safety.
- [ ] **Logs** — requires an `audit_events` table (§7). Deferred.

---

## 2. Listings (Posts)

No schema changes needed. Admin list + detail already return the full
Figma-required shape.

### Admin mutations (new endpoints)

- [ ] `PATCH /admin/posts/:id/status` — body `{ status: posts_status }`.
  Admin-side moderation for pause / archive / remove.
- [ ] `DELETE /admin/posts/:id` — soft delete (`status → 'deleted'`, plus
  an audit event row).

---

## 3. Transactions

**The current `/admin/transactions` endpoint is a workaround that derives
rows from `offers`.** Offers are pre-sale negotiation, not settled
purchases. The real fix is a new table.

### New table: `transactions`

- [ ] Model `transactions`:
  ```
  id               BigInt        @id @default(autoincrement())
  post_id          BigInt
  seller_id        BigInt
  buyer_id         BigInt
  offer_id         BigInt?
  appointment_id   BigInt?
  amount_cents     Int
  currency         String        @default("AUD") @db.Char(3)
  status           transactions_status @default(pending)
  created_at       DateTime      @default(now())
  completed_at     DateTime?
  cancelled_at     DateTime?
  ```
- [ ] Enum `transactions_status`:
  `pending | completed | cancelled | disputed | refunded`.

### Lifecycle wiring

- [ ] When an offer transitions to `accepted`, create a `transactions` row
  with `status = pending`.
- [ ] When the linked `appointments` row transitions to `completed`,
  transition the transaction to `completed` and stamp `completed_at`.
- [ ] Either party cancelling → `cancelled`.
- [ ] Admin-only refund → `refunded`.

These hooks live in `offers.service` and `appointments.service` — only add
event listeners; existing flows don't change.

### Admin endpoints

- [ ] `GET /admin/transactions` (replace current offers-derived impl) —
  filters: buyer, seller, status, date range, min/max amount.
- [ ] `GET /admin/transactions/:id`
- [ ] `POST /admin/transactions/:id/refund`
- [ ] `POST /admin/transactions/:id/cancel`
- [ ] `POST /admin/transactions/:id/mark-disputed`

### Migration

- [ ] New migration adds the table + enum + backfill (optional: backfill
  rows from accepted offers with matching completed appointments so the
  admin UI has history immediately).

### Consumer-frontend impact

None. Consumer frontend has no transactions concept yet — the new table is
additive. When a consumer "My purchases" screen is built later, it queries
this table.

---

## 4. Threads

### Schema additions

- [ ] `threads.admin_status  thread_admin_status @default(active)` with
  enum values `active | flagged | archived | hidden`. Default `active` so
  existing rows remain consistent.
- [ ] Optionally later: `thread_reports` table if you want a "flag thread"
  action separate from post reports.

### Admin endpoints

- [ ] `PATCH /admin/threads/:id/status` — body `{ status:
  thread_admin_status }`.
- [ ] Fix existing `listThreads` to return the real `admin_status` instead
  of the hardcoded `'active'`, and to pass through `type` (schema enum is
  `SUBURB | INTEREST | SUBURB_INTEREST`; AdminService already normalises
  for the frontend).

### Consumer-frontend impact

None. The consumer app doesn't read `admin_status`. Consumer-facing filters
will want to hide threads where `admin_status IN ('hidden', 'archived')` —
that's a one-line `WHERE` addition when you're ready; it won't change the
response shape.

---

## 5. Overview / dashboard (not shown in Figma but wired)

Already works via `AdminService.getOverview`. No gaps.

---

## 6. Admin auth / RBAC

- [x] Admin JWT guard exists (`admin-auth.controller` + `AdminGuard`).
- [ ] Verify every new endpoint added below §1–§4 is behind
  `@UseGuards(JwtAuthGuard, AdminGuard)`.
- [ ] Audit-event writes on every mutating admin action (needs §7).

---

## 7. Deferred — requires later backend work

Nothing to action right now for these; documented so we don't forget.

- [ ] **`audit_events` table** (backs the "Logs" tab on user detail, plus
  general admin action history). Rough shape:
  `id, actor_id, event_type, target_type, target_id, metadata_json, ip,
  user_agent, created_at`.
- [ ] **`user_reports` table** (reports filed against a user, not a post)
  — part of Trust & Safety (deferred).
- [ ] **`post_reports` status fields** — `status, resolved_at,
  resolver_id, resolution_note` — part of Trust & Safety (deferred).
- [ ] **`admin_announcements` table** + fan-out worker — part of
  Notifications (deferred).
- [ ] **Ads suite** (`ad_campaigns`, `ad_creatives`, `ad_placements`,
  `ad_impressions`, `ad_clicks`) — part of Ads (deferred).

---

## Non-breaking-changes checklist (consumer frontend)

Everything above is safe for `miteApp/frontend` provided:

- New DB columns are **NULLABLE** with no default that would change
  behaviour (except enums: `threads.admin_status` defaults to `'active'`,
  which is the existing implicit state).
- No existing column is renamed, dropped, or retyped.
- No existing endpoint changes response shape. New fields go on new
  endpoints or as optional additions to existing `/admin/*` responses —
  the consumer app does not call `/admin/*`.
- New tables (`transactions`) are additive; nothing existing queries them.
- Auth-path writes (`last_sign_in_at`, `last_active_at`) are fire-and-
  forget and wrapped so any DB failure is logged but doesn't fail the
  request.
