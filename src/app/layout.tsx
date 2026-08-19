import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import NextTopLoader from 'nextjs-toploader';
import './globals.css';

/**
 * Self-hosted by next/font at build time, so there is no runtime request to
 * Google. `adjustFontFallback` (on by default) generates a metric-matched
 * local fallback face, which is what keeps `display: swap` from shifting
 * layout while Inter loads.
 */
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'MITE Admin',
  description: 'Admin dashboard for the Mite marketplace',
};

export const viewport: Viewport = {
  themeColor: '#f2efec',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-page font-sans">
        {/* brand-500 — the logo ink. Kept literal because NextTopLoader takes
            a color string, not a CSS custom property. */}
        <NextTopLoader color="#ff4f40" height={2} showSpinner={false} shadow={false} />
        {children}
      </body>
    </html>
  );
}
