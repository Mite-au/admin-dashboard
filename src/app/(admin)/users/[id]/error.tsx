'use client';

import Link from 'next/link';
import { useEffect } from 'react';

function parseStatus(error: Error): { status: number; message: string } {
  try {
    const parsed = JSON.parse(error.message);
    return {
      status: parsed.status ?? 500,
      message: parsed.message ?? 'An unexpected error occurred.',
    };
  } catch {
    return { status: 500, message: error.message || 'An unexpected error occurred.' };
  }
}

export default function UserDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[UserDetail]', error);
  }, [error]);

  const { status, message } = parseStatus(error);

  return (
    <div className="px-8 pb-8 flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="card-inner p-10 flex flex-col items-center gap-4 max-w-md w-full text-center">
        <span className="text-4xl font-bold text-ink-300">{status}</span>
        <p className="text-base font-semibold text-ink-900">
          {status === 404 ? 'User not found' : 'Something went wrong'}
        </p>
        <p className="text-sm text-ink-500 break-words">{message}</p>
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={reset}
            className="rounded-full border border-ink-200 px-5 py-2 text-sm text-ink-700 hover:bg-ink-50 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/users"
            className="rounded-full bg-ink-900 px-5 py-2 text-sm text-white hover:bg-ink-700 transition-colors"
          >
            Back to Users
          </Link>
        </div>
      </div>
    </div>
  );
}
