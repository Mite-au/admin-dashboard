import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-50 p-6">
      <div className="w-full max-w-sm card">
        <div className="text-center mb-6">
          <div className="text-2xl font-semibold tracking-tight">
            Mite<span className="text-brand-700"> Admin</span>
          </div>
          <p className="text-sm text-ink-500 mt-1">Sign in to the admin dashboard</p>
        </div>
        <form action="/api/login" method="post" className="space-y-4">
          <div>
            <label className="text-sm text-ink-700">Email</label>
            <input name="email" type="email" required
              className="mt-1 w-full px-3 py-2 rounded-lg border border-ink-100 focus:outline-none focus:ring-2 focus:ring-brand-500/30" />
          </div>
          <div>
            <label className="text-sm text-ink-700">Password</label>
            <input name="password" type="password" required
              className="mt-1 w-full px-3 py-2 rounded-lg border border-ink-100 focus:outline-none focus:ring-2 focus:ring-brand-500/30" />
          </div>
          <button className="btn btn-primary w-full">Sign in</button>
        </form>
        <p className="text-xs text-ink-500 mt-4 text-center">
          <Link href="/dashboard" className="hover:underline">Continue without signing in (dev)</Link>
        </p>
      </div>
    </div>
  );
}
