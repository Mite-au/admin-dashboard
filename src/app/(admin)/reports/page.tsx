import { Topbar } from '@/components/Topbar';

export default function ReportsPage() {
  return (
    <>
      <Topbar title="Reports" />
      <main className="flex-1 p-6">
        <div className="card text-sm text-ink-500">
          Reports queue will surface user-submitted reports on posts, users, and threads here.
          Wire this to <code>/admin/reports</code> once the endpoint ships.
        </div>
      </main>
    </>
  );
}
