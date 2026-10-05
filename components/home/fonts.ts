import { Inter, Instrument_Serif } from 'next/font/google';

// Same typeface and voice as the 3D Hero headline (light / italic grey / bold), plus an editorial
// serif for quotes and large numerals.
export const inter = Inter({ subsets: ['latin'], style: ['normal', 'italic'], display: 'swap' });
export const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], display: 'swap' });
