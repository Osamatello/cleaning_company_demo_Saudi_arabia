import type { Metadata } from 'next';
import './globals.css';
import { inter } from '@/components/home/fonts';

export const metadata: Metadata = {
  title: 'FreshSpaces | Premium Home & Villa Cleaning in Riyadh, Saudi Arabia',
  description: 'From chaos to spotless. Riyadh’s premier 3D-driven deep cleaning service for luxury villas, modern apartments, and commercial spaces.',
  keywords: ['Cleaning Company Riyadh', 'Villa Cleaning Saudi Arabia', 'Deep Cleaning Riyadh', 'FreshSpaces', 'Post Construction Cleaning'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-white text-slate-900 antialiased selection:bg-sky-500 selection:text-white font-sans">
        {children}
      </body>
    </html>
  );
}
