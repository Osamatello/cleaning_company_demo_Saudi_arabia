'use client';

import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
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
    image: '/images/services/villa-deep-cleaning.webp',
    features: ['High-temp Steam Sanitization', 'Full Kitchen Degreasing', 'Balcony & Patio Power Wash']
  },
  {
    id: 2,
    title: 'Post-Construction Restoration',
    category: 'Commercial & Residential',
    description: 'Complete removal of plaster dust, grout film, paint splatters, and construction debris for new handovers.',
    badge: 'Heavy Duty',
    color: 'from-cyan-500 to-teal-600',
    image: '/images/services/post-construction.webp',
    features: ['Paint Splatter Removal', 'Industrial HEPA Dust Extraction', 'Window Track Scrubbing']
  },
  {
    id: 3,
    title: 'Upholstery & Carpet Steam Care',
    category: 'Specialized',
    description: 'Deep hot-water extraction destroying 99.9% of dust mites, deep-seated stains, and desert dust from sofas & rugs.',
    badge: 'Allergen Free',
    color: 'from-emerald-500 to-teal-700',
    image: '/images/services/upholstery-carpet.webp',
    features: ['Organic Stain Neutralizer', 'Fabric Fiber Protection', 'Rapid 2-Hour Dry Time']
  },
  {
    id: 4,
    title: 'Marble & Stone Floor Polishing',
    category: 'Restoration',
    description: 'Diamond pad honing, crystallization, and high-gloss sealing to restore mirror clarity on Saudi marble floors.',
    badge: 'Mirror Finish',
    color: 'from-amber-500 to-orange-600',
    image: '/images/services/marble-polishing.webp',
    features: ['Diamond Disc Grinding', 'Anti-Slip Gloss Crystallization', 'Sealant Stain Guard']
  },
  {
    id: 5,
    title: 'Facade & Window Cleaning',
    category: 'Exterior',
    description: 'High-reach deionized pure water glass washing for spotless streak-free panoramic windows and building exteriors.',
    badge: 'Streak-Free',
    color: 'from-indigo-500 to-sky-600',
    image: '/images/services/facade-windows.webp',
    features: ['Deionized Pure Water', 'High-Reach Water Pole System', 'Solar Panel Cleaning']
  },
  {
    id: 6,
    title: 'Disinfection & Sanitization',
    category: 'Health & Safety',
    description: 'Hospital-grade electrostatic fogging and anti-viral misting for safe, germ-free homes, offices, and schools.',
    badge: 'Certified Safe',
    color: 'from-purple-500 to-indigo-600',
    image: '/images/services/disinfection.webp',
    features: ['Non-Toxic Eco Misting', 'Hospital-Grade Disinfectant', 'Safe for Children & Pets']
  }
];

// Card titles, shared with the footer so its service links always match the cards
export const SERVICE_TITLES = services.map((s) => s.title);
// other parts of the page can bring a card to the front: dispatchEvent(new CustomEvent(SELECT_SERVICE, { detail: index }))
export const SELECT_SERVICE = 'services:select';

// Ring geometry: each card sits on a circle around a point behind the active one.
const STEP_DEG = 34;

// pager: 8px dots 8px apart, the active one a 40px pill (dots after it shift right to make room)
const dotX = (i: number, active: number) => i * 16 + (i > active ? 32 : 0);

/**
 * Bottom panel of a card. The details below the title are always laid out; on the side cards the
 * panel simply slides down by their height (a transform, so moving it costs no layout or paint).
 */
function SlidePanel({ active, header, children }: { active: boolean; header: React.ReactNode; children: React.ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  const details = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const p = panel.current;
    const d = details.current;
    if (!p || !d) return;
    const set = () => p.style.setProperty('--dh', `${d.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(d);
    return () => ro.disconnect();
  }, []);
  return (
    <div
      ref={panel}
      className="absolute inset-x-3 bottom-3 rounded-[22px] border border-white/60 bg-white/[0.93] p-5 will-change-transform sm:p-6"
      style={{ transform: active ? 'translateY(0)' : 'translateY(calc(var(--dh, 0px) + 12px))', transition: `transform 900ms ${EASE}` }}
    >
      {header}
      <div
        ref={details}
        style={{ opacity: active ? 1 : 0, willChange: 'opacity', transition: `opacity ${active ? '700ms 200ms' : '300ms'} ${EASE}` }}
      >
        {children}
      </div>
    </div>
  );
}
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

export default function ServicesCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoSpin, setIsAutoSpin] = useState(true);
  const [radius, setRadius] = useState(560);
  const prevActive = useRef(0);

  useEffect(() => {
    const fit = () => setRadius(window.innerWidth < 640 ? 380 : 700);
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);
  useEffect(() => {
    prevActive.current = activeIndex;
  }, [activeIndex]);
  useEffect(() => {
    const onSelect = (e: Event) => {
      const i = (e as CustomEvent<number>).detail;
      if (typeof i === 'number') setActiveIndex(i);
    };
    window.addEventListener(SELECT_SERVICE, onSelect);
    return () => window.removeEventListener(SELECT_SERVICE, onSelect);
  }, []);

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

  // the ring only turns by itself while it is on screen: turning it unseen would still cost frames
  const sectionRef = useRef<HTMLElement>(null);
  const [onScreen, setOnScreen] = useState(false);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const autoSpin = isAutoSpin && onScreen;

  // Auto-rotate carousel every 4 seconds unless hovered
  useEffect(() => {
    if (!autoSpin) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % services.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [autoSpin]);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + services.length) % services.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % services.length);
  };

  return (
    <section ref={sectionRef} id="services" className="relative pt-14 pb-28 md:pt-16 md:pb-32 bg-white overflow-hidden">
      {/* the hero's grey stage fades softly into the white page */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-[#e1e4e8] to-white" />
      {/* Background Lighting Gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-[radial-gradient(closest-side,rgba(14,165,233,0.10),transparent)] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header Matching Video Reference */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 md:mb-10">
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
          className="relative min-h-[470px] sm:min-h-[650px] flex items-center justify-center perspective-1000 my-4 select-none"
          style={{ touchAction: 'pan-y' }}
          onMouseEnter={() => setIsAutoSpin(false)}
          onMouseLeave={() => setIsAutoSpin(true)}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (drag.current = null)}
        >
          {/* the orbit the cards travel on, and a pool of light under the card in front */}
          <svg aria-hidden className="pointer-events-none absolute left-1/2 top-[calc(100%+64px)] h-[100px] w-[1180px] -translate-x-1/2" viewBox="0 0 1180 100" fill="none">
            <defs>
              <linearGradient id="svc-orbit" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#38bdf8" stopOpacity="0" />
                <stop offset="0.5" stopColor="#38bdf8" stopOpacity="0.55" />
                <stop offset="1" stopColor="#34d399" stopOpacity="0" />
              </linearGradient>
            </defs>
            <ellipse cx="590" cy="50" rx="560" ry="34" stroke="url(#svc-orbit)" strokeWidth="1.2" />
            <ellipse cx="590" cy="50" rx="470" ry="26" stroke="#cbd5e1" strokeOpacity="0.5" strokeWidth="1" strokeDasharray="2 8" />
          </svg>
          <div aria-hidden className="pointer-events-none absolute left-1/2 top-[90%] h-24 w-[520px] -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(14,165,233,0.22),transparent)]" />
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
                // the card hidden at the back ignores clicks here rather than through pointer-events,
                // which is inherited and would restyle the whole card on every change
                onClick={() => absOffset <= 2 && setActiveIndex(index)}
                className="group/card absolute w-[290px] sm:w-[440px] cursor-pointer will-change-transform"
                style={{
                  transform: `translate3d(${translateX.toFixed(1)}px, ${isActive ? -8 : 0}px, ${translateZ.toFixed(1)}px) rotateY(${rotateY}deg) scale(${scale})`,
                  opacity: absOffset > 2 ? 0 : 1,
                  zIndex,
                  transition: wrapped ? 'none' : `transform 1100ms ${EASE}, opacity 700ms ${EASE}`,
                }}
              >
                {/* the pointer tilt; a permanent layer, so neither tilting nor a change of card ever repaints it */}
                <div
                  className="relative will-change-transform"
                  onMouseMove={isActive ? tilt : undefined}
                  onMouseLeave={isActive ? untilt : undefined}
                >
                {/* living gradient edge and deep shadow of the active card, faded in on the compositor */}
                <div
                  aria-hidden
                  className="svc-edge absolute -inset-[1.5px] rounded-[31.5px] transition-opacity duration-700 will-change-[opacity]"
                  style={{ opacity: isActive ? 1 : 0 }}
                />
                {/* Service Card: a tall, image-led portrait with a frosted panel (its paint never changes) */}
                <div className="relative aspect-[3/4] overflow-hidden rounded-[30px] bg-slate-200 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.35)] [contain:layout_paint]">
                  <img
                    src={service.image}
                    alt={service.title}
                    width={720}
                    height={960}
                    decoding="async"
                    draggable={false}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-slate-950/5 to-slate-950/25" />

                  {/* soft light under the pointer: always mounted and never restyled, so a change of
                      card repaints nothing (it only fades in on hover) */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 z-20 bg-[radial-gradient(460px_circle_at_var(--gx,50%)_var(--gy,30%),rgba(255,255,255,0.28),transparent_60%)] opacity-0 transition-opacity duration-500 will-change-[opacity] group-hover/card:opacity-100"
                  />

                  {/* index and badge */}
                  <div className="absolute inset-x-5 top-5 flex items-center justify-between text-white">
                    <span className="text-[11px] font-medium tabular-nums tracking-[0.3em]">
                      {String(index + 1).padStart(2, '0')}
                      <span className="text-white/55"> / {String(count).padStart(2, '0')}</span>
                    </span>
                    <span className="rounded-full border border-white/30 bg-slate-900/30 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.22em]">
                      {service.badge}
                    </span>
                  </div>

                  {/* frosted panel: title always, details slide up on the card in front */}
                  <SlidePanel
                    active={isActive}
                    header={
                      <>
                        <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-sky-700">{service.category}</p>
                        <h3 className="mt-1.5 text-[21px] font-semibold leading-tight tracking-[-0.02em] text-slate-900 sm:text-[26px]">
                          {service.title}
                        </h3>
                      </>
                    }
                  >
                        <p className="mt-2.5 line-clamp-1 text-[13px] leading-relaxed text-slate-600">{service.description}</p>
                        <ul className="mt-3 flex flex-wrap gap-1.5">
                          {service.features.map((feat) => (
                            <li key={feat} className="flex items-center gap-1.5 rounded-full bg-slate-900/[0.05] px-2.5 py-1 text-[11px] text-slate-700">
                              <CheckCircle className="h-3 w-3 shrink-0 text-emerald-600" />
                              {feat}
                            </li>
                          ))}
                        </ul>
                        <a
                          href="#contact"
                          className="group/cta mt-4 flex items-center justify-between border-t border-slate-900/10 pt-4 text-[13px] font-medium text-slate-900"
                        >
                          Book this service
                          <span className="grid h-10 w-10 place-items-center rounded-full bg-slate-900 text-white transition-all duration-500 group-hover/cta:bg-gradient-to-br group-hover/cta:from-sky-500 group-hover/cta:to-emerald-400 group-hover/cta:rotate-[-35deg]">
                            <ArrowRight className="h-4 w-4" />
                          </span>
                        </a>
                  </SlidePanel>

                  {/* depth haze for the cards turning away; it lifts a little on hover */}
                  <div
                    className="pointer-events-none absolute inset-0 rounded-[30px] bg-gradient-to-b from-white/90 to-white will-change-[opacity] opacity-[var(--haze)] group-hover/card:opacity-[calc(var(--haze)*0.45)]"
                    style={{ '--haze': haze, transition: `opacity 900ms ${EASE}` } as React.CSSProperties}
                  />
                </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Carousel Navigation Buttons */}
        <div className="flex items-center justify-center gap-4 mt-4">
          <button
            onClick={handlePrev}
            className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-sky-500/20 hover:border-sky-500/40 transition-all active:scale-95"
            aria-label="Previous Service"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Dots Indicator: the dots and the active pill only slide (transforms), so a change of card
              never relayouts or repaints anything */}
          <div className="relative h-[26px] w-[154px] rounded-full bg-slate-50 border border-slate-200 [contain:strict]">
            <div className="absolute left-4 top-[8px] h-2 w-[120px]">
              {services.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className="absolute left-0 top-0 h-2 w-2 rounded-full bg-slate-300 transition-[transform,opacity] duration-500 hover:bg-slate-400"
                  style={{ transform: `translateX(${dotX(i, activeIndex)}px)`, opacity: i === activeIndex ? 0 : 1 }}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
              {/* the active pill, which fills while the ring waits to turn */}
              <span
                aria-hidden
                className="pointer-events-none absolute left-0 top-0 h-2 w-10 overflow-hidden rounded-full bg-sky-100 transition-transform duration-500"
                style={{ transform: `translateX(${dotX(activeIndex, activeIndex)}px)` }}
              >
                <span
                  key={`${activeIndex}-${autoSpin}`}
                  className={`absolute inset-0 origin-left rounded-full bg-gradient-to-r from-sky-500 to-emerald-400 ${autoSpin ? 'svc-progress' : ''}`}
                />
              </span>
            </div>
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
