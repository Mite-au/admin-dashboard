'use client';

import { Download } from 'lucide-react';

export type CsvColumn = { key: string; label: string };

/** CSV 변환 + BOM 다운로드 유틸 — 클라이언트 전용 */
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
 * 독립 버튼으로 쓸 때 사용.
 * SearchCard의 onExport 슬롯과 스타일을 통일한다.
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
      className="inline-flex items-center gap-1.5 rounded-md bg-ink-50 border border-ink-200 px-3 py-1.5 text-sm text-ink-700 hover:bg-ink-100"
    >
      <Download size={14} />
      Export CSV
    </button>
  );
}
