'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import {
  LayoutDashboard,
  Users,
  Package,
  MessageSquare,
  Receipt,
  Flag,
  Settings,
  LogOut,
} from 'lucide-react';

const nav = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/listings', label: 'Listings', icon: Package },
  { href: '/transactions', label: 'Transactions', icon: Receipt },
  { href: '/threads', label: 'Threads', icon: MessageSquare },
  { href: '/reports', label: 'Reports', icon: Flag },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-60 shrink-0 border-r border-ink-100 bg-white flex flex-col">
      <div className="h-16 px-5 flex items-center border-b border-ink-100">
        <span className="text-lg font-semibold tracking-tight text-brand-700">
          Mite<span className="text-ink-900"> Admin</span>
        </span>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                active
                  ? 'bg-brand-50 text-brand-700 font-medium'
                  : 'text-ink-700 hover:bg-ink-50'
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>
      <form action="/api/logout" method="post" className="p-3 border-t border-ink-100">
        <button className="flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-ink-700 hover:bg-ink-50">
          <LogOut size={16} />
          Sign out
        </button>
      </form>
    </aside>
  );
}
