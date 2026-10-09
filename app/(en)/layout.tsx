import '../globals.css';
import { inter } from '@/components/home/fonts';
import { en } from '@/content/en';
import { metadataFor } from '@/content/metadata';

export const metadata = metadataFor(en);

// English: the default site at /
export default function EnglishLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={inter.variable}>
      <body className="bg-white text-slate-900 antialiased selection:bg-sky-500 selection:text-white font-sans">{children}</body>
    </html>
  );
}
