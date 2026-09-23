import Header from '@/components/Header';
import Hero3DCanvas from '@/components/Hero3DCanvas';
import ServicesCarousel from '@/components/ServicesCarousel';
import TransformCTA from '@/components/TransformCTA';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-slate-900 overflow-x-clip">
      {/* Navigation Header */}
      <Header />

      {/* 3D Scroll Hero Scene */}
      <Hero3DCanvas />

      {/* 3D Spinning Services Carousel */}
      <ServicesCarousel />

      {/* Booking CTA & Value Propositions */}
      <TransformCTA />

      {/* Footer */}
      <Footer />
    </main>
  );
}
