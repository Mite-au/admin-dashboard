'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import {
  LayoutDashboard,
  User,
  List,
  HandCoins,
  MessagesSquare,
  ShieldCheck,
  BellRing,
  CalendarCheck,
  Megaphone,
  LogIn,
  MessageSquarePlus,
  TrendingUp,
  SearchX,
} from 'lucide-react';
import { BrandLockup } from '@/components/Brandmark';

type NavItem = { href: string; label: string; icon: typeof User };
type NavSection = { label: string; items: NavItem[] };

/**
 * Thirteen destinations is past the point where a flat list can be scanned,
 * so they are grouped by what the operator is doing: reading numbers,
 * working a queue of records, or running the platform.
 */
const sections: NavSection[] = [
  {
    label: 'Analytics',
    items: [
      { href: '/overview', label: 'Overview', icon: LayoutDashboard },
      { href: '/weekly-review', label: 'Weekly Review', icon: CalendarCheck },
      { href: '/funnel', label: 'Funnel', icon: TrendingUp },
      { href: '/search-gaps', label: 'Search Gaps', icon: SearchX },
      { href: '/user-logins', label: 'User Logins', icon: LogIn },
    ],
  },
  {
    label: 'Manage',
    items: [
      { href: '/users', label: 'User', icon: User },
      { href: '/listings', label: 'Listing', icon: List },
      { href: '/transactions', label: 'Transactions', icon: HandCoins },
      { href: '/threads', label: 'Thread', icon: MessagesSquare },
      { href: '/thread-requests', label: 'Thread Requests', icon: MessageSquarePlus },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/trust-safety', label: 'Trust & Safety', icon: ShieldCheck },
      { href: '/notification', label: 'Notification', icon: BellRing },
      { href: '/ads', label: 'Ads', icon: Megaphone },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="card-shell scroll-slim sticky top-5 flex w-60 shrink-0 flex-col self-start
                 max-h-[calc(100vh-2.5rem)] overflow-y-auto p-3"
    >
      <Link
        href="/overview"
        aria-label="MITE Admin — go to Overview"
        className="mb-2 flex items-center rounded-panel px-2 py-3 transition-colors hover:bg-ink-50"
      >
        <BrandLockup size={19} />
      </Link>

      <div className="mx-2 mb-1 border-t border-ink-100" />

      <nav aria-label="Main" className="flex flex-col">
        {sections.map((section) => (
          <div key={section.label} className="pt-3 first:pt-2">
            <p className="label-micro px-3 pb-1.5">{section.label}</p>
            <ul className="flex flex-col gap-px">
              {section.items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + '/');
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active ? 'page' : undefined}
                      className={clsx(
                        'relative flex items-center gap-2.5 rounded-control py-2 pl-3 pr-2.5 text-sm',
                        'transition-colors duration-150',
                        active
                          ? 'bg-brand-50 font-semibold text-brand-700'
                          : 'font-medium text-ink-700 hover:bg-ink-50 hover:text-ink-900',
                      )}
                    >
                      {/* The active keyline. Orange appears in exactly three
                          places app-wide: the mark, this rail, focus rings. */}
                      {active && (
                        <span
                          aria-hidden="true"
                          className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-500"
                        />
                      )}
                      <Icon
                        size={18}
                        strokeWidth={active ? 2.1 : 1.75}
                        className={active ? 'text-brand-600' : 'text-ink-400'}
                      />
                      <span className="truncate">{label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
