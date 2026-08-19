'use client';

import { useState } from 'react';
import { CircleAlert, Loader2 } from 'lucide-react';

export function LoginForm() {
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
      // Deliberately does not say which of the two was wrong.
      setError("That email and password don't match an admin account.");
      setLoading(false);
      return;
    }
    // Full-page navigation so the browser does a fresh request with the
    // newly-set admin_token cookie. Using router.push + router.refresh here
    // races the client cache against middleware and can hang on the first
    // login until the user manually refreshes.
    window.location.assign('/users');
  }

  return (
    <>
      <h1 className="text-title font-bold text-ink-900">Sign in</h1>
      <p className="mt-1.5 text-data text-ink-500">
        Use your MITE admin account to continue.
      </p>

      <form onSubmit={onSubmit} className="mt-7 space-y-4">
        <div>
          <label htmlFor="email" className="label-micro mb-1.5 block">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            disabled={loading}
            autoComplete="email"
            autoFocus
            placeholder="you@mite.app"
            aria-invalid={error ? true : undefined}
            className="pill-input"
          />
        </div>

        <div>
          <label htmlFor="password" className="label-micro mb-1.5 block">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            disabled={loading}
            autoComplete="current-password"
            placeholder="••••••••"
            aria-invalid={error ? true : undefined}
            className="pill-input"
          />
        </div>

        {error && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-panel bg-danger-50 px-3.5 py-2.5 text-data text-danger-700"
          >
            <CircleAlert size={16} strokeWidth={2} className="mt-px shrink-0" />
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary-pill mt-2 w-full py-3"
        >
          {loading && <Loader2 size={16} strokeWidth={2.2} className="animate-spin" />}
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 border-t border-ink-100 pt-5 text-center text-xs leading-relaxed text-ink-500">
        Locked out? Ask another admin to reset your password.
      </p>
    </>
  );
}
