import '../../globals.css';
import { plexArabic } from '@/components/home/fontArabic';
import { ar } from '@/content/ar';
import { metadataFor } from '@/content/metadata';

export const metadata = metadataFor(ar);

// Arabic: the same site, right to left, at /ar
export default function ArabicLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={plexArabic.variable}>
      <body className="bg-white text-slate-900 antialiased selection:bg-sky-500 selection:text-white font-sans">{children}</body>
    </html>
  );
}
