import { Topbar } from '@/components/Topbar';

export default function SettingsPage() {
  return (
    <>
      <Topbar title="Settings" />
      <main className="flex-1 p-6 space-y-4">
        <div className="card">
          <h2 className="text-base font-semibold mb-1">API</h2>
          <p className="text-sm text-ink-500">
            Base URL: <code>{process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000'}</code>
          </p>
        </div>
        <div className="card">
          <h2 className="text-base font-semibold mb-1">Admins</h2>
          <p className="text-sm text-ink-500">Invite and manage admin users (coming soon).</p>
        </div>
      </main>
    </>
  );
}
