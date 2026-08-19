'use client';

import { chartTheme, formatValue, type ValueKind } from './theme';

/**
 * The one tooltip every chart in the kit uses. Recharts' default is never
 * rendered anywhere.
 *
 * Two rules from the dataviz method shape it:
 *  - Values lead, labels follow. The reader already knows which series they
 *    are pointing at; they want the number. So the value is the strong,
 *    high-contrast element and the series name is secondary — the legend's
 *    hierarchy inverted.
 *  - Line keys, not boxes. At tooltip density a filled swatch is data-weight
 *    ink doing a label's job, so each row keys its series with a short stroke.
 */

type TooltipEntry = {
  dataKey?: string | number;
  name?: string | number;
  value?: number | string | null;
  color?: string;
  /** Recharts fills this for bar marks, where `color` is the stroke. */
  fill?: string;
  /** Pie segments carry their colour on the datum rather than the entry. */
  payload?: { fill?: string };
};

export interface ChartTooltipProps {
  /** Injected by Recharts. */
  active?: boolean;
  /** Injected by Recharts. */
  payload?: TooltipEntry[];
  /** Injected by Recharts — the x value under the pointer. */
  label?: string | number;
  /** How to render each row's value. */
  valueKind?: ValueKind;
  /** Turns the raw x value into the header line. */
  labelFormatter?: (label: string | number | undefined) => string;
  /** Suppress the header (donut segments carry their name on the row itself). */
  hideLabel?: boolean;
}

export function ChartTooltip({
  active,
  payload,
  label,
  valueKind = 'number',
  labelFormatter,
  hideLabel = false,
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  // A series with no value at this x (a gap in the data) should not get a row.
  const rows = payload.filter((entry) => entry.value !== null && entry.value !== undefined);
  if (rows.length === 0) return null;

  const header = labelFormatter ? labelFormatter(label) : label;

  return (
    <div
      className="rounded-lg bg-white px-3 py-2.5 text-xs shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.10)]"
      style={{ border: `1px solid ${chartTheme.tooltipBorder}`, minWidth: 148 }}
    >
      {!hideLabel && header !== undefined && header !== '' && (
        <div
          className="pb-2 mb-2 font-medium"
          style={{ color: chartTheme.labelText, borderBottom: `1px solid ${chartTheme.tooltipBorder}` }}
        >
          {String(header)}
        </div>
      )}
      <div className="space-y-1.5">
        {rows.map((entry, i) => (
          <div key={`${String(entry.dataKey ?? entry.name ?? i)}`} className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="inline-block shrink-0 rounded-full"
              style={{
                width: 10,
                height: 2.5,
                background:
                  entry.fill ?? entry.color ?? entry.payload?.fill ?? chartTheme.mutedText,
              }}
            />
            <span className="mr-auto truncate" style={{ color: chartTheme.axisText }}>
              {String(entry.name ?? entry.dataKey ?? '')}
            </span>
            <span
              className="font-semibold tabular-nums"
              style={{ color: chartTheme.strongText }}
            >
              {formatValue(entry.value, valueKind)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
