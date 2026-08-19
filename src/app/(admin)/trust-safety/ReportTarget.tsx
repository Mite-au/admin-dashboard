import clsx from 'clsx';
import { FileText, HelpCircle, UserRound, type LucideIcon } from 'lucide-react';
import type { AdminReport } from '@/lib/types';

type TargetMeta = { label: string; Icon: LucideIcon; className: string };

/**
 * What a report points at.
 *
 * Typed by icon and fill rather than by hue: "post" and "user" are categories,
 * not severity, so colouring one red would state a judgement the report itself
 * hasn't made. Takes a plain string so a target type the frontend doesn't know
 * about yet renders as itself instead of being mislabelled as the other one.
 */
export function targetMeta(type: string): TargetMeta {
  switch (type) {
    case 'post':
      return { label: 'Post', Icon: FileText, className: 'bg-ink-100 text-ink-700' };
    case 'user':
      return {
        label: 'User',
        Icon: UserRound,
        className: 'border border-ink-200 bg-white text-ink-700',
      };
    default:
      return {
        label: type || 'Unknown',
        Icon: HelpCircle,
        className: 'bg-warning-50 text-warning-700',
      };
  }
}

export function TargetTypeChip({ type, className }: { type: string; className?: string }) {
  const { label, Icon, className: tone } = targetMeta(type);
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-2xs font-semibold',
        tone,
        className,
      )}
    >
      <Icon size={12} strokeWidth={2.2} aria-hidden="true" />
      {label}
    </span>
  );
}

/**
 * The admin page for whatever was reported, or null when there is nowhere
 * honest to send the admin — an unknown target type has no detail screen, and
 * a link to `/listings/undefined` is worse than no link at all.
 */
export function targetHref(report: AdminReport): string | null {
  if (!report.targetId) return null;
  if (report.targetType === 'post') return `/listings/${report.targetId}`;
  if (report.targetType === 'user') return `/users/${report.targetId}`;
  return null;
}

export function reporterHref(report: AdminReport): string | null {
  return report.reporterId ? `/users/${report.reporterId}` : null;
}
