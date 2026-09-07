import clsx from 'clsx';
import {
  FileText,
  HelpCircle,
  MessageSquareText,
  MessagesSquare,
  Store,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import type { AdminReport, AdminReportTargetType } from '@/lib/types';

type TargetMeta = { label: string; Icon: LucideIcon; className: string };

/**
 * The five surfaces a report can be filed against, in the order they appear in
 * the filter. The backend `@IsIn`-checks this exact list, so a value outside it
 * is a 400 rather than a wider search — which is why the page's URL parser
 * validates against the same constant.
 *
 * Lives here, not in the client component, because the RSC page reads it too:
 * a plain value exported from a `'use client'` module reaches a server
 * component as a client reference, not as the array.
 */
export const REPORT_TARGET_TYPES: readonly AdminReportTargetType[] = [
  'post',
  'user',
  'market',
  'conversation_message',
  'thread_message',
];

/** Sentence-case a snake_case backend enum: `wrong_category` → `Wrong category`. */
function humanise(value: string): string {
  const words = value.trim().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
  if (!words) return '';
  return words.charAt(0).toUpperCase() + words.slice(1).toLowerCase();
}

/**
 * What a report points at.
 *
 * Typed by icon and fill rather than by hue: these are categories, not
 * severity, so colouring one red would state a judgement the report itself
 * hasn't made. Takes a plain string so a target type the frontend doesn't know
 * about yet renders as itself — humanised, never as raw snake_case — instead
 * of being mislabelled as one of the five it does know.
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
    case 'market':
      return {
        label: 'Market listing',
        Icon: Store,
        className: 'border border-ink-200 bg-white text-ink-700',
      };
    case 'conversation_message':
      return { label: 'Chat message', Icon: MessageSquareText, className: 'bg-ink-100 text-ink-700' };
    case 'thread_message':
      return { label: 'Thread message', Icon: MessagesSquare, className: 'bg-ink-100 text-ink-700' };
    default:
      return {
        label: humanise(type) || 'Unknown',
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
 * Which of the five targets has a page in this dashboard.
 *
 * `market`, `conversation_message` and `thread_message` deliberately return
 * null: the admin API exposes no market or message record, so the row shows
 * the label and the id and stops there. A link to `/listings/<a message id>`
 * is worse than no link.
 */
const TARGET_ROUTES: Partial<Record<AdminReportTargetType, string>> = {
  post: '/listings',
  user: '/users',
};

export function targetHref(report: AdminReport): string | null {
  if (!report.targetId) return null;
  const base = TARGET_ROUTES[report.targetType];
  return base ? `${base}/${report.targetId}` : null;
}

export function reporterHref(report: AdminReport): string | null {
  return report.reporterId ? `/users/${report.reporterId}` : null;
}

/**
 * The reason a report was filed.
 *
 * `reason` is one of four separate Prisma enums — `post_reports_reason`,
 * `user_reports_reason`, `message_reports_reason`, `market_reports_reason` —
 * and the API sends the raw member, so the table used to print `wrong_category`
 * and `hate_speech` verbatim. Members with a non-obvious reading get an
 * explicit phrase; everything else, including a member added after this map was
 * written, falls through to a sentence-cased version of itself.
 */
const REASON_LABELS: Record<string, string> = {
  // post_reports_reason
  prohibited: 'Prohibited item',
  scam: 'Scam',
  duplicate: 'Duplicate listing',
  wrong_category: 'Wrong category',
  counterfeit: 'Counterfeit',
  misleading: 'Misleading listing',
  offensive: 'Offensive content',
  spam: 'Spam',
  other: 'Other',
  // user_reports_reason
  fake_item: 'Fake item',
  harassment: 'Harassment',
  no_show: 'No-show',
  aggressive: 'Aggressive behaviour',
  // message_reports_reason
  hate_speech: 'Hate speech',
  sexual_content: 'Sexual content',
  threat: 'Threat',
  personal_info: 'Sharing personal information',
  // market_reports_reason (adds these three to the post set)
  safety: 'Safety concern',
  impersonation: 'Impersonation',
};

export function formatReportReason(reason: string | null | undefined): string {
  if (!reason) return '—';
  const key = reason.trim().toLowerCase();
  return REASON_LABELS[key] || humanise(reason) || '—';
}
