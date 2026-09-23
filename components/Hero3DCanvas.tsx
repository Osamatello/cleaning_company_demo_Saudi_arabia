'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Inter } from 'next/font/google';
import type { HeroScene } from './hero/createHeroScene';

const inter = Inter({ subsets: ['latin'], style: ['normal', 'italic'], display: 'swap' });

export default function Hero3DCanvas() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
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
      if (cueRef.current) cueRef.current.style.opacity = String(Math.max(0, 1 - p * 12));
    };
    const onResize = () => {
      scene?.resize();
      onScroll();
    };

    // three.js is only needed client-side; load it lazily with the scene module.
    import('./hero/createHeroScene').then(({ createHeroScene }) => {
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
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        {/* The page and headline show at once on white; the 3D scene loads in the background and
            fades in only when its first complete frame has been drawn (no loading screen). */}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 block h-full w-full transition-opacity duration-1000 ease-out ${
            ready ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Headline — right-hand side like the reference, stacked on top on small screens */}
        <div className="pointer-events-none absolute inset-x-0 top-[92px] px-6 text-left md:inset-x-auto md:right-[7.5vw] md:top-[31%] md:px-0 md:text-right">
          <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-neutral-500 md:text-[11px]">
            Est. 2026 · Riyadh
          </p>
          <h1 className="mt-3 text-[2.5rem] leading-[1.02] tracking-[-0.02em] text-neutral-900 sm:text-5xl md:mt-4 md:text-[clamp(3rem,4.2vw,5.25rem)]">
            <span className="font-[350]">From chaos</span>
            <br />
            <span className="font-[300] italic text-neutral-400">to </span>
            <span className="font-bold">spotless.</span>
          </h1>
          <p className="mt-4 max-w-[19rem] text-[13px] leading-relaxed text-neutral-500 md:ml-auto md:mt-5 md:text-[15px]">
            Professional cleaning that transforms every corner of your home — scroll to see it happen.
          </p>
        </div>

        {/* Scroll cue */}
        <div
          ref={cueRef}
          className="pointer-events-none absolute bottom-7 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3 transition-opacity duration-300"
        >
          <span className="text-[10px] font-medium uppercase tracking-[0.35em] text-neutral-400">Scroll</span>
          <span className="h-8 w-px bg-neutral-300" />
        </div>

      </div>
    </section>
  );
}
