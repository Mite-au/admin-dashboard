'use client';

import { Download } from 'lucide-react';
import { exportToCsv } from '@/components/ExportCsvButton';
import { formatDate } from '@/lib/format';
import type { AdminPost } from '@/lib/types';

const CSV_COLUMNS = [
  { key: 'itemId', label: 'Item ID' },
  { key: 'title', label: 'Item title' },
  { key: 'sellerId', label: 'Seller ID' },
  { key: 'category', label: 'Category' },
  { key: 'price', label: 'Price' },
  { key: 'currency', label: 'Currency' },
  { key: 'condition', label: 'Condition' },
  { key: 'status', label: 'Status' },
  { key: 'created', label: 'Created' },
];

/**
 * Page-scoped export, labelled with the row count so it can't be mistaken for
 * a full-result-set download. See `UsersExportButton` for the reasoning.
 *
 * Price and currency are separate columns: `"12.50 AUD"` in one cell is a
 * string every spreadsheet refuses to sum.
 */
export function ListingsExportButton({ posts }: { posts: AdminPost[] }) {
  const count = posts.length;

  const handleExport = () => {
    const rows = posts.map((p) => ({
      itemId: `i${p.id}`,
      title: p.title,
      sellerId: p.seller ? `m${p.seller.id}` : '',
      category: p.category,
      price: p.price,
      currency: p.currency,
      condition: p.condition,
      status: p.status,
      created: formatDate(p.createdAt),
    }));
    exportToCsv(rows, CSV_COLUMNS, `listings-page-${new Date().toISOString().slice(0, 10)}.csv`);
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
