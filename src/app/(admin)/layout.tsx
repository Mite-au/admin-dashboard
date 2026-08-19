import { Sidebar } from '@/components/Sidebar';

/**
 * Two floating shells on a warm canvas. The sidebar is sticky and scrolls
 * independently; the content shell is a single tall card that the document
 * scrolls past, so long tables never get trapped in a nested scroller.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen gap-5 bg-page p-5">
      <Sidebar />
      <main className="card-shell flex min-w-0 flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
