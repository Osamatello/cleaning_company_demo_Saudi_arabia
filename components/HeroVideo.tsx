'use client';

import React, { useEffect, useRef } from 'react';
import { inter } from './home/fonts';

/**
 * Hero: a muted, looping film of the team at work (cleaning scenes only), with the headline over it.
 * The poster frame shows at once; the video only plays while it is on screen, and not at all for
 * visitors who prefer reduced motion.
 */
export default function HeroVideo() {
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
    <section id="hero" className={`${inter.className} relative h-[100svh] min-h-[620px] w-full overflow-hidden bg-neutral-900`}>
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
      <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/5" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/45 to-transparent" />

      {/* the copy sits in the middle of the film, below the header (it takes the top ~88px) */}
      <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-center px-5 pt-[88px] sm:px-6 lg:px-8">
        <p className="hero-in flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.32em] text-white/75 md:text-[11px]">
          <span className="h-px w-8 bg-sky-400" />
          Home &amp; villa cleaning in Riyadh
        </p>
        <h1
          className="hero-in mt-5 text-[2.9rem] leading-[0.98] tracking-[-0.035em] text-white sm:text-[3.6rem] md:mt-6 md:text-[clamp(3.6rem,5.6vw,6.5rem)]"
          style={{ animationDelay: '90ms' }}
        >
          <span className="font-[300]">From chaos</span>
          <br />
          <span className="font-[250] italic text-white/70">to </span>
          <span className="font-bold">spotless.</span>
        </h1>
        <p
          className="hero-in mt-5 max-w-[23rem] text-[15px] leading-relaxed text-white/85 md:mt-6 md:max-w-[28rem] md:text-[17px]"
          style={{ animationDelay: '180ms' }}
        >
          Deep cleaning for villas and apartments across Riyadh: vetted specialists, eco-certified products and a
          spotless result, guaranteed.
        </p>
        <div className="hero-in mt-7 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] font-medium text-white/80 md:text-[13px]" style={{ animationDelay: '300ms' }}>
          <span className="flex items-center gap-2">
            <span className="flex gap-0.5" role="img" aria-label="4.9 out of 5 stars">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} viewBox="0 0 20 20" className="h-4 w-4 fill-amber-400" aria-hidden>
                  <path d="M10 1.6l2.5 5.4 5.9.7-4.4 4 1.2 5.8L10 14.6l-5.2 2.9 1.2-5.8-4.4-4 5.9-.7z" />
                </svg>
              ))}
            </span>
            <span className="text-[14px] font-semibold text-white">4.9</span>
          </span>
          <span className="h-3 w-px bg-white/40" />
          <span>1,200+ homes cleaned</span>
          <span className="hidden h-3 w-px bg-white/40 sm:block" />
          <span className="hidden sm:inline">Same-day service</span>
        </div>
      </div>
    </section>
  );
}
