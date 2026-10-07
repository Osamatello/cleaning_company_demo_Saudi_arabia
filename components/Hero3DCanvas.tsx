'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Inter } from 'next/font/google';
import type { HeroScene } from './hero/createHeroScene';
import { ASSETS } from './hero/heroConfig';

const inter = Inter({ subsets: ['latin'], style: ['normal', 'italic'], display: 'swap' });

// The 3D code starts downloading as soon as this module runs, not after the page has hydrated.
const sceneModule = typeof window !== 'undefined' ? import('./hero/createHeroScene') : null;

export default function Hero3DCanvas() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;

    let scene: HeroScene | null = null;
    let cancelled = false;

    // Scroll progress across the pinned section, 0 → 1. No React state: straight into the scene.
    const onScroll = () => {
      const rect = section.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      const p = scrollable > 0 ? Math.min(1, Math.max(0, -rect.top / scrollable)) : 0;
      // the pinned stage scrolls away with the section's bottom edge
      const visible = Math.min(1, Math.max(0, rect.bottom / window.innerHeight));
      scene?.setProgress(p, visible);
    };
    const onResize = () => {
      scene?.resize();
      onScroll();
    };

    // three.js is only needed client-side; load it lazily with the scene module.
    (sceneModule ?? import('./hero/createHeroScene')).then(({ createHeroScene }) => {
      if (cancelled) return;
      scene = createHeroScene(canvas, { onReady: () => setReady(true) });
      onScroll();
    });

    const io = new IntersectionObserver(([entry]) => scene?.setActive(entry.isIntersecting), { rootMargin: '0px' });
    io.observe(section);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    return () => {
      cancelled = true;
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      scene?.dispose();
    };
  }, []);

  return (
    <section id="hero-3d" ref={sectionRef} className={`${inter.className} relative h-[340vh] w-full bg-[#e1e4e8]`}>
      {/* the first-frame model downloads from the very start of the page load */}
      <link rel="preload" href={ASSETS.dirtyHouseInstant} as="fetch" crossOrigin="anonymous" />
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        {/* The page and headline show at once on white; the 3D scene loads in the background and
            fades in only when its first complete frame has been drawn (no loading screen). */}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 block h-full w-full transition-opacity duration-1000 ease-out ${
            ready ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* the scene's bottom edge melts into the stage colour, which the next section fades from */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#e1e4e8]" />

        {/* soft light behind the copy so it stays crisp over the scene */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-[10vw] top-[8%] hidden h-[90vh] w-[60vw] bg-[radial-gradient(closest-side,rgba(225,228,232,0.95),rgba(225,228,232,0.6)_55%,transparent)] md:block"
        />

        {/* Headline — right-hand side, stacked on top on small screens */}
        <div
          className="pointer-events-none absolute inset-x-0 top-[92px] px-6 text-left md:inset-x-auto md:right-[7vw] md:top-[24%] md:px-0 md:text-right"
        >
          <p className="hero-in flex items-center gap-3 md:justify-end">
            {/* three soap bubbles drifting beside the label */}
            <svg width="46" height="35" viewBox="0 0 34 26" aria-hidden className="overflow-visible drop-shadow-[0_2px_4px_rgba(2,132,199,0.25)]">
              <defs>
                <radialGradient id="hero-bubble" cx="35%" cy="30%" r="70%">
                  <stop offset="0" stopColor="#ffffff" stopOpacity="1" />
                  <stop offset="0.4" stopColor="#7dd3fc" stopOpacity="0.85" />
                  <stop offset="0.8" stopColor="#22d3ee" stopOpacity="0.8" />
                  <stop offset="1" stopColor="#8b5cf6" stopOpacity="0.85" />
                </radialGradient>
              </defs>
              <g className="hero-bubble" style={{ animationDelay: '0s' }}>
                <circle cx="9" cy="15" r="8" fill="url(#hero-bubble)" stroke="#0284c7" strokeOpacity="0.9" strokeWidth="0.8" />
                <ellipse cx="6.2" cy="11.6" rx="2.2" ry="1.3" fill="#fff" opacity="0.9" transform="rotate(-30 6.2 11.6)" />
              </g>
              <g className="hero-bubble" style={{ animationDelay: '-1.4s' }}>
                <circle cx="24" cy="8" r="5" fill="url(#hero-bubble)" stroke="#0284c7" strokeOpacity="0.9" strokeWidth="0.7" />
                <ellipse cx="22.4" cy="6" rx="1.4" ry="0.8" fill="#fff" opacity="0.9" transform="rotate(-30 22.4 6)" />
              </g>
              <g className="hero-bubble" style={{ animationDelay: '-2.6s' }}>
                <circle cx="28" cy="20" r="3" fill="url(#hero-bubble)" stroke="#0284c7" strokeOpacity="0.9" strokeWidth="0.6" />
              </g>
            </svg>
            {/* a polished-glass glint sweeps across the words every few seconds */}
            <span className="hero-glint text-[13px] font-medium tracking-[0.01em] md:text-[14px]">
              Home &amp; villa cleaning in Riyadh
            </span>
          </p>
          <h1
            className="hero-in mt-5 text-[2.7rem] leading-[0.98] tracking-[-0.035em] text-neutral-900 sm:text-[3.4rem] md:mt-6 md:text-[clamp(3.4rem,5vw,6.25rem)]"
            style={{ animationDelay: '90ms' }}
          >
            <span className="font-[300]">From chaos</span>
            <br />
            <span className="font-[250] italic text-neutral-500">to </span>
            <span className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-sky-700 bg-clip-text font-bold text-transparent">spotless.</span>
          </h1>
          <p
            className="hero-in mt-5 max-w-[21rem] text-[14px] leading-relaxed text-neutral-700 md:ml-auto md:mt-6 md:max-w-[25rem] md:text-[16px]"
            style={{ animationDelay: '180ms' }}
          >
            Deep cleaning for villas and apartments across Riyadh — vetted specialists, eco-certified products and a
            spotless result, guaranteed.
          </p>
          <div
            className="hero-in mt-7 flex items-center gap-4 text-[12px] font-medium text-neutral-700 md:justify-end"
            style={{ animationDelay: '360ms' }}
          >
            <span className="flex items-center gap-2">
              <span className="text-[18px] leading-none tracking-[1px] text-amber-400">★★★★★</span>
              <span className="text-[14px] font-semibold text-neutral-900">4.9</span>
            </span>
            <span className="h-3 w-px bg-neutral-400" />
            <span>1,200+ homes cleaned</span>
            <span className="h-3 w-px bg-neutral-400" />
            <span>Same-day service</span>
          </div>
        </div>
      </div>
    </section>
  );
}
