'use client';

import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, ArrowRight } from 'lucide-react';

interface ServiceItem {
  id: number;
  title: string;
  category: string;
  description: string;
  badge: string;
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
    image: '/images/services/villa-deep-cleaning.webp',
    features: ['High-temp Steam Sanitization', 'Full Kitchen Degreasing', 'Balcony & Patio Power Wash']
  },
  {
    id: 2,
    title: 'Post-Construction Restoration',
    category: 'Commercial & Residential',
    description: 'Complete removal of plaster dust, grout film, paint splatters, and construction debris for new handovers.',
    badge: 'Heavy Duty',
    image: '/images/services/post-construction.webp',
    features: ['Paint Splatter Removal', 'Industrial HEPA Dust Extraction', 'Window Track Scrubbing']
  },
  {
    id: 3,
    title: 'Upholstery & Carpet Steam Care',
    category: 'Specialized',
    description: 'Deep hot-water extraction destroying 99.9% of dust mites, deep-seated stains, and desert dust from sofas & rugs.',
    badge: 'Allergen Free',
    image: '/images/services/upholstery-carpet.webp',
    features: ['Organic Stain Neutralizer', 'Fabric Fiber Protection', 'Rapid 2-Hour Dry Time']
  },
  {
    id: 4,
    title: 'Marble & Stone Floor Polishing',
    category: 'Restoration',
    description: 'Diamond pad honing, crystallization, and high-gloss sealing to restore mirror clarity on Saudi marble floors.',
    badge: 'Mirror Finish',
    image: '/images/services/marble-polishing.webp',
    features: ['Diamond Disc Grinding', 'Anti-Slip Gloss Crystallization', 'Sealant Stain Guard']
  },
  {
    id: 5,
    title: 'Facade & Window Cleaning',
    category: 'Exterior',
    description: 'High-reach deionized pure water glass washing for spotless streak-free panoramic windows and building exteriors.',
    badge: 'Streak-Free',
    image: '/images/services/facade-windows.webp',
    features: ['Deionized Pure Water', 'High-Reach Water Pole System', 'Solar Panel Cleaning']
  },
  {
    id: 6,
    title: 'Disinfection & Sanitization',
    category: 'Health & Safety',
    description: 'Hospital-grade electrostatic fogging and anti-viral misting for safe, germ-free homes, offices, and schools.',
    badge: 'Certified Safe',
    image: '/images/services/disinfection.webp',
    features: ['Non-Toxic Eco Misting', 'Hospital-Grade Disinfectant', 'Safe for Children & Pets']
  }
];

// Card titles, shared with the footer so its service links always match the cards
export const SERVICE_TITLES = services.map((s) => s.title);
// other parts of the page can bring a card to the front: dispatchEvent(new CustomEvent(SELECT_SERVICE, { detail: index }))
export const SELECT_SERVICE = 'services:select';

// Flat track: the cards sit side by side, the active one in the centre (card width + gap, px).
const stepFor = (vw: number) => (vw < 640 ? 290 + 16 : 440 + 28);

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
  const [step, setStep] = useState(stepFor(1440));
  const prevActive = useRef(0);

  useEffect(() => {
    const fit = () => setStep(stepFor(window.innerWidth));
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

  // swipe / drag the track
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

  // the track only advances by itself while it is on screen: moving it unseen would still cost frames
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header Matching Video Reference */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 md:mb-10">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-sky-600 mb-3">
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

        {/* Flat carousel: cards side by side, sliding along one line */}
        <div
          className="relative my-4 flex min-h-[400px] select-none items-center justify-center sm:min-h-[600px]"
          style={{ touchAction: 'pan-y' }}
          onMouseEnter={() => setIsAutoSpin(false)}
          onMouseLeave={() => setIsAutoSpin(true)}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (drag.current = null)}
        >
          {services.map((service, index) => {
            // position on the track relative to the active card (wrapping round both ends)
            const count = services.length;
            const ringOffset = (from: number) => {
              const o = (index - from + count) % count;
              return o > count / 2 ? o - count : o;
            };
            const offset = ringOffset(activeIndex);
            // a card wrapping from one end to the other jumps there off screen instead of sweeping across
            const wrapped = Math.abs(offset - ringOffset(prevActive.current)) > 1;

            const isActive = offset === 0;
            const absOffset = Math.abs(offset);
            const scale = isActive ? 1 : 0.92;
            // side cards step back under a soft white veil, so the one in the centre leads
            const haze = isActive ? 0 : absOffset === 1 ? 0.32 : 0.55;

            return (
              <div
                key={service.id}
                // the card parked off screen ignores clicks here rather than through pointer-events,
                // which is inherited and would restyle the whole card on every change
                onClick={() => absOffset <= 2 && setActiveIndex(index)}
                className="group/card absolute w-[290px] sm:w-[440px] cursor-pointer will-change-transform"
                style={{
                  transform: `translate3d(${offset * step}px, 0, 0) scale(${scale})`,
                  opacity: absOffset > 2 ? 0 : 1,
                  transition: wrapped ? 'none' : `transform 900ms ${EASE}, opacity 600ms ${EASE}`,
                }}
              >
                {/* Service Card: a tall, image-led portrait with a frosted panel (its paint never changes) */}
                <div className="relative aspect-[3/4] overflow-hidden rounded-[28px] bg-slate-200 shadow-[0_18px_40px_-26px_rgba(15,23,42,0.4)] [contain:layout_paint]">
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
                              <CheckCircle className="h-3 w-3 shrink-0 text-sky-600" />
                              {feat}
                            </li>
                          ))}
                        </ul>
                        <a
                          href="#contact"
                          className="group/cta mt-4 flex items-center justify-between border-t border-slate-900/10 pt-4 text-[13px] font-medium text-slate-900"
                        >
                          Book this service
                          <span className="grid h-10 w-10 place-items-center rounded-full bg-slate-900 text-white transition-all duration-500 group-hover/cta:bg-sky-600 group-hover/cta:rotate-[-35deg]">
                            <ArrowRight className="h-4 w-4" />
                          </span>
                        </a>
                  </SlidePanel>

                  {/* veil over the side cards; it lifts a little on hover */}
                  <div
                    className="pointer-events-none absolute inset-0 rounded-[28px] bg-gradient-to-b from-white/90 to-white will-change-[opacity] opacity-[var(--haze)] group-hover/card:opacity-[calc(var(--haze)*0.45)]"
                    style={{ '--haze': haze, transition: `opacity 900ms ${EASE}` } as React.CSSProperties}
                  />
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
                  className={`absolute inset-0 origin-left rounded-full bg-sky-600 ${autoSpin ? 'svc-progress' : ''}`}
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
