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
  Megaphone,
} from 'lucide-react';

const nav = [
  { href: '/overview', label: 'Overview', icon: LayoutDashboard },
  { href: '/users', label: 'User', icon: User },
  { href: '/listings', label: 'Listing', icon: List },
  { href: '/transactions', label: 'Transactions', icon: HandCoins },
  { href: '/threads', label: 'Thread', icon: MessagesSquare },
  { href: '/trust-safety', label: 'Trust & Safety', icon: ShieldCheck },
  { href: '/notification', label: 'Notification', icon: BellRing },
  { href: '/ads', label: 'Ads', icon: Megaphone },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="card-shell w-60 shrink-0 p-3 self-start">
      <nav className="space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors',
                active
                  ? 'bg-ink-800 text-white font-semibold'
                  : 'text-ink-900 hover:bg-ink-50',
              )}
            >
              <Icon size={18} strokeWidth={active ? 2.25 : 1.75} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
