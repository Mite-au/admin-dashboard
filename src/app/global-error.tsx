'use client';

import { useEffect } from 'react';

/**
 * Last-resort boundary: catches failures in the root layout, which the
 * per-segment error.tsx files can't reach. Renders its own <html>/<body>
 * because the root layout is what failed.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[global]', error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#f5f5f4', fontFamily: 'system-ui, sans-serif' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '40px',
              maxWidth: '480px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}
          >
            <h1 style={{ fontSize: '18px', margin: '0 0 12px' }}>Something went wrong</h1>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 20px', lineHeight: 1.6 }}>
              MITE Admin failed to render. Reload to try again.
            </p>
            {error.digest && (
              <p style={{ fontSize: '12px', color: '#9ca3af', fontFamily: 'monospace' }}>
                digest: {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              style={{
                marginTop: '12px',
                borderRadius: '999px',
                border: 'none',
                background: '#1c1917',
                color: '#fff',
                padding: '10px 22px',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Reload
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
