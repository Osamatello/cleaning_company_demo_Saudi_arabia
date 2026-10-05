import { Inter } from 'next/font/google';

// The one typeface for the whole homepage (the same as the 3D Hero headline); hierarchy comes
// from size and weight only.
export const inter = Inter({ subsets: ['latin'], style: ['normal', 'italic'], display: 'swap', variable: '--font-inter' });
