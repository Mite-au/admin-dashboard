import { ChevronRight, Home, LogOut } from 'lucide-react';
import { cookies } from 'next/headers';
import Link from 'next/link';

export type Breadcrumb = { label: string; href: string };

/**
 * The content shell's masthead: a fixed 56px toolbar closed by a hairline,
 * which is what gives every page the same three-band rhythm
 * (toolbar / title / content).
 *
 * The "MITE Admin" wordmark lives in the sidebar now, so the crumbs start
 * from a home affordance instead of repeating it.
 */
export async function Topbar({ breadcrumbs }: { breadcrumbs: Breadcrumb[] }) {
  const account = await getAccountLabel();
  const initial = account.trim().charAt(0).toUpperCase() || 'A';

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-ink-100 px-8">
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1">
        <Link
          href="/overview"
          aria-label="Overview"
          className="flex h-7 w-7 items-center justify-center rounded-control text-ink-400
                     transition-colors hover:bg-ink-50 hover:text-ink-700"
        >
          <Home size={15} strokeWidth={1.85} />
        </Link>
        {breadcrumbs.map((b, i) => {
          const isLast = i === breadcrumbs.length - 1;
          return (
            <span key={`${b.href}-${i}`} className="flex min-w-0 items-center gap-1">
              <ChevronRight size={14} strokeWidth={2} className="shrink-0 text-ink-300" />
              <Link
                href={b.href}
                aria-current={isLast ? 'page' : undefined}
                className={
                  isLast
                    ? 'truncate rounded px-1.5 py-0.5 text-sm font-semibold text-ink-900'
                    : 'truncate rounded px-1.5 py-0.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900'
                }
              >
                {b.label}
              </Link>
            </span>
          );
        })}
      </nav>

      <div className="flex shrink-0 items-center gap-2">
        <span
          className="hidden items-center gap-2 rounded-full border border-ink-200 bg-white py-1 pl-1 pr-3 sm:inline-flex"
          title={account}
        >
          <span
            aria-hidden="true"
            className="flex h-6 w-6 items-center justify-center rounded-full bg-ink-100 text-[11px] font-bold text-ink-700"
          >
            {initial}
          </span>
          <span className="max-w-[16rem] truncate text-data font-medium text-ink-700">
            {account}
          </span>
        </span>

        <form action="/api/logout" method="post">
          <button type="submit" className="btn-icon">
            <LogOut size={14} strokeWidth={1.9} />
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}

async function getAccountLabel(): Promise<string> {
  // The login route handler sets `admin_email` alongside the JWT cookie;
  // falls back to a placeholder if it isn't set (dev mode).
  const store = await cookies();
  return store.get('admin_email')?.value ?? 'admin@mite.app';
}
