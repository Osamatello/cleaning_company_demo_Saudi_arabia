import { IBM_Plex_Sans_Arabic } from 'next/font/google';

// Arabic type for the /ar pages only (a separate module, so the English page never loads it).
// globals.css puts it first in the font stack on Arabic pages.
export const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-arabic',
});
