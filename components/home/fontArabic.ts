import { IBM_Plex_Sans_Arabic } from 'next/font/google';

// Arabic type for the /ar pages only (a separate module, so the English page never loads it).
// It is the only family on Arabic pages (its Latin set covers numbers and the brand name).
export const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-arabic',
});
