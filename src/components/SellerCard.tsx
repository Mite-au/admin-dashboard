import Link from 'next/link';
import { formatCountry, formatDate } from '@/lib/format';
import type { AdminUser } from '@/lib/types';

function formatVerificationStatus(seller: AdminUser) {
  const states: string[] = [];

  if (seller.email) {
    states.push(seller.emailVerified ? 'Email verified' : 'Email verification required');
  }

  if (seller.phone) {
    states.push(seller.phoneVerified ? 'Phone verified' : 'Phone verification required');
  }

  if (seller.suburb) {
    states.push(seller.suburbVerified ? 'Suburb verified' : 'Suburb verification required');
  }

  return states.length ? states.join(' / ') : '—';
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-500 mb-1">{label}</dt>
      <dd className="text-sm text-ink-900 break-words">{value}</dd>
    </div>
  );
}

export function SellerCard({
  seller,
  className = '',
}: {
  seller: AdminUser;
  className?: string;
}) {
  return (
    <section className={`card-inner p-6 space-y-5 ${className}`.trim()}>
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-500">Seller</p>
        <h2 className="text-lg font-semibold text-ink-900">{seller.name}</h2>
      </div>

      <dl className="grid grid-cols-1 gap-y-4">
        <InfoField label="User ID" value={`m${seller.id}`} />
        <InfoField label="Phone" value={seller.phone ?? '—'} />
        <InfoField label="Email" value={seller.email ?? '—'} />
        <InfoField label="Verification" value={formatVerificationStatus(seller)} />
        <InfoField label="Nationality" value={formatCountry(seller.nationality)} />
        <InfoField label="Suburb" value={seller.suburb ?? '—'} />
        <InfoField
          label="Sign up date"
          value={seller.signUpAt ? formatDate(seller.signUpAt) : formatDate(seller.createdAt)}
        />
        <InfoField
          label="Last active"
          value={seller.lastActiveAt ? formatDate(seller.lastActiveAt) : '—'}
        />
      </dl>

      <Link href={`/users/${seller.id}`} className="btn btn-pill-dark w-full justify-center">
        User detail
      </Link>
    </section>
  );
}
