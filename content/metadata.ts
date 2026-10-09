import type { Metadata } from 'next';
import type { SiteContent } from './types';

export const SITE_URL = 'https://cleaning-company-demo-saudi-arabia.vercel.app';

/** Page metadata for one language, with links to the other version for search engines. */
export function metadataFor(t: SiteContent): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    title: t.meta.title,
    description: t.meta.description,
    keywords: ['Cleaning Company Riyadh', 'Villa Cleaning Saudi Arabia', 'Deep Cleaning Riyadh', 'FreshSpaces', 'Post Construction Cleaning', 'شركة تنظيف بالرياض', 'تنظيف فلل'],
    alternates: {
      canonical: t.locale === 'ar' ? '/ar' : '/',
      languages: { en: '/', ar: '/ar', 'x-default': '/' },
    },
    openGraph: {
      type: 'website',
      siteName: 'FreshSpaces',
      title: t.meta.shareTitle,
      description: t.meta.description,
      locale: t.meta.ogLocale,
      alternateLocale: t.locale === 'ar' ? ['en_SA'] : ['ar_SA'],
      url: t.locale === 'ar' ? '/ar' : '/',
    },
    twitter: { card: 'summary_large_image', title: t.meta.shareTitle, description: t.meta.description },
  };
}
