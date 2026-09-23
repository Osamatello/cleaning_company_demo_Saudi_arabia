'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Shield, Star, CheckCircle, ArrowRight } from 'lucide-react';

interface ServiceItem {
  id: number;
  title: string;
  category: string;
  description: string;
  badge: string;
  color: string;
  image: string;
  features: string[];
}

const services: ServiceItem[] = [
  {
    id: 1,
    title: 'Villa Deep Cleaning',
    category: 'Residential',
    description: 'Comprehensive deep steam sanitation, kitchen degreasing, and detailed room scrubbing for luxury Riyadh villas.',
    badge: 'Popular Choice',
    color: 'from-sky-500 to-blue-600',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    features: ['High-temp Steam Sanitization', 'Full Kitchen Degreasing', 'Balcony & Patio Power Wash']
  },
  {
    id: 2,
    title: 'Post-Construction Restoration',
    category: 'Commercial & Residential',
    description: 'Complete removal of plaster dust, grout film, paint splatters, and construction debris for new handovers.',
    badge: 'Heavy Duty',
    color: 'from-cyan-500 to-teal-600',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
    features: ['Paint Splatter Removal', 'Industrial HEPA Dust Extraction', 'Window Track Scrubbing']
  },
  {
    id: 3,
    title: 'Upholstery & Carpet Steam Care',
    category: 'Specialized',
    description: 'Deep hot-water extraction destroying 99.9% of dust mites, deep-seated stains, and desert dust from sofas & rugs.',
    badge: 'Allergen Free',
    color: 'from-emerald-500 to-teal-700',
    image: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=800&q=80',
    features: ['Organic Stain Neutralizer', 'Fabric Fiber Protection', 'Rapid 2-Hour Dry Time']
  },
  {
    id: 4,
    title: 'Marble & Stone Floor Polishing',
    category: 'Restoration',
    description: 'Diamond pad honing, crystallization, and high-gloss sealing to restore mirror clarity on Saudi marble floors.',
    badge: 'Mirror Finish',
    color: 'from-amber-500 to-orange-600',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
    features: ['Diamond Disc Grinding', 'Anti-Slip Gloss Crystallization', 'Sealant Stain Guard']
  },
  {
    id: 5,
    title: 'Facade & Window Cleaning',
    category: 'Exterior',
    description: 'High-reach deionized pure water glass washing for spotless streak-free panoramic windows and building exteriors.',
    badge: 'Streak-Free',
    color: 'from-indigo-500 to-sky-600',
    image: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=800&q=80',
    features: ['Deionized Pure Water', 'High-Reach Water Pole System', 'Solar Panel Cleaning']
  },
  {
    id: 6,
    title: 'Disinfection & Sanitization',
    category: 'Health & Safety',
    description: 'Hospital-grade electrostatic fogging and anti-viral misting for safe, germ-free homes, offices, and schools.',
    badge: 'Certified Safe',
    color: 'from-purple-500 to-indigo-600',
    image: 'https://images.unsplash.com/photo-1584634731339-252c581abfc5?auto=format&fit=crop&w=800&q=80',
    features: ['Non-Toxic Eco Misting', 'Hospital-Grade Disinfectant', 'Safe for Children & Pets']
  }
];

export default function ServicesCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoSpin, setIsAutoSpin] = useState(true);

  // Auto-rotate carousel every 4 seconds unless hovered
  useEffect(() => {
    if (!isAutoSpin) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % services.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isAutoSpin]);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + services.length) % services.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % services.length);
  };

  return (
    <section id="services" className="relative py-24 md:py-32 bg-white overflow-hidden border-t border-slate-100">
      {/* Background Lighting Gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header Matching Video Reference */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-widest text-sky-600 mb-3">
              <span className="w-4 h-[2px] bg-sky-400"></span>
              <span>WHAT WE DO</span>
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight font-sans">
              Services
            </h2>
          </div>

          <p className="text-slate-500 text-sm sm:text-base max-w-md font-normal leading-relaxed">
            30+ years of professional cleaning expertise tailored to luxury homes, villas, and corporate offices across every corner of Riyadh.
          </p>
        </div>

        {/* 3D Spinning Carousel (3D Coverflow Container) */}
        <div
          className="relative min-h-[520px] sm:min-h-[560px] flex items-center justify-center perspective-1000 my-8"
          onMouseEnter={() => setIsAutoSpin(false)}
          onMouseLeave={() => setIsAutoSpin(true)}
        >
          {services.map((service, index) => {
            // Calculate distance relative to active index
            const count = services.length;
            let offset = (index - activeIndex + count) % count;
            if (offset > count / 2) offset -= count;

            const isActive = offset === 0;
            const absOffset = Math.abs(offset);

            // 3D positioning styles matching user reference image
            let translateX = offset * 280; // Distance spread
            let rotateY = offset * -25; // Curved perspective rotation
            let translateZ = -absOffset * 180; // Depth push back
            let scale = isActive ? 1.05 : Math.max(0.75, 1 - absOffset * 0.15);
            let opacity = absOffset > 2 ? 0 : Math.max(0.4, 1 - absOffset * 0.3);
            let zIndex = 20 - absOffset * 5;

            return (
              <div
                key={service.id}
                onClick={() => setActiveIndex(index)}
                className={`absolute w-[300px] sm:w-[360px] cursor-pointer transition-all duration-700 ease-out transform-gpu ${
                  isActive ? 'pointer-events-auto' : 'pointer-events-auto hover:opacity-100'
                }`}
                style={{
                  transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                  opacity: opacity,
                  zIndex: zIndex,
                }}
              >
                {/* Service Card */}
                <div
                  className={`relative rounded-3xl overflow-hidden glass-panel border transition-all duration-300 ${
                    isActive
                      ? 'border-sky-400/50 shadow-2xl shadow-sky-500/25 ring-2 ring-sky-400/30'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Image Banner */}
                  <div className="relative h-48 sm:h-56 w-full overflow-hidden">
                    <img
                      src={service.image}
                      alt={service.title}
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent"></div>

                    {/* Badge */}
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-white/85 text-sky-700 border border-sky-400/30 rounded-full backdrop-blur-md">
                        {service.badge}
                      </span>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4">
                      <span className="text-xs font-mono font-semibold text-sky-600 uppercase tracking-wider">
                        {service.category}
                      </span>
                      <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{service.title}</h3>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-6">
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{service.description}</p>

                    {/* Features List */}
                    <ul className="mt-4 space-y-2 border-t border-slate-200 pt-4">
                      {service.features.map((feat, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-slate-600">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Action Link */}
                    <div className="mt-6 flex items-center justify-between">
                      <a
                        href="#contact"
                        className="inline-flex items-center gap-2 text-xs font-bold text-sky-600 hover:text-slate-900 transition-colors group"
                      >
                        <span>Book Service</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Carousel Navigation Buttons */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={handlePrev}
            className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-sky-500/20 hover:border-sky-500/40 transition-all active:scale-95"
            aria-label="Previous Service"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Dots Indicator */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 border border-slate-200 backdrop-blur-md">
            {services.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === activeIndex ? 'w-6 bg-sky-400' : 'w-2 bg-slate-600 hover:bg-slate-400'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-sky-500/20 hover:border-sky-500/40 transition-all active:scale-95"
            aria-label="Next Service"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </section>
  );
}
