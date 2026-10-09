import Header from '@/components/Header';
import HeroVideo from '@/components/HeroVideo';
import ServicesPreview from '@/components/ServicesPreview';
import TransformCTA from '@/components/TransformCTA';
import About from '@/components/home/About';
import FAQ from '@/components/home/FAQ';
import BeforeAfter from '@/components/home/BeforeAfter';
import HowItWorks from '@/components/home/HowItWorks';
import Testimonials from '@/components/home/Testimonials';
import Footer from '@/components/Footer';
import PauseOffscreen from '@/components/PauseOffscreen';
import { ContentProvider } from '@/components/ContentProvider';
import type { Locale } from '@/content/types';

/** The homepage, in one language (the same page serves / and /ar). */
export default function HomePage({ locale }: { locale: Locale }) {
  return (
    <ContentProvider locale={locale}>
      <main className="min-h-screen bg-white text-slate-900 overflow-x-clip">
        <PauseOffscreen />

        {/* Navigation Header */}
        <Header />

        {/* Hero: a film of the team at work, headline over it */}
        <HeroVideo />

        {/* Services: cleaning, then home maintenance & repairs */}
        <ServicesPreview />

        {/* About us: the company, the team and the service */}
        <About />

        {/* Proof, process and praise */}
        <BeforeAfter />
        <HowItWorks />
        <Testimonials />

        {/* Frequently asked questions */}
        <FAQ />

        {/* Booking CTA & Value Propositions: the form closes the page */}
        <TransformCTA />

        {/* Footer */}
        <Footer />
      </main>
    </ContentProvider>
  );
}
