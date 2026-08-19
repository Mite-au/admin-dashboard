'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { RefreshCw, TriangleAlert } from 'lucide-react';

/**
 * Boundary for one user record. Mirrors the admin-wide boundary, narrowed to
 * the two things that actually go wrong here: the id doesn't resolve, or the
 * user endpoint failed.
 *
 * In production Next replaces the server message with a generic string and
 * ships only the digest — that digest is what to grep for in the runtime logs.
 */
export default function UserDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[user-detail]', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-8 py-16">
      <div className="flex w-full max-w-lg flex-col items-center text-center">
        <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-panel bg-warning-50 text-warning">
          <TriangleAlert size={22} strokeWidth={1.9} />
        </span>

        <h1 className="text-title font-bold text-ink-900">This user didn&apos;t load</h1>
        <p className="mt-2 text-data leading-relaxed text-ink-500">
          The account may have been deleted, or the user endpoint returned an error.
          The list is still the fastest way back to a working record.
        </p>

        {(error.message || error.digest) && (
          <div className="mt-5 w-full rounded-panel border border-ink-200 bg-ink-50 px-4 py-3 text-left">
            {error.message && (
              <p className="break-words font-mono text-xs leading-relaxed text-ink-700">
                {error.message}
              </p>
            )}
            {error.digest && (
              <p className="mt-1.5 break-all font-mono text-2xs text-ink-400">
                digest {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <button onClick={reset} className="btn btn-pill-dark">
            <RefreshCw size={15} strokeWidth={2} />
            Try again
          </button>
          <Link href="/users" className="btn btn-pill-ghost">
            Back to Users
          </Link>
        </div>
      </div>
    </div>
  );
}
