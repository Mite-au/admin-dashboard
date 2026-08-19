import Image from 'next/image';
import { StatusBadge } from '@/components/StatusBadge';
import { Card } from '@/components/ui';
import {
  formatCountry,
  formatDate,
  formatDateTime,
  formatMoney,
  formatNumber,
  formatRelative,
  isImageSrc,
} from '@/lib/format';
import type { AdminUser } from '@/lib/types';
import { ResetActions } from './ResetActions';
import { UserStatusControl } from './UserStatusControl';
import { VerificationChecklist } from './VerificationChecklist';

/**
 * Who this account is, in one column: identity, the standing that can be
 * changed, what has been verified, the dates that explain the record, and the
 * two support resets. Everything the account has *done* lives in the activity
 * panel next to it.
 */
export function ProfilePanel({ user }: { user: AdminUser }) {
  const displayName = user.name?.trim() || 'Unnamed account';
  const joinedAt = user.signUpAt ?? user.createdAt;

  return (
    <div className="space-y-6 lg:col-span-4">
      <section className="card-inner p-5">
        <div className="flex items-start gap-4">
          <Avatar src={user.avatarUrl} name={displayName} />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold tracking-[-0.01em] text-ink-900">
              {displayName}
            </h2>
            <p className="tnum mt-0.5 text-data text-ink-500">m{user.id}</p>
            <StatusBadge status={user.status} className="mt-2.5" />
          </div>
        </div>

        <UserStatusControl userId={user.id} status={user.status} />
      </section>

      <Card title="Verification" subtitle="Admin override for each trusted channel">
        <VerificationChecklist user={user} />
      </Card>

      <Card title="Account">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
          <Fact label="Nationality" value={formatCountry(user.nationality)} />
          <Fact label="State" value={user.stateCode || '—'} />
          <Fact label="Joined" value={formatDate(joinedAt)} title={formatDateTime(joinedAt)} />
          <Fact
            label="Last sign-in"
            value={formatRelative(user.signInAt)}
            title={formatDateTime(user.signInAt)}
          />
          <Fact
            label="Last active"
            value={formatRelative(user.lastActiveAt)}
            title={formatDateTime(user.lastActiveAt)}
          />
          <Fact label="Items listed" value={formatNumber(user.postsCount)} numeric />
          <Fact
            label="Total sales"
            value={user.totalSales != null ? formatMoney(user.totalSales, 'AUD') : '—'}
            numeric
          />
          <Fact
            label="Total purchases"
            value={user.totalPurchases != null ? formatMoney(user.totalPurchases, 'AUD') : '—'}
            numeric
          />
        </dl>
      </Card>

      <Card title="Support resets" subtitle="Applied immediately — there is no undo">
        <ResetActions userId={user.id} />
      </Card>
    </div>
  );
}

function Avatar({ src, name }: { src?: string | null; name: string }) {
  if (isImageSrc(src)) {
    return (
      <Image
        src={src}
        alt=""
        width={64}
        height={64}
        className="h-16 w-16 shrink-0 rounded-full object-cover ring-1 ring-ink-100"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-ink-100 text-xl font-bold text-ink-500"
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

function Fact({
  label,
  value,
  title,
  numeric,
}: {
  label: string;
  value: string;
  title?: string;
  numeric?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="label-micro">{label}</dt>
      <dd
        title={title}
        className={`mt-1 break-words text-data text-ink-900${numeric ? ' tnum' : ''}`}
      >
        {value}
      </dd>
    </div>
  );
}
