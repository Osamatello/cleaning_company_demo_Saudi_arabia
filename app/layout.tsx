import type { Metadata } from 'next';
import './globals.css';
import { inter } from '@/components/home/fonts';

const DESCRIPTION =
  'From chaos to spotless. Premium deep cleaning for villas, apartments and offices across Riyadh: vetted specialists, eco-certified products and a spotless result, guaranteed.';

export const metadata: Metadata = {
  // absolute base for the share image and icon URLs
  metadataBase: new URL('https://cleaning-company-demo-saudi-arabia.vercel.app'),
  title: 'FreshSpaces | Premium Home & Villa Cleaning in Riyadh, Saudi Arabia',
  description: DESCRIPTION,
  keywords: ['Cleaning Company Riyadh', 'Villa Cleaning Saudi Arabia', 'Deep Cleaning Riyadh', 'FreshSpaces', 'Post Construction Cleaning'],
  openGraph: {
    type: 'website',
    siteName: 'FreshSpaces',
    title: 'FreshSpaces | Home & Villa Cleaning in Riyadh',
    description: DESCRIPTION,
    locale: 'en_SA',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FreshSpaces | Home & Villa Cleaning in Riyadh',
    description: DESCRIPTION,
  },
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
