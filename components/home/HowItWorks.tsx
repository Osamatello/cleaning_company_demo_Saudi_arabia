'use client';

import React, { useEffect, useRef } from 'react';
import { CalendarCheck2, Sparkles, KeyRound, type LucideIcon } from 'lucide-react';
import { inter } from './fonts';
import { useInView, useScrollFrame } from './hooks';

type Step = { title: string; text: string; points: string[]; icon: LucideIcon };

const STEPS: Step[] = [
  {
    title: 'Book in two minutes',
    text: 'Choose the service, your district and a time that suits you. You get a fixed price up front — no calls, no surprises.',
    points: ['Same-day slots across Riyadh', 'Fixed, transparent pricing'],
    icon: CalendarCheck2,
  },
  {
    title: 'We arrive and transform',
    text: 'A vetted, insured team arrives fully equipped: industrial steam, HEPA extraction and eco-certified products.',
    points: ['Background-checked specialists', 'Safe for children and pets'],
    icon: Sparkles,
  },
  {
    title: 'Walk into spotless',
    text: 'We finish with a walkthrough together. If anything is less than perfect, we come back and re-clean it free within 24 hours.',
    points: ['Room-by-room inspection', '100% satisfaction guarantee'],
    icon: KeyRound,
  },
];

const SAMPLES = 180;

export default function HowItWorks() {
  const [headRef, headIn] = useInView<HTMLDivElement>({ rootMargin: '0px 0px -20% 0px', threshold: 0 });
  const trackRef = useRef<SVGPathElement>(null);
  const flowRef = useRef<SVGPathElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);
  const geo = useRef({ len: 1, ys: new Float32Array(SAMPLES + 1), xs: new Float32Array(SAMPLES + 1), nodes: [] as number[] });

  // the water: its tip follows a line just below the middle of the screen, as if poured by scrolling
  const containerRef = useScrollFrame<HTMLDivElement>((el) => {
    const g = geo.current;
    const flow = flowRef.current;
    if (!flow || g.len <= 1) return;
    const tipY = window.innerHeight * 0.58 - el.getBoundingClientRect().top;
    let i = 0;
    let lo = 0;
    let hi = SAMPLES;
    if (tipY <= g.ys[0]) i = 0;
    else if (tipY >= g.ys[SAMPLES]) i = SAMPLES;
    else {
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (g.ys[mid] < tipY) lo = mid;
        else hi = mid;
      }
      i = lo + (tipY - g.ys[lo]) / Math.max(1e-3, g.ys[hi] - g.ys[lo]);
    }
    const f = i / SAMPLES;
    flow.style.strokeDashoffset = String(g.len * (1 - f));
    const k = Math.min(SAMPLES - 1, Math.floor(i));
    const t = i - k;
    const x = g.xs[k] + (g.xs[k + 1] - g.xs[k]) * t;
    const y = g.ys[k] + (g.ys[k + 1] - g.ys[k]) * t;
    if (dropRef.current) {
      dropRef.current.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`;
      dropRef.current.style.opacity = f > 0.002 && f < 0.995 ? '1' : '0';
    }
    g.nodes.forEach((ny, n) => stepRefs.current[n]?.setAttribute('data-active', String(y >= ny - 6)));
  });

  // the path runs from the top centre through every step's shape and on to the bottom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const build = () => {
      const box = el.getBoundingClientRect();
      const W = el.clientWidth;
      const H = el.clientHeight;
      const desktop = W >= 768;
      const centres = nodeRefs.current.map((n) => {
        const r = n!.getBoundingClientRect();
        return { x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top };
      });
      if (!centres.length) return;
      const first = centres[0];
      const pts = [desktop ? { x: W / 2, y: 0 } : { x: first.x, y: Math.max(0, first.y - 160) }, ...centres, desktop ? { x: W / 2, y: H } : { x: first.x, y: H }];
      let d = `M${pts[0].x} ${pts[0].y}`;
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1];
        const b = pts[i];
        const dy = b.y - a.y;
        // on mobile the line runs down one column: give it a gentle sway between the steps
        const sway = desktop ? 0 : (i % 2 ? 26 : -26);
        d += `C${a.x + sway} ${a.y + dy * 0.55} ${b.x + sway} ${b.y - dy * 0.55} ${b.x} ${b.y}`;
      }
      trackRef.current?.setAttribute('d', d);
      const flow = flowRef.current!;
      flow.setAttribute('d', d);
      const len = flow.getTotalLength();
      const g = geo.current;
      g.len = len;
      for (let i = 0; i <= SAMPLES; i++) {
        const p = flow.getPointAtLength((len * i) / SAMPLES);
        g.xs[i] = p.x;
        g.ys[i] = p.y;
      }
      // keep the sampled heights monotonic so the tip can be looked up by height
      for (let i = 1; i <= SAMPLES; i++) g.ys[i] = Math.max(g.ys[i], g.ys[i - 1]);
      g.nodes = centres.map((c) => c.y);
      flow.style.strokeDasharray = String(len);
      flow.style.strokeDashoffset = String(len);
      window.dispatchEvent(new Event('scroll'));
    };
    const ro = new ResizeObserver(build);
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef]);

  return (
    <section id="how-it-works" className={`${inter.className} relative section-clip bg-gradient-to-b from-[#f6f4ef] via-[#faf8f5] to-white`}>
      {/* faint contour rings, like ripples on water */}
      <svg aria-hidden className="pointer-events-none absolute -right-64 top-10 h-[760px] w-[760px] text-[#e7e1d5]" viewBox="0 0 200 200" fill="none">
        {[96, 80, 64, 48].map((r) => (
          <circle key={r} cx="100" cy="100" r={r} stroke="currentColor" strokeWidth="0.35" />
        ))}
      </svg>
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-[820px] w-[820px] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(closest-side,rgba(207,250,254,0.6),transparent)]" />

      <div ref={containerRef} className="relative mx-auto max-w-7xl px-5 pb-16 sm:px-6 md:pb-20 lg:px-8">
        <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
          <defs>
            <linearGradient id="hiw-flow" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
              <stop offset="0" stopColor="#38bdf8" />
              <stop offset="0.5" stopColor="#22d3ee" />
              <stop offset="0.88" stopColor="#34d399" />
              {/* the stream thins out as it runs on into the reviews */}
              <stop offset="1" stopColor="#34d399" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path ref={trackRef} fill="none" stroke="#e2dccf" strokeWidth="1.5" strokeDasharray="2 7" strokeLinecap="round" />
          <path ref={flowRef} fill="none" stroke="url(#hiw-flow)" strokeWidth="3" strokeLinecap="round" />
        </svg>
        {/* the leading drop */}
        <div
          ref={dropRef}
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 h-4 w-4 rounded-full bg-white opacity-0 shadow-[0_0_0_4px_rgba(56,189,248,0.35),0_0_24px_6px_rgba(34,211,238,0.45)] transition-opacity duration-300"
        />

        {/* heading sits to the right, clear of the line coming down the middle */}
        <div ref={headRef} className="relative grid grid-cols-1 pt-20 md:grid-cols-12 md:pt-28">
          <div className="md:col-span-5 md:col-start-8">
            <p className="reveal text-[10px] font-medium uppercase tracking-[0.32em] text-neutral-500 md:text-[11px]" data-in={headIn}>
              How it works
            </p>
            <h2
              className="reveal mt-4 text-[2.7rem] leading-[1.02] tracking-[-0.02em] text-neutral-900 sm:text-6xl md:text-[clamp(3.2rem,4.6vw,4.9rem)]"
              data-in={headIn}
              style={{ transitionDelay: '80ms' }}
            >
              <span className="font-[350]">Three steps.</span>
              <br />
              <span className="font-[300] italic text-neutral-400">zero </span>
              <span className="font-bold">effort.</span>
            </h2>
            <p className="reveal mt-6 max-w-sm text-[15px] leading-relaxed text-neutral-500" data-in={headIn} style={{ transitionDelay: '160ms' }}>
              Booking takes two minutes. Everything after that is on us.
            </p>
          </div>
        </div>

        <ol className="relative mt-16 space-y-20 md:mt-24 md:space-y-28">
          {STEPS.map((step, i) => {
            const right = i % 2 === 1;
            const Icon = step.icon;
            return (
              <li
                key={step.title}
                ref={(li) => {
                  stepRefs.current[i] = li;
                }}
                data-active="false"
                className="group relative grid grid-cols-[76px_1fr] items-center gap-6 md:grid-cols-12 md:gap-8"
              >
                {/* the station: an organic shape that fills with water when the line reaches it */}
                <div className={`relative md:col-span-3 ${right ? 'md:order-2 md:col-start-10' : 'md:col-start-2'}`}>
                  <div
                    ref={(n) => {
                      nodeRefs.current[i] = n;
                    }}
                    className="relative mx-auto grid h-[76px] w-[76px] place-items-center md:h-[148px] md:w-[148px]"
                  >
                    <div
                      className="hiw-blob absolute inset-0 border border-[#e2dccf] bg-white shadow-[0_20px_50px_-24px_rgba(15,23,42,0.25)] transition-all duration-700 group-data-[active=true]:border-transparent group-data-[active=true]:bg-gradient-to-br group-data-[active=true]:from-sky-400 group-data-[active=true]:via-cyan-300 group-data-[active=true]:to-emerald-300 group-data-[active=true]:shadow-[0_24px_60px_-18px_rgba(14,165,233,0.55)]"
                      style={{ animationDelay: `${-i * 4}s` }}
                    />
                    <Icon className="relative h-7 w-7 text-neutral-400 transition-colors duration-700 group-data-[active=true]:text-white md:h-10 md:w-10" strokeWidth={1.4} />
                  </div>
                </div>

                <div
                  className={`transition-opacity duration-700 group-data-[active=false]:opacity-45 md:col-span-5 ${
                    right ? 'md:order-1 md:col-start-4' : 'md:col-start-6'
                  }`}
                >
                  <p className="mb-1 text-[13px] font-medium tabular-nums tracking-[0.2em] text-sky-600 md:mb-2 md:text-[15px]">0{i + 1} <span className="text-neutral-400">/ 03</span></p>
                  <h3 className="text-[1.6rem] font-semibold leading-tight tracking-[-0.01em] text-neutral-900 md:text-[2rem]">{step.title}</h3>
                  <p className="mt-3 max-w-md text-[15px] leading-relaxed text-neutral-500">{step.text}</p>
                  <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
                    {step.points.map((p) => (
                      <li key={p} className="flex items-center gap-2 text-[13px] text-neutral-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-br from-sky-400 to-emerald-400" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
