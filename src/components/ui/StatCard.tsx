import clsx from 'clsx';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import type { ReactNode } from 'react';

export type StatDelta = {
  /** Signed change. Sign alone decides direction; magnitude is not read. */
  raw: number;
  /** Pre-formatted for display, e.g. "+12.4%". */
  formatted: string;
};

/**
 * One metric. Label, value, and an optional period-over-period delta.
 *
 * Delta colour follows the sign only — a caller that needs inverted semantics
 * (fewer reports is good) should negate `raw` before passing it.
 *
 * `isSnapshot` marks a value that has no comparison period because it is a
 * current-state reading rather than a sum over the window; it renders a live
 * affordance where the delta would go, so the slot never sits empty.
 */
export function StatCard({
  label,
  value,
  delta,
  hint,
  isSnapshot,
  footer,
  className,
}: {
  label: string;
  value: string;
  delta?: StatDelta | null;
  hint?: string;
  isSnapshot?: boolean;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx('card-inner flex flex-col p-5', className)}>
      <p className="label-micro">{label}</p>

      <p className="tnum mt-2 text-display font-bold text-ink-900">{value}</p>

      {(delta || isSnapshot || hint) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          {isSnapshot ? <LiveTick /> : delta ? <DeltaChip delta={delta} /> : null}
          {hint && <span className="text-xs text-ink-500">{hint}</span>}
        </div>
      )}

      {footer && <div className="mt-4 border-t border-ink-100 pt-3">{footer}</div>}
    </div>
  );
}

function DeltaChip({ delta }: { delta: StatDelta }) {
  const direction = delta.raw > 0 ? 'up' : delta.raw < 0 ? 'down' : 'flat';
  const Icon = direction === 'up' ? ArrowUpRight : direction === 'down' ? ArrowDownRight : Minus;

  return (
    <span
      className={clsx(
        'tnum inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-semibold',
        // Tinted background always pairs with the -700 text grade; the
        // -500 anchors are graphics-grade and fail AA at this size.
        direction === 'up' && 'bg-success-50 text-success-700',
        direction === 'down' && 'bg-danger-50 text-danger-700',
        direction === 'flat' && 'bg-ink-100 text-ink-600',
      )}
    >
      <Icon size={12} strokeWidth={2.5} aria-hidden="true" />
      {delta.formatted}
    </span>
  );
}

function LiveTick() {
  return (
    <span className="inline-flex items-center gap-1.5 text-2xs font-semibold text-ink-500">
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 shrink-0 rounded-full bg-success animate-live-pulse"
      />
      Live
    </span>
  );
}
