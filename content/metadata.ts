import type { Metadata } from 'next';
import type { SiteContent } from './types';

export const SITE_URL = 'https://deepclean-pestcontrol-alain.vercel.app';

/** Page metadata for one language, with links to the other version for search engines. */
export function metadataFor(t: SiteContent): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    title: t.meta.title,
    description: t.meta.description,
    keywords: ['Deep Cleaning Al Ain', 'Pest Control Al Ain', 'Cleaning Company Al Ain', 'Villa Cleaning UAE', 'Termite Treatment Al Ain', 'تنظيف عميق العين', 'مكافحة الحشرات العين'],
    alternates: {
      canonical: t.locale === 'ar' ? '/ar' : '/',
      languages: { en: '/', ar: '/ar', 'x-default': '/' },
    },
    openGraph: {
      type: 'website',
      siteName: t.brand.name,
      title: t.meta.shareTitle,
      description: t.meta.description,
      locale: t.meta.ogLocale,
      alternateLocale: t.locale === 'ar' ? ['en_AE'] : ['ar_AE'],
      url: t.locale === 'ar' ? '/ar' : '/',
    },
    twitter: { card: 'summary_large_image', title: t.meta.shareTitle, description: t.meta.description },
  };
}

/** The same for the services page (/services and /ar/services). */
export function servicesMetadataFor(t: SiteContent): Metadata {
  const { title, description } = t.servicesPage.meta;
  const url = t.locale === 'ar' ? '/ar/services' : '/services';
  return {
    title,
    description,
    alternates: { canonical: url, languages: { en: '/services', ar: '/ar/services', 'x-default': '/services' } },
    openGraph: {
      type: 'website',
      siteName: t.brand.name,
      title,
      description,
      locale: t.meta.ogLocale,
      alternateLocale: t.locale === 'ar' ? ['en_AE'] : ['ar_AE'],
      url,
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}
