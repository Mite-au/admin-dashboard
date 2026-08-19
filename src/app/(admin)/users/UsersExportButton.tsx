'use client';

import { Download } from 'lucide-react';
import { exportToCsv } from '@/components/ExportCsvButton';
import { formatCountry, formatDate } from '@/lib/format';
import type { AdminUser } from '@/lib/types';

const CSV_COLUMNS = [
  { key: 'name', label: 'User name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'memberId', label: 'Member ID' },
  { key: 'nationality', label: 'Nationality' },
  { key: 'status', label: 'Status' },
  { key: 'joined', label: 'Joined' },
];

/**
 * Exports the rows currently on screen — not the whole result set.
 *
 * The old label said "Export CSV" next to a filter panel showing the full
 * total, which read as "export all 4,312 users" while writing 15 rows. The
 * count in the label is the honest version: it says exactly how many rows
 * land in the file. An all-pages export needs a server route that streams the
 * query, not a client loop over paged fetches.
 */
export function UsersExportButton({ users }: { users: AdminUser[] }) {
  const count = users.length;

  const handleExport = () => {
    const rows = users.map((u) => ({
      name: u.name,
      email: u.email ?? '',
      phone: u.phone ?? '',
      memberId: `m${u.id}`,
      nationality: formatCountry(u.nationality),
      status: u.status,
      joined: formatDate(u.signUpAt ?? u.createdAt),
    }));
    exportToCsv(rows, CSV_COLUMNS, `users-page-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={count === 0}
      title="Downloads the rows on this page only"
      className="btn-icon"
    >
      <Download size={14} strokeWidth={1.9} />
      Export page ({count})
    </button>
  );
}
