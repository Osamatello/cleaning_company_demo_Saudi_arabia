'use client';

import React, { useState, useEffect, useRef } from 'react';
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

// Ring geometry: each card sits on a circle around a point behind the active one.
const STEP_DEG = 34;
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

export default function ServicesCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoSpin, setIsAutoSpin] = useState(true);
  const [radius, setRadius] = useState(560);
  const prevActive = useRef(0);

  useEffect(() => {
    const fit = () => setRadius(window.innerWidth < 640 ? 360 : 560);
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);
  useEffect(() => {
    prevActive.current = activeIndex;
  }, [activeIndex]);

  // swipe / drag the ring
  const drag = useRef<{ x: number; id: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, id: e.pointerId };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 50) (dx < 0 ? handleNext : handlePrev)();
  };

  // the active card leans gently towards the pointer
  const tilt = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transition = 'transform 200ms ease-out';
    el.style.transform = `rotateX(${(-py * 7).toFixed(2)}deg) rotateY(${(px * 9).toFixed(2)}deg)`;
    el.style.setProperty('--gx', `${((px + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty('--gy', `${((py + 0.5) * 100).toFixed(1)}%`);
  };
  const untilt = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transition = `transform 900ms ${EASE}`;
    e.currentTarget.style.transform = '';
  };

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
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-sky-600 mb-3">
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
          className="relative min-h-[520px] sm:min-h-[560px] flex items-center justify-center perspective-1000 my-8 select-none"
          style={{ touchAction: 'pan-y' }}
          onMouseEnter={() => setIsAutoSpin(false)}
          onMouseLeave={() => setIsAutoSpin(true)}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (drag.current = null)}
        >
          {/* the orbit the cards travel on, and a pool of light under the card in front */}
          <svg aria-hidden className="pointer-events-none absolute left-1/2 top-[74%] h-[200px] w-[1180px] -translate-x-1/2" viewBox="0 0 1180 200" fill="none">
            <defs>
              <linearGradient id="svc-orbit" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#38bdf8" stopOpacity="0" />
                <stop offset="0.5" stopColor="#38bdf8" stopOpacity="0.55" />
                <stop offset="1" stopColor="#34d399" stopOpacity="0" />
              </linearGradient>
            </defs>
            <ellipse cx="590" cy="100" rx="560" ry="70" stroke="url(#svc-orbit)" strokeWidth="1.2" />
            <ellipse cx="590" cy="100" rx="470" ry="52" stroke="#cbd5e1" strokeOpacity="0.5" strokeWidth="1" strokeDasharray="2 8" />
          </svg>
          <div aria-hidden className="pointer-events-none absolute left-1/2 top-[82%] h-16 w-[340px] -translate-x-1/2 rounded-[50%] bg-sky-500/25 blur-2xl" />
          <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.18),transparent_65%)]" />
          {services.map((service, index) => {
            // position on the ring relative to the active card
            const count = services.length;
            const ringOffset = (from: number) => {
              const o = (index - from + count) % count;
              return o > count / 2 ? o - count : o;
            };
            const offset = ringOffset(activeIndex);
            // a card crossing the hidden back of the ring jumps there instead of sweeping across the front
            const wrapped = Math.abs(offset - ringOffset(prevActive.current)) > 1;

            const isActive = offset === 0;
            const absOffset = Math.abs(offset);
            const angle = offset * STEP_DEG;
            const rad = (angle * Math.PI) / 180;
            const translateX = Math.sin(rad) * radius;
            const translateZ = (Math.cos(rad) - 1) * radius;
            const rotateY = -angle * 0.75; // turned in towards the viewer
            const scale = isActive ? 1 : 0.94;
            const zIndex = 20 - absOffset * 5;
            // side cards stay solid and recede into a soft white haze instead of turning see-through
            const haze = isActive ? 0 : absOffset === 1 ? 0.38 : 0.62;

            return (
              <div
                key={service.id}
                onClick={() => setActiveIndex(index)}
                className="group/card absolute w-[300px] sm:w-[360px] cursor-pointer will-change-transform"
                style={{
                  transform: `translate3d(${translateX.toFixed(1)}px, ${isActive ? -8 : 0}px, ${translateZ.toFixed(1)}px) rotateY(${rotateY}deg) scale(${scale})`,
                  opacity: absOffset > 2 ? 0 : 1,
                  zIndex,
                  pointerEvents: absOffset > 2 ? 'none' : 'auto',
                  transition: wrapped ? 'none' : `transform 1100ms ${EASE}, opacity 700ms ${EASE}`,
                }}
              >
                {/* gentle float for the card in front, then the pointer tilt */}
                <div className={isActive ? 'svc-float' : ''}>
                <div
                  className="relative"
                  onMouseMove={isActive ? tilt : undefined}
                  onMouseLeave={isActive ? untilt : undefined}
                >
                {/* living gradient edge on the active card */}
                <div
                  aria-hidden
                  className="svc-edge absolute -inset-[1.5px] rounded-[25.5px] transition-opacity duration-700"
                  style={{ opacity: isActive ? 1 : 0 }}
                />
                {/* Service Card */}
                <div
                  className={`relative rounded-3xl overflow-hidden glass-panel border transition-[border-color,box-shadow] duration-700 ${
                    isActive
                      ? 'border-transparent shadow-[0_40px_80px_-30px_rgba(2,132,199,0.45),0_12px_30px_-12px_rgba(15,23,42,0.18)]'
                      : 'border-slate-200 group-hover/card:border-slate-300'
                  }`}
                >
                  {/* soft light following the pointer */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 z-20 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
                    style={{ background: isActive ? 'radial-gradient(420px circle at var(--gx,50%) var(--gy,30%), rgba(255,255,255,0.35), transparent 60%)' : 'none' }}
                  />
                  {/* Image Banner */}
                  <div className="relative h-48 sm:h-56 w-full overflow-hidden">
                    <img
                      src={service.image}
                      alt={service.title}
                      className={`w-full h-full object-cover transition-transform duration-[1400ms] ease-out ${
                        isActive ? 'scale-105 group-hover/card:scale-110' : 'scale-100'
                      }`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent"></div>

                    {/* Badge */}
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-white/85 text-sky-700 border border-sky-400/30 rounded-full backdrop-blur-md">
                        {service.badge}
                      </span>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4">
                      <span className="text-xs font-semibold text-sky-600 uppercase tracking-wider">
                        {service.category}
                      </span>
                      <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{service.title}</h3>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div
                    className="p-6 transition-[opacity,transform] duration-700"
                    style={{ opacity: isActive ? 1 : 0.7, transform: isActive ? 'none' : 'translateY(6px)', transitionDelay: isActive ? '150ms' : '0ms' }}
                  >
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

                  {/* depth haze for the cards turning away; it lifts a little on hover */}
                  <div
                    className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-b from-white/90 to-white opacity-[var(--haze)] group-hover/card:opacity-[calc(var(--haze)*0.45)]"
                    style={{ '--haze': haze, transition: `opacity 900ms ${EASE}` } as React.CSSProperties}
                  />
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
                className={`relative h-2 overflow-hidden rounded-full transition-all duration-500 ${
                  i === activeIndex ? 'w-10 bg-sky-100' : 'w-2 bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              >
                {/* fills while the ring waits to turn */}
                {i === activeIndex && (
                  <span
                    key={`${activeIndex}-${isAutoSpin}`}
                    className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-sky-500 to-emerald-400 ${isAutoSpin ? 'svc-progress' : 'w-full'}`}
                  />
                )}
              </button>
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
