'use client';

import React, { useEffect, useRef } from 'react';
import { BadgeCheck, Leaf, ShieldCheck, UserCheck } from 'lucide-react';
import { useContent } from './ContentProvider';

// icons for the guarantees along the foot of the hero (their wording is in the content)
const PROMISE_ICONS = [ShieldCheck, UserCheck, Leaf, BadgeCheck];

/**
 * Hero: a muted, looping film of the team at work (cleaning scenes only), with the headline over it.
 * The poster frame shows at once; the video only plays while it is on screen, and not at all for
 * visitors who prefer reduced motion.
 */
export default function HeroVideo() {
  const t = useContent();
  const h = t.hero;
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      v.pause();
      return;
    }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) v.play().catch(() => undefined);
      else v.pause();
    });
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <section id="hero" className={`relative h-[100svh] min-h-[620px] w-full overflow-hidden bg-neutral-900`}>
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        poster="/videos/hero-poster.webp"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden
      >
        <source src="/videos/hero-cleaning.mp4" type="video/mp4" />
      </video>

      {/* shade for legibility: darker behind the copy, clear over the rest of the film */}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/5 rtl:bg-gradient-to-l" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/45 to-transparent" />

      {/* the copy sits in the middle of the film, below the header (it takes the top ~88px) */}
      <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-center px-5 pb-[112px] pt-[88px] sm:px-6 md:pb-[64px] lg:px-8">
        <p className="hero-in flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.32em] text-white/75 md:text-[11px]">
          {h.eyebrow}
        </p>
        <h1
          className="hero-in mt-5 text-[2.9rem] leading-[0.98] tracking-[-0.035em] text-white sm:text-[3.6rem] md:mt-6 md:text-[clamp(3.6rem,5.6vw,6.5rem)]"
          style={{ animationDelay: '90ms' }}
        >
          <span className="font-[300]">{h.line1}</span>
          <br />
          <span className="font-[250] italic text-white/70">{h.to}</span>
          <span className="relative inline-block font-bold">
            {h.word}
            {/* one swipe of the squeegee under the word, drawn once as the page opens */}
            <svg
              aria-hidden
              className="hero-swipe pointer-events-none absolute -bottom-[0.14em] start-[0.02em] h-[0.24em] w-[92%] overflow-visible rtl:-scale-x-100 rtl:-bottom-[0.05em]"
              viewBox="0 0 320 24"
              preserveAspectRatio="none"
            >
              <path d="M4 17C80 9 190 5 316 8C196 11 86 16 8 22C4 22.5 2 18 4 17Z" fill="#38bdf8" />
            </svg>
          </span>
        </h1>
        <p
          className="hero-in mt-5 max-w-[23rem] text-[15px] leading-relaxed text-white/85 md:mt-6 md:max-w-[28rem] md:text-[17px]"
          style={{ animationDelay: '180ms' }}
        >
          {h.description}
        </p>
        <div className="hero-in mt-7 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] font-medium text-white/80 md:text-[13px]" style={{ animationDelay: '300ms' }}>
          <span className="flex items-center gap-2">
            <span className="flex gap-0.5" role="img" aria-label={h.ratingAria}>
              {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} viewBox="0 0 20 20" className="h-4 w-4 fill-amber-400" aria-hidden>
                  <path d="M10 1.6l2.5 5.4 5.9.7-4.4 4 1.2 5.8L10 14.6l-5.2 2.9 1.2-5.8-4.4-4 5.9-.7z" />
                </svg>
              ))}
            </span>
            <span className="text-[14px] font-semibold text-white">4.9</span>
          </span>
          <span className="h-3 w-px bg-white/40" />
          <span>{h.homes}</span>
          <span className="hidden h-3 w-px bg-white/40 sm:block" />
          <span className="hidden sm:inline">{h.sameDay}</span>
        </div>
      </div>

      {/* guarantees, in a quiet bar along the bottom of the film */}
      <div className="absolute inset-x-0 bottom-0 border-t border-white/15 bg-black/25">
        <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-x-4 gap-y-3 px-5 py-4 text-[11px] font-medium text-white/85 sm:px-6 md:flex md:items-center md:justify-between md:py-5 md:text-[13px] lg:px-8">
          {h.promises.map((label, i) => {
            const Icon = PROMISE_ICONS[i];
            return (
            <li key={label} className="flex items-center gap-2.5">
              <Icon className="h-4 w-4 shrink-0 text-sky-300" strokeWidth={1.75} />
              {label}
            </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
