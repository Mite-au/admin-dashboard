import { Bell, Search } from 'lucide-react';

export function Topbar({ title }: { title: string }) {
  return (
    <header className="h-16 border-b border-ink-100 bg-white flex items-center justify-between px-6">
      <h1 className="text-lg font-semibold">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
          <input
            className="w-64 pl-9 pr-3 py-2 rounded-lg border border-ink-100 bg-ink-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            placeholder="Search…"
          />
        </div>
        <button className="btn btn-ghost relative" aria-label="Notifications">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-danger" />
        </button>
        <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-medium">
          A
        </div>
      </div>
    </header>
  );
}
