'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useInView, useOnScreen } from './hooks';
import { useContent } from '../ContentProvider';
import { fill } from '@/content/types';

// PLACEHOLDER reviews, ratings and AI-generated portraits for the demo: replace with real, verifiable
// customer reviews (with their permission for any photo) and the real rating / count before going live.
// Photos, ratings and pebble shapes, in the same order as the reviews in the content (content/*.ts).
const REVIEW_MEDIA = [
  { photo: '/images/reviews/noura.webp', rating: 5, shape: '58% 42% 55% 45% / 46% 56% 44% 54%' },
  { photo: '/images/reviews/faisal.webp', rating: 5, shape: '44% 56% 40% 60% / 58% 44% 56% 42%' },
  { photo: '/images/reviews/sarah.webp', rating: 5, shape: '62% 38% 48% 52% / 42% 58% 42% 58%' },
  { photo: '/images/reviews/abdullah.webp', rating: 4, shape: '50% 50% 62% 38% / 55% 45% 55% 45%' },
  { photo: '/images/reviews/lina.webp', rating: 5, shape: '40% 60% 52% 48% / 50% 40% 60% 50%' },
];

type Review = { name: string; place: string; service: string; quote: string } & (typeof REVIEW_MEDIA)[number];

// reviewer selector (desktop): equal pebbles on a gentle, symmetric arch
const CLUSTER = [
  { x: 0, y: 26, s: 64 },
  { x: 84, y: 8, s: 64 },
  { x: 168, y: 0, s: 64 },
  { x: 252, y: 8, s: 64 },
  { x: 336, y: 26, s: 64 },
];

const INTERVAL = 7000;

function Stars({ rating = 5, className = '', size = 'h-3.5 w-3.5' }: { rating?: number; className?: string; size?: string }) {
  const label = useContent().testimonials.starsAria;
  return (
    <span className={`inline-flex gap-0.5 ${className}`} role="img" aria-label={fill(label, { n: rating })}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 20 20" className={`${size} ${i < rating ? 'fill-amber-400' : 'fill-neutral-200'}`} aria-hidden>
          <path d="M10 1.6l2.5 5.4 5.9.7-4.4 4 1.2 5.8L10 14.6l-5.2 2.9 1.2-5.8-4.4-4 5.9-.7z" />
        </svg>
      ))}
    </span>
  );
}

export default function Testimonials() {
  const content = useContent();
  const tm = content.testimonials;
  const rtl = content.dir === 'rtl';
  const REVIEWS: Review[] = tm.reviews.map((rv, i) => ({ ...rv, ...REVIEW_MEDIA[i] }));
  const [qOpen, qClose] = rtl ? ['\u00AB', '\u00BB'] : ['\u201C', '\u201D'];
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
      aria-label={fill(tm.showReview, { name: rv.name })}
      aria-pressed={i === active}
      className={`group/av relative grid shrink-0 place-items-center outline-none transition-transform duration-500 focus-visible:scale-110 ${
        i === active ? 'scale-[1.12]' : 'hover:scale-105'
      }`}
      style={{ width: size, height: size }}
    >
      <img
        src={rv.photo}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        draggable={false}
        className="absolute inset-0 h-full w-full bg-[#efe9df] object-cover"
        style={{ borderRadius: rv.shape }}
      />
      {i === active && (
        <svg className="pointer-events-none absolute -inset-[7px] h-[calc(100%+14px)] w-[calc(100%+14px)] -rotate-90" viewBox="0 0 100 100" aria-hidden>
          <circle cx="50" cy="50" r="48" fill="none" stroke="#e7e1d5" strokeWidth="1.5" />
          <circle
            key={active}
            cx="50"
            cy="50"
            r="48"
            fill="none"
            stroke="#0284c7"
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
    <section ref={sectionRef} id="reviews" className="relative section-clip bg-white pt-16 md:pt-20">
      {/* a soft pebble behind the quote */}
      <svg aria-hidden className="pointer-events-none absolute -left-[12%] top-12 h-[560px] w-[88%] overflow-visible md:top-16 md:h-[560px] md:w-[70%] rtl:left-auto rtl:-right-[12%] rtl:-scale-x-100" viewBox="0 0 900 640" preserveAspectRatio="none">
        <path d="M118 96C214 18 392 -10 560 24c160 32 300 110 330 246 30 138-56 268-214 330-152 60-356 52-492-12C46 528-14 412 4 300 18 206 46 154 118 96Z" fill="#f6f4ef" />
        <path d="M118 96C214 18 392 -10 560 24c160 32 300 110 330 246 30 138-56 268-214 330-152 60-356 52-492-12C46 528-14 412 4 300 18 206 46 154 118 96Z" fill="none" stroke="#e3dccd" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      </svg>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div ref={headRef} className="grid grid-cols-1 gap-14 md:min-h-[545px] md:grid-cols-12 md:gap-8">
          {/* the quote */}
          <div
            className="relative md:col-span-7 md:-ms-6 md:pt-14"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={() => setPaused(false)}
          >
            <p className="reveal text-[13px] font-semibold uppercase tracking-[0.24em] text-neutral-600 md:text-[14px]" data-in={headIn}>
              {tm.eyebrow}
            </p>
            <figure className="relative mt-14 min-h-[260px] md:mt-[5.5rem] md:min-h-[300px]" aria-live="polite">
              <span
                aria-hidden
                className={`pointer-events-none absolute -start-1 font-[300] -top-[72px] select-none text-[150px] leading-none text-sky-200 md:-start-5 md:-top-[110px] md:text-[220px]`}
              >
                {tm.quoteMark}
              </span>
              <blockquote key={active} className="tm-in">
                <p className={`text-[1.55rem] font-[300] leading-[1.28] tracking-[-0.02em] text-neutral-900 sm:text-[2rem] md:text-[clamp(2.1rem,2.9vw,2.85rem)] rtl:leading-[1.6]`}>
                  {r.quote}
                </p>
              </blockquote>
              <figcaption key={`c-${active}`} className="tm-in mt-8 flex items-center gap-4" style={{ animationDelay: '120ms' }}>
                <img
                  src={r.photo}
                  alt={r.name}
                  width={56}
                  height={56}
                  decoding="async"
                  className="h-14 w-14 shrink-0 bg-[#efe9df] object-cover"
                  style={{ borderRadius: r.shape }}
                />
                <span>
                  <Stars rating={r.rating} className="mb-1.5" />
                  <span className="block text-[15px] font-semibold text-neutral-900">{r.name}</span>
                  <span className="block text-[13px] text-neutral-500">
                    {r.place} <span className="text-neutral-300">·</span> {r.service}
                  </span>
                </span>
              </figcaption>
            </figure>
          </div>

          {/* the rating and the reviewers */}
          <div className="md:col-span-5 md:self-center md:ps-6">
            <div className="reveal flex items-center gap-6" data-in={headIn} style={{ transitionDelay: '120ms' }}>
              {/* one size for the score and the scale, told apart by weight and tone */}
              <p dir="ltr" className="flex items-baseline gap-2 whitespace-nowrap leading-none tracking-[-0.03em] text-[52px] md:text-[64px]">
                <span className="font-[300] text-neutral-900">4.9</span>
                <span className="font-[200] text-neutral-300">/</span>
                <span className="font-[200] text-neutral-400">5</span>
              </p>
              <div className="border-s border-neutral-200 ps-6">
                <Stars size="h-[18px] w-[18px] md:h-5 md:w-5" className="gap-1" />
                <p className="mt-2.5 whitespace-nowrap text-[13px] leading-tight text-neutral-500 md:text-[14px]">{tm.from}</p>
              </div>
            </div>

            {/* mobile: a simple row of reviewers */}
            <div className="-mx-2 mt-10 flex items-center gap-4 overflow-x-auto px-3 py-3 md:hidden">
              {REVIEWS.map((rv, i) => avatar(rv, i, 52))}
            </div>
            {/* desktop: a loose cluster of pebbles */}
            <div className="relative ms-16 mt-10 hidden h-[96px] w-[400px] md:block">
              {REVIEWS.map((rv, i) => (
                <div key={rv.name} className="absolute" style={{ insetInlineStart: CLUSTER[i].x, top: CLUSTER[i].y }}>
                  {avatar(rv, i, CLUSTER[i].s)}
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={() => go(-1)}
                aria-label={tm.prev}
                className="grid h-11 w-11 place-items-center rounded-full border border-neutral-300 text-neutral-700 transition-colors hover:border-neutral-900 hover:bg-neutral-900 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" />
              </button>
              <button
                onClick={() => go(1)}
                aria-label={tm.next}
                className="grid h-11 w-11 place-items-center rounded-full border border-neutral-300 text-neutral-700 transition-colors hover:border-neutral-900 hover:bg-neutral-900 hover:text-white"
              >
                <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
              </button>
              <span dir="ltr" className={`ms-2 text-[14px] tabular-nums text-neutral-400`}>
                <span className="text-neutral-900">0{active + 1}</span> / 0{REVIEWS.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* a slow ribbon of short reviews, easing the page into the booking section */}
      <div className="group relative mt-40 border-y border-[#ece7dd] bg-[#fbfaf7] py-5 md:mt-28">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#fbfaf7] to-transparent md:w-40" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#fbfaf7] to-transparent md:w-40" />
        <div dir="ltr" className="tm-marquee flex w-max group-hover:[animation-play-state:paused]">
          {[0, 1].map((copy) => (
            <ul key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1}>
              {tm.snippets.map(([q, who]) => (
                <li key={q} dir={content.dir} className="flex items-center gap-4 px-8 md:px-10">
                  <span className={`whitespace-nowrap text-[15px] font-[300] text-neutral-700 md:text-[17px]`}>
                    {qOpen}
                    {q}
                    {qClose}
                  </span>
                  <span className="whitespace-nowrap text-[10px] uppercase tracking-[0.2em] text-neutral-400">{who}</span>
                  <span aria-hidden className="ms-6 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400 md:ms-8" />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
      <div className="h-10 md:h-12" />
    </section>
  );
}
