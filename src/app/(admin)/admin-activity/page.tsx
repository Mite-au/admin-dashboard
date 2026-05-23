import { Activity, Users } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Topbar } from '@/components/Topbar';
import { getAdminActivity } from '@/lib/fetchers';
import { formatDateTime, formatNumber } from '@/lib/format';
import type { AdminActivityWindow } from '@/lib/types';

export default async function AdminActivityPage() {
  const data = await getAdminActivity(100);

  return (
    <>
      <Topbar breadcrumbs={[{ label: 'Admin Activity', href: '/admin-activity' }]} />
      <PageHeader title="Admin Activity" />

      <div className="px-8 pb-10 space-y-8">
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Logins · last 7 days" value={data.last7d.logins} icon="logins" />
          <StatCard
            label="Active admins · last 7 days"
            value={data.last7d.uniqueAdmins}
            icon="users"
          />
          <StatCard label="Logins · last 30 days" value={data.last30d.logins} icon="logins" />
          <StatCard
            label="Active admins · last 30 days"
            value={data.last30d.uniqueAdmins}
            icon="users"
          />
        </section>

        <PerAdminSection data={data.perAdmin} />
        <RecentLoginsSection data={data.recentLogins} />
      </div>
    </>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: AdminActivityWindow['logins'];
  icon: 'logins' | 'users';
}) {
  const Icon = icon === 'users' ? Users : Activity;
  return (
    <div className="inner-card p-5 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-ink-500 font-semibold">{label}</p>
        <p className="mt-2 text-3xl font-extrabold text-ink-900">{formatNumber(value)}</p>
      </div>
      <span className="rounded-xl bg-ink-50 p-2.5 text-ink-700">
        <Icon size={18} strokeWidth={1.75} />
      </span>
    </div>
  );
}

function PerAdminSection({
  data,
}: {
  data: Awaited<ReturnType<typeof getAdminActivity>>['perAdmin'];
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-ink-900">By admin</h2>
      <div className="inner-card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Admin</th>
              <th className="text-right">Total logins</th>
              <th className="text-right">Last 30 days</th>
              <th>Last login</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-ink-500 py-8">
                  No admin logins recorded yet.
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={row.adminUserId}>
                  <td className="font-medium">{row.email ?? `user #${row.adminUserId}`}</td>
                  <td className="text-right tabular-nums">{formatNumber(row.totalLogins)}</td>
                  <td className="text-right tabular-nums">{formatNumber(row.loginsLast30d)}</td>
                  <td className="text-ink-700">
                    {row.lastLoginAt ? formatDateTime(row.lastLoginAt) : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RecentLoginsSection({
  data,
}: {
  data: Awaited<ReturnType<typeof getAdminActivity>>['recentLogins'];
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-ink-900">Recent logins</h2>
      <div className="inner-card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Admin</th>
              <th>IP</th>
              <th>Device</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-ink-500 py-8">
                  No recent logins.
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={row.id}>
                  <td className="text-ink-700">{formatDateTime(row.createdAt)}</td>
                  <td className="font-medium">{row.email ?? `user #${row.adminUserId}`}</td>
                  <td className="text-ink-700 tabular-nums">{row.ipAddress ?? '—'}</td>
                  <td className="text-ink-700 max-w-md truncate" title={row.userAgent ?? ''}>
                    {summariseUserAgent(row.userAgent)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function summariseUserAgent(ua: string | null): string {
  if (!ua) return '—';
  // Cheap browser/OS extraction. The full UA stays in the title= tooltip.
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /Chrome\//.test(ua)
      ? 'Chrome'
      : /Firefox\//.test(ua)
        ? 'Firefox'
        : /Safari\//.test(ua)
          ? 'Safari'
          : 'Browser';
  const os = /Mac OS X/.test(ua)
    ? 'macOS'
    : /Windows/.test(ua)
      ? 'Windows'
      : /Android/.test(ua)
        ? 'Android'
        : /iPhone|iPad|iOS/.test(ua)
          ? 'iOS'
          : /Linux/.test(ua)
            ? 'Linux'
            : 'Unknown OS';
  return `${browser} · ${os}`;
}
