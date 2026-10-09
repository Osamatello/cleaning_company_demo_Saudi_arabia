import Header from '@/components/Header';
import ServicesCatalog from '@/components/ServicesCatalog';
import Footer from '@/components/Footer';
import { ContentProvider } from '@/components/ContentProvider';
import type { Locale } from '@/content/types';

/** The full list of services, in one language (the same page serves /services and /ar/services). */
export default function ServicesPage({ locale }: { locale: Locale }) {
  return (
    <ContentProvider locale={locale}>
      <main className="min-h-screen bg-white text-slate-900 overflow-x-clip">
        <Header page="services" />
        <ServicesCatalog />
        <Footer page="services" />
      </main>
    </ContentProvider>
  );
}
