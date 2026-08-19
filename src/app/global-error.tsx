'use client';

import { useEffect } from 'react';

/**
 * Last-resort boundary: catches failures in the root layout, which the
 * per-segment error.tsx files can't reach. Renders its own <html>/<body>
 * because the root layout is what failed — which also means globals.css and
 * the Inter font are not guaranteed to be present, so every style here is
 * inline and the type falls back to the system stack.
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
      <body
        style={{
          margin: 0,
          background: '#f2efec',
          color: '#1a1614',
          fontFamily:
            'Inter, system-ui, -apple-system, "Segoe UI", "Helvetica Neue", sans-serif',
          WebkitFontSmoothing: 'antialiased',
        }}
      >
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
              border: '1px solid rgba(26,22,20,0.05)',
              borderRadius: '28px',
              padding: '40px 36px',
              maxWidth: '440px',
              width: '100%',
              textAlign: 'center',
              boxShadow:
                '0 1px 2px rgba(26,22,20,0.04), 0 8px 24px -8px rgba(26,22,20,0.08)',
            }}
          >
            {/* Served straight from /public, so it still resolves even though
                the app shell (and therefore next/image) is what failed. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/mite-wordmark.png"
              alt="MITE"
              width={92}
              height={28}
              style={{ display: 'block', margin: '0 auto 20px' }}
            />

            <h1
              style={{
                fontSize: '20px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                margin: '0 0 8px',
              }}
            >
              MITE Admin didn&apos;t start
            </h1>
            <p
              style={{
                fontSize: '13px',
                color: '#7a706b',
                margin: '0 0 20px',
                lineHeight: 1.6,
              }}
            >
              The app shell failed to render, so no page can load. Reload to try
              again.
            </p>

            {error.digest && (
              <p
                style={{
                  fontSize: '11px',
                  color: '#948a85',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  background: '#f8f6f4',
                  border: '1px solid #e3ddd8',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  margin: '0 0 20px',
                  wordBreak: 'break-all',
                }}
              >
                digest {error.digest}
              </p>
            )}

            <button
              onClick={reset}
              style={{
                borderRadius: '999px',
                border: 'none',
                background: '#1a1614',
                color: '#fff',
                padding: '11px 28px',
                fontSize: '14px',
                fontWeight: 500,
                fontFamily: 'inherit',
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
