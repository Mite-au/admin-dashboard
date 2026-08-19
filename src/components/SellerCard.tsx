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
      <dt className="label-micro mb-1">{label}</dt>
      <dd className="break-words text-data text-ink-900">{value}</dd>
    </div>
  );
}

export function SellerCard({
  seller,
  className = '',
}: {
  /**
   * Absent for anonymised accounts. Accepts `undefined` as well as `null`
   * because a listing can outlive the account that posted it, and the two
   * wire forms (key omitted / explicit null) both occur.
   */
  seller?: AdminUser | null;
  className?: string;
}) {
  if (!seller) {
    return (
      <section className={`card-inner space-y-2 p-5 ${className}`.trim()}>
        <p className="label-micro">Seller</p>
        <p className="text-data text-ink-500">
          This account was removed or anonymised. The listing stays on record,
          but there is no profile left to open.
        </p>
      </section>
    );
  }

  return (
    <section className={`card-inner flex flex-col p-5 ${className}`.trim()}>
      <p className="label-micro">Seller</p>
      <h2 className="mt-1 text-lg font-semibold tracking-[-0.01em] text-ink-900">
        {seller.name}
      </h2>

      <dl className="mt-5 grid grid-cols-1 gap-y-4 border-t border-ink-100 pt-5">
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

      <Link
        href={`/users/${seller.id}`}
        className="btn btn-pill-dark mt-5 w-full justify-center"
      >
        User detail
      </Link>
    </section>
  );
}
