'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { inter } from './fonts';
import { useInView, useOnScreen } from './hooks';

type Review = { name: string; initials: string; place: string; service: string; quote: string; tint: string; shape: string };

// PLACEHOLDER reviews and rating for the demo — replace with real, verifiable customer reviews
// (and the real rating / count) before the site goes live.
const REVIEWS: Review[] = [
  {
    name: 'Noura A.',
    initials: 'NA',
    place: 'Villa · Hittin',
    service: 'Villa deep clean',
    quote: 'They gave us back the house we moved into. Every corner, every grout line — even the majlis carpets look new again.',
    tint: 'from-sky-200 to-cyan-100',
    shape: '58% 42% 55% 45% / 46% 56% 44% 54%',
  },
  {
    name: 'Faisal M.',
    initials: 'FM',
    place: 'Apartment · Al Olaya',
    service: 'Move-out clean',
    quote: 'Booked at nine, the team was at my door before eleven. My landlord asked who I’d hired — and kept the number.',
    tint: 'from-emerald-200 to-teal-100',
    shape: '44% 56% 40% 60% / 58% 44% 56% 42%',
  },
  {
    name: 'Sarah K.',
    initials: 'SK',
    place: 'Villa · Al Malqa',
    service: 'Post-construction',
    quote: 'After six months of renovation dust I had honestly given up. Two days later the whole villa was spotless — and quiet.',
    tint: 'from-amber-100 to-orange-50',
    shape: '62% 38% 48% 52% / 42% 58% 42% 58%',
  },
  {
    name: 'Abdullah R.',
    initials: 'AR',
    place: 'Office · King Fahd Road',
    service: 'Weekly office care',
    quote: 'Our office has never felt this fresh. Discreet, always on time, and the same trusted crew every single week.',
    tint: 'from-indigo-100 to-sky-100',
    shape: '50% 50% 62% 38% / 55% 45% 55% 45%',
  },
  {
    name: 'Lina H.',
    initials: 'LH',
    place: 'Villa · Al Yasmin',
    service: 'Marble & upholstery',
    quote: 'The marble floors gleam like a hotel lobby. The sofa my kids live on? You would never know.',
    tint: 'from-rose-100 to-amber-50',
    shape: '40% 60% 52% 48% / 50% 40% 60% 50%',
  },
];

const SNIPPETS = [
  ['Like moving into a new villa.', 'Noura · Hittin'],
  ['On time, every time.', 'Abdullah · Olaya'],
  ['The majlis smells like the first day.', 'Reem · Al Narjis'],
  ['Worth every riyal.', 'Faisal · Al Olaya'],
  ['My mother noticed the windows first.', 'Omar · Al Rabwah'],
  ['Spotless and genuinely kind people.', 'Sarah · Al Malqa'],
];

// staggered, pebble-like layout for the reviewer selector (desktop)
const CLUSTER = [
  { x: 0, y: 46, s: 66 },
  { x: 74, y: 0, s: 58 },
  { x: 142, y: 52, s: 76 },
  { x: 228, y: 8, s: 60 },
  { x: 214, y: 104, s: 54 },
];

const INTERVAL = 7000;

function Stars({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex gap-0.5 ${className}`} aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-amber-400" aria-hidden>
          <path d="M10 1.6l2.5 5.4 5.9.7-4.4 4 1.2 5.8L10 14.6l-5.2 2.9 1.2-5.8-4.4-4 5.9-.7z" />
        </svg>
      ))}
    </span>
  );
}

export default function Testimonials() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [headRef, headIn] = useInView<HTMLDivElement>({ rootMargin: '0px 0px -20% 0px', threshold: 0 });
  const [sectionRef, onScreen] = useOnScreen<HTMLElement>();
  const running = onScreen && !paused;

  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => setActive((a) => (a + 1) % REVIEWS.length), INTERVAL);
    return () => clearTimeout(t);
  }, [running, active]);

  const go = (d: number) => setActive((a) => (a + d + REVIEWS.length) % REVIEWS.length);
  const r = REVIEWS[active];

  const avatar = (rv: Review, i: number, size: number) => (
    <button
      key={rv.name}
      onClick={() => setActive(i)}
      aria-label={`Show review from ${rv.name}`}
      aria-pressed={i === active}
      className={`group/av relative grid shrink-0 place-items-center outline-none transition-transform duration-500 focus-visible:scale-110 ${
        i === active ? 'scale-[1.12]' : 'hover:scale-105'
      }`}
      style={{ width: size, height: size }}
    >
      <span
        className={`absolute inset-0 bg-gradient-to-br ${rv.tint} transition-[filter,opacity] duration-500 ${i === active ? '' : 'opacity-70 grayscale-[30%]'}`}
        style={{ borderRadius: rv.shape }}
      />
      <span className={`relative text-[15px] font-medium text-neutral-800`}>{rv.initials}</span>
      {i === active && (
        <svg className="pointer-events-none absolute -inset-[7px] h-[calc(100%+14px)] w-[calc(100%+14px)] -rotate-90" viewBox="0 0 100 100" aria-hidden>
          <circle cx="50" cy="50" r="48" fill="none" stroke="#e7e1d5" strokeWidth="1.5" />
          <circle
            key={active}
            cx="50"
            cy="50"
            r="48"
            fill="none"
            stroke="url(#tm-ring)"
            strokeWidth="2"
            strokeLinecap="round"
            pathLength={1}
            className="tm-ring"
            style={{ animationDuration: `${INTERVAL}ms`, animationPlayState: running ? 'running' : 'paused' }}
          />
        </svg>
      )}
    </button>
  );

  return (
    <section ref={sectionRef} id="reviews" className={`${inter.className} relative section-clip bg-white pt-28 md:pt-36`}>
      <svg width="0" height="0" className="absolute" aria-hidden>
        <defs>
          <linearGradient id="tm-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#0ea5e9" />
            <stop offset="1" stopColor="#34d399" />
          </linearGradient>
        </defs>
      </svg>
      {/* a soft pebble behind the quote */}
      <svg aria-hidden className="pointer-events-none absolute -left-[12%] top-24 h-[620px] w-[88%] md:top-20 md:h-[700px] md:w-[74%]" viewBox="0 0 900 640" preserveAspectRatio="none">
        <path d="M118 96C214 18 392 -10 560 24c160 32 300 110 330 246 30 138-56 268-214 330-152 60-356 52-492-12C46 528-14 412 4 300 18 206 46 154 118 96Z" fill="#f6f4ef" />
      </svg>
      <svg aria-hidden className="pointer-events-none absolute -left-[6%] top-12 hidden h-[700px] w-[74%] md:block" viewBox="0 0 900 640" preserveAspectRatio="none">
        <path d="M118 96C214 18 392 -10 560 24c160 32 300 110 330 246 30 138-56 268-214 330-152 60-356 52-492-12C46 528-14 412 4 300 18 206 46 154 118 96Z" fill="none" stroke="#e8e2d6" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      </svg>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div ref={headRef} className="grid grid-cols-1 gap-14 md:grid-cols-12 md:gap-8">
          {/* the quote */}
          <div
            className="relative md:col-span-8"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={() => setPaused(false)}
          >
            <p className="reveal text-[10px] font-medium uppercase tracking-[0.32em] text-neutral-500 md:text-[11px]" data-in={headIn}>
              Kind words
            </p>
            <figure className="relative mt-20 min-h-[300px] md:mt-28 md:min-h-[330px]" aria-live="polite">
              <span
                aria-hidden
                className={`pointer-events-none absolute -left-1 font-[300] -top-[72px] select-none bg-gradient-to-br from-sky-400 via-cyan-300 to-emerald-300 bg-clip-text text-[150px] leading-none text-transparent md:-left-5 md:-top-[118px] md:text-[240px]`}
              >
                “
              </span>
              <blockquote key={active} className="tm-in">
                <p className={`text-[1.55rem] font-[300] leading-[1.28] tracking-[-0.02em] text-neutral-900 sm:text-[1.9rem] md:text-[clamp(1.9rem,2.7vw,2.6rem)]`}>
                  {r.quote}
                </p>
              </blockquote>
              <figcaption key={`c-${active}`} className="tm-in mt-8 flex items-center gap-4" style={{ animationDelay: '120ms' }}>
                <span className={`grid h-12 w-12 place-items-center bg-gradient-to-br ${r.tint}`} style={{ borderRadius: r.shape }}>
                  <span className={`text-[14px] font-medium text-neutral-800`}>{r.initials}</span>
                </span>
                <span>
                  <span className="block text-[15px] font-semibold text-neutral-900">{r.name}</span>
                  <span className="block text-[13px] text-neutral-500">
                    {r.place} <span className="text-neutral-300">·</span> {r.service}
                  </span>
                </span>
              </figcaption>
            </figure>
          </div>

          {/* the rating and the reviewers */}
          <div className="md:col-span-4 md:pt-10">
            <div className="reveal flex items-end gap-4 md:block" data-in={headIn} style={{ transitionDelay: '120ms' }}>
              <p className={`text-[80px] font-[200] leading-[0.85] tracking-[-0.05em] text-neutral-900 md:text-[120px]`}>
                4.9<span className="text-[0.32em] text-neutral-400">/5</span>
              </p>
              <div className="pb-1 md:mt-4 md:pb-0">
                <Stars />
                <p className="mt-1.5 text-[13px] leading-snug text-neutral-500">
                  Average rating from 1,200+
                  <br className="hidden md:block" /> homes cleaned across Riyadh
                </p>
              </div>
            </div>

            {/* mobile: a simple row of reviewers */}
            <div className="-mx-2 mt-10 flex items-center gap-4 overflow-x-auto px-3 py-3 md:hidden">
              {REVIEWS.map((rv, i) => avatar(rv, i, 52))}
            </div>
            {/* desktop: a loose cluster of pebbles */}
            <div className="relative mt-14 hidden h-[180px] w-[300px] md:block">
              {REVIEWS.map((rv, i) => (
                <div key={rv.name} className="absolute" style={{ left: CLUSTER[i].x, top: CLUSTER[i].y }}>
                  {avatar(rv, i, CLUSTER[i].s)}
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-3 md:mt-8">
              <button
                onClick={() => go(-1)}
                aria-label="Previous review"
                className="grid h-11 w-11 place-items-center rounded-full border border-neutral-300 text-neutral-700 transition-colors hover:border-neutral-900 hover:bg-neutral-900 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => go(1)}
                aria-label="Next review"
                className="grid h-11 w-11 place-items-center rounded-full border border-neutral-300 text-neutral-700 transition-colors hover:border-neutral-900 hover:bg-neutral-900 hover:text-white"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
              <span className={`ml-2 text-[14px] tabular-nums text-neutral-400`}>
                <span className="text-neutral-900">0{active + 1}</span> / 0{REVIEWS.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* a slow ribbon of short reviews, easing the page into the booking section */}
      <div className="group relative mt-24 border-y border-[#ece7dd] bg-[#fbfaf7] py-6 md:mt-32">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#fbfaf7] to-transparent md:w-40" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#fbfaf7] to-transparent md:w-40" />
        <div className="tm-marquee flex w-max group-hover:[animation-play-state:paused]">
          {[0, 1].map((copy) => (
            <ul key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1}>
              {SNIPPETS.map(([q, who]) => (
                <li key={q} className="flex items-center gap-4 px-8 md:px-10">
                  <span className={`whitespace-nowrap text-[18px] font-[300] text-neutral-800 md:text-[21px]`}>“{q}”</span>
                  <span className="whitespace-nowrap text-[11px] uppercase tracking-[0.2em] text-neutral-400">{who}</span>
                  <svg viewBox="0 0 20 20" className="ml-6 h-3.5 w-3.5 text-sky-400 md:ml-8" aria-hidden>
                    <path d="M10 0c.6 5.6 4.4 9.4 10 10-5.6.6-9.4 4.4-10 10-.6-5.6-4.4-9.4-10-10C5.6 9.4 9.4 5.6 10 0z" fill="currentColor" />
                  </svg>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
      <div className="h-20 md:h-28" />
    </section>
  );
}
