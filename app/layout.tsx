import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-white text-slate-900 antialiased selection:bg-sky-500 selection:text-white font-sans">
        {children}
      </body>
    </html>
  );
}
