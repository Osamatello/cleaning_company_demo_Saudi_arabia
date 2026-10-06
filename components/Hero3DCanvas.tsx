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
      scene?.setProgress(p);
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

    const io = new IntersectionObserver(([entry]) => scene?.setActive(entry.isIntersecting), { rootMargin: '100px' });
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
    <section id="hero-3d" ref={sectionRef} className={`${inter.className} relative h-[340vh] w-full bg-white`}>
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

        {/* soft light behind the copy so it stays crisp over the scene */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-[10vw] top-[8%] hidden h-[90vh] w-[60vw] bg-[radial-gradient(closest-side,rgba(255,255,255,0.92),rgba(255,255,255,0.6)_55%,transparent)] md:block"
        />

        {/* Headline — right-hand side, stacked on top on small screens */}
        <div
          className="pointer-events-none absolute inset-x-0 top-[92px] px-6 text-left md:inset-x-auto md:right-[7vw] md:top-[24%] md:px-0 md:text-right"
        >
          <p className="hero-in flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.34em] text-neutral-500 md:justify-end md:text-[11px]">
            <span className="h-px w-10 bg-neutral-400" />
            Home &amp; villa cleaning · Riyadh
          </p>
          <h1
            className="hero-in mt-5 text-[2.7rem] leading-[0.98] tracking-[-0.035em] text-neutral-900 sm:text-[3.4rem] md:mt-6 md:text-[clamp(3.4rem,5vw,6.25rem)]"
            style={{ animationDelay: '90ms' }}
          >
            <span className="font-[300]">From chaos</span>
            <br />
            <span className="font-[250] italic text-neutral-400">to </span>
            <span className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-sky-700 bg-clip-text font-bold text-transparent">spotless.</span>
          </h1>
          <p
            className="hero-in mt-5 max-w-[21rem] text-[14px] leading-relaxed text-neutral-500 md:ml-auto md:mt-6 md:max-w-[25rem] md:text-[16px]"
            style={{ animationDelay: '180ms' }}
          >
            Deep cleaning for villas and apartments across Riyadh — vetted specialists, eco-certified products and a
            spotless result, guaranteed.
          </p>
          <div
            className="hero-in mt-7 flex items-center gap-4 text-[12px] text-neutral-500 md:justify-end"
            style={{ animationDelay: '360ms' }}
          >
            <span className="flex items-center gap-1.5">
              <span className="text-amber-400">★★★★★</span>
              <span className="font-medium text-neutral-800">4.9</span>
            </span>
            <span className="h-3 w-px bg-neutral-300" />
            <span>1,200+ homes cleaned</span>
            <span className="h-3 w-px bg-neutral-300" />
            <span>Same-day service</span>
          </div>
        </div>
      </div>
    </section>
  );
}
