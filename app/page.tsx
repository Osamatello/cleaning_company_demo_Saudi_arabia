import Header from '@/components/Header';
import HeroVideo from '@/components/HeroVideo';
import ServicesCarousel from '@/components/ServicesCarousel';
import TransformCTA from '@/components/TransformCTA';
import BeforeAfter from '@/components/home/BeforeAfter';
import HowItWorks from '@/components/home/HowItWorks';
import Testimonials from '@/components/home/Testimonials';
import Footer from '@/components/Footer';
import PauseOffscreen from '@/components/PauseOffscreen';

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-slate-900 overflow-x-clip">
      <PauseOffscreen />

      {/* Navigation Header */}
      <Header />

      {/* Hero: a film of the team at work, headline over it */}
      <HeroVideo />

      {/* Services carousel */}
      <ServicesCarousel />

      {/* Proof, process and praise: one continuous run into the booking section */}
      <BeforeAfter />
      <HowItWorks />
      <Testimonials />

      {/* Booking CTA & Value Propositions */}
      <TransformCTA />

      {/* Footer */}
      <Footer />
    </main>
  );
}
