import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MITE Admin',
  description: 'Admin dashboard for the Mite marketplace',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-page">{children}</body>
    </html>
  );
}
