import type { Metadata } from 'next';
import NextTopLoader from 'nextjs-toploader';
import './globals.css';

export const metadata: Metadata = {
  title: 'MITE Admin',
  description: 'Admin dashboard for the Mite marketplace',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-page">
        <NextTopLoader color="#ff6a3d" height={3} showSpinner={false} shadow={false} />
        {children}
      </body>
    </html>
  );
}
