'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const res = await fetch('/api/login', {
      method: 'POST',
      body: form,
    });

    if (!res.ok) {
      setError('Invalid email or password.');
      setLoading(false);
      return;
    }
    router.push('/users');
    router.refresh();
  }

  return (
    <div className="w-full max-w-md">
      <h1 className="text-3xl font-bold mb-10">Sign in</h1>

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-ink-900 mb-2">Account</label>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="Enter Account"
            className="pill-input"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-ink-900 mb-2">Password</label>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••"
            className="pill-input"
          />
        </div>

        {error && (
          <p className="text-sm text-danger">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary-pill w-full py-3.5 mt-4 disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Continue'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        <a href="#" className="hover:text-ink-900">Password Reset Request</a>
      </p>
    </div>
  );
}
