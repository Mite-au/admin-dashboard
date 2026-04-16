import { LogOut, User as UserIcon } from 'lucide-react';
import { cookies } from 'next/headers';

export async function Topbar({ breadcrumbs }: { breadcrumbs: string[] }) {
  const account = await getAccountLabel();
  return (
    <header className="flex items-center justify-between px-8 pt-7 pb-5">
      <div className="flex items-center gap-3 text-sm font-medium">
        <span className="text-brand-600 font-bold tracking-wide">MITE Admin</span>
        {breadcrumbs.map((b, i) => (
          <span key={i} className="flex items-center gap-3 text-ink-700">
            <span className="text-ink-300">/</span>
            {b}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-3 text-sm">
        <span className="inline-flex items-center gap-2 text-ink-900">
          <UserIcon size={16} strokeWidth={1.75} />
          {account}
        </span>
        <form action="/api/logout" method="post">
          <button className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 bg-white px-3 py-1.5 text-ink-700 hover:bg-ink-50">
            <LogOut size={14} />
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
