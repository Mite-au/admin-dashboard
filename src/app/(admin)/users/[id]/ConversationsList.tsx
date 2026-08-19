import Image from 'next/image';
import Link from 'next/link';
import { MessagesSquare, Package } from 'lucide-react';
import { EmptyState } from '@/components/ui';
import { formatDateTime, formatMoney, formatRelative, isImageSrc } from '@/lib/format';
import type { AdminUserConversation } from '@/lib/types';

/**
 * Direct-message context: who this member is talking to, the latest thing
 * said, and the listing the conversation is about.
 *
 * A list rather than a table — the message snippet is prose and needs to
 * wrap, which is exactly what a fixed-height data row cannot do.
 */
export function ConversationsList({
  conversations,
}: {
  conversations: AdminUserConversation[];
}) {
  if (conversations.length === 0) {
    return (
      <EmptyState
        icon={MessagesSquare}
        title="No conversations"
        description="Direct messages between this member and other people will be listed here."
      />
    );
  }

  return (
    <ul className="divide-y divide-ink-100">
      {conversations.map((c) => (
        <li key={c.id} className="px-5 py-4">
          <div className="flex items-start gap-3">
            <PartnerAvatar partner={c.partner} />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <p className="truncate text-data font-semibold text-ink-900">
                  {c.partner.displayName || `m${c.partner.id}`}
                </p>
                <Link
                  href={`/users/${c.partner.id}`}
                  className="tnum rounded-sm text-2xs text-ink-500 hover:text-ink-900 hover:underline"
                >
                  m{c.partner.id}
                </Link>
                <span
                  title={formatDateTime(c.lastMessageAt)}
                  className="ml-auto whitespace-nowrap text-2xs text-ink-500"
                >
                  {formatRelative(c.lastMessageAt)}
                </span>
              </div>

              <p className="mt-1.5 line-clamp-2 break-words text-data leading-relaxed text-ink-700">
                {c.lastMessageSnippet || 'No messages yet.'}
              </p>

              {c.post && (
                <Link
                  href={`/listings/${c.post.id}`}
                  className="mt-2.5 inline-flex max-w-full items-center gap-1.5 rounded-full bg-ink-50 px-2.5 py-1
                             text-2xs font-medium text-ink-700 transition-colors hover:bg-ink-100 hover:text-ink-900"
                >
                  <Package size={12} strokeWidth={1.9} aria-hidden="true" className="shrink-0" />
                  <span className="truncate">{c.post.title || 'Untitled listing'}</span>
                  {c.post.priceCents != null && (
                    <span className="tnum shrink-0 text-ink-500">
                      {formatMoney(c.post.priceCents / 100)}
                    </span>
                  )}
                </Link>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function PartnerAvatar({ partner }: { partner: AdminUserConversation['partner'] }) {
  if (isImageSrc(partner.avatarUrl)) {
    return (
      <Image
        src={partner.avatarUrl}
        alt=""
        width={36}
        height={36}
        className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-ink-100"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-100 text-data font-bold text-ink-500"
    >
      {(partner.displayName || partner.id).slice(0, 1).toUpperCase()}
    </span>
  );
}
