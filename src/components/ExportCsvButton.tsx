'use client';

import { Download } from 'lucide-react';

export type CsvColumn = { key: string; label: string };

/**
 * Serialises rows to CSV and triggers a download. Client-only.
 *
 * The leading U+FEFF byte-order mark is what makes Excel read the file as
 * UTF-8 — without it, non-ASCII names in the export come out mojibake.
 */
export function exportToCsv(
  data: Record<string, unknown>[],
  columns: CsvColumn[],
  filename: string,
) {
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };

  const header = columns.map((c) => escape(c.label)).join(',');
  const rows = data.map((row) => columns.map((c) => escape(row[c.key])).join(','));
  const csv = '\uFEFF' + [header, ...rows].join('\r\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Standalone export button, for pages that have no SearchCard. Shares the
 * `btn-icon` treatment with SearchCard's own export slot so the two read as
 * the same control wherever they appear.
 */
export function ExportCsvButton({
  data,
  filename,
  columns,
}: {
  data: Record<string, unknown>[];
  filename: string;
  columns: CsvColumn[];
}) {
  return (
    <button
      type="button"
      onClick={() => exportToCsv(data, columns, filename)}
      className="btn-icon"
    >
      <Download size={14} strokeWidth={1.9} />
      Export CSV
    </button>
  );
}
