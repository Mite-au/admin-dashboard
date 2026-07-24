'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

/**
 * Catch-all boundary for every admin page. Without it a failed RSC fetch
 * renders Next's bare "Application error: a server-side exception has
 * occurred" screen with no sidebar and no way back.
 *
 * Note: in production Next replaces the server error message with a generic
 * string and only ships the digest, so the digest is what to grep for in the
 * Vercel runtime logs.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[admin]', error);
  }, [error]);

  return (
    <div className="px-8 py-16 flex items-center justify-center">
      <div className="card-inner p-10 max-w-lg w-full flex flex-col items-center gap-4 text-center">
        <span className="rounded-2xl bg-ink-50 p-3 text-ink-700">
          <RefreshCw size={22} strokeWidth={1.75} />
        </span>
        <p className="text-lg font-semibold text-ink-900">This page couldn&apos;t load</p>
        <p className="text-sm text-ink-500 leading-6">
          The dashboard reached the backend but the request failed. This is usually a
          backend endpoint that is down or returning an unexpected shape.
        </p>
        {error.digest && (
          <p className="text-xs text-ink-400 font-mono break-all">digest: {error.digest}</p>
        )}
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={reset}
            className="rounded-full border border-ink-200 px-5 py-2 text-sm text-ink-700 hover:bg-ink-50 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/overview"
            className="rounded-full bg-ink-900 px-5 py-2 text-sm text-white hover:bg-ink-700 transition-colors"
          >
            Back to Overview
          </Link>
        </div>
      </div>
    </div>
  );
}
