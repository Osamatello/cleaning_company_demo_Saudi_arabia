'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { inter, serif } from './fonts';
import { prefersReducedMotion, useInView } from './hooks';

type Room = { id: string; label: string; place: string; time: string; team: string; work: string };

// Demo imagery: each "before" was made from its "after" photo (grime added), so the pair lines up
// exactly. Replace with real before/after photos from jobs (same framing) when available.
const ROOMS: Room[] = [
  { id: 'living', label: 'Living room', place: 'Villa · Al Nakheel', time: '3h 20m', team: '2 specialists', work: 'Rug shampoo, upholstery steam, glass & skirting detail' },
  { id: 'kitchen', label: 'Kitchen', place: 'Apartment · Al Olaya', time: '2h 45m', team: '2 specialists', work: 'Degreasing, appliance detail, counter & floor restoration' },
  { id: 'bathroom', label: 'Bathroom', place: 'Villa · Hittin', time: '1h 50m', team: '1 specialist', work: 'Limescale & mildew removal, grout and glass polish' },
];

const img = (room: string, kind: 'before' | 'after', w: number) => `/images/before-after/${room}-${kind}-${w}.webp`;
const srcSet = (room: string, kind: 'before' | 'after') => `${img(room, kind, 900)} 900w, ${img(room, kind, 1600)} 1600w`;
const SIZES = '(min-width: 1024px) 78vw, 100vw';

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const BUBBLES = [0.07, 0.15, 0.22, 0.31, 0.38, 0.47, 0.58, 0.64, 0.72, 0.81, 0.88, 0.95];

export default function BeforeAfter() {
  const [active, setActive] = useState(0);
  const [mounted, setMounted] = useState<Set<number>>(() => new Set([0]));
  const [interacted, setInteracted] = useState(false);
  // reveal the heading as the section's top comes in (a ratio threshold never fires on tall phones)
  const [sectionRef, inView] = useInView<HTMLElement>({ rootMargin: '0px 0px -20% 0px', threshold: 0 });
  // the opening wipe waits until the room itself is in view
  const [stageWrapRef, stageIn] = useInView<HTMLDivElement>({ threshold: 0.5 });

  const stageRef = useRef<HTMLDivElement>(null);
  const afterRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<SVGPathElement>(null);
  const glowRef = useRef<SVGPathElement>(null);
  const bubbleRefs = useRef<(SVGCircleElement | null)[]>([]);
  const handleRef = useRef<HTMLDivElement>(null);
  const beforeTagRef = useRef<HTMLSpanElement>(null);
  const afterTagRef = useRef<HTMLSpanElement>(null);

  // slider state lives outside React: it changes every frame while dragging
  const s = useRef({
    pos: 0.08,
    target: 0.08,
    vel: 0,
    amp: 3,
    phase: 0,
    w: 1,
    h: 1,
    drag: false,
    intro: null as null | { from: number; to: number; t0: number; dur: number },
    pending: null as null | { x: number; y: number; id: number },
    raf: 0,
    last: 0,
  });

  const draw = useCallback(() => {
    const st = s.current;
    const { w, h } = st;
    const edge = (y: number) =>
      st.pos * w + st.amp * (0.7 * Math.sin(st.phase + (y / h) * 7.4) + 0.3 * Math.sin(st.phase * 1.6 + (y / h) * 17.9));
    const N = 40;
    let poly = '0px 0px';
    let d = '';
    for (let i = 0; i <= N; i++) {
      const y = (h * i) / N;
      const x = edge(y);
      poly += `,${x.toFixed(1)}px ${y.toFixed(1)}px`;
      d += `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    poly += `,0px ${h}px`;
    if (afterRef.current) afterRef.current.style.clipPath = `polygon(${poly})`;
    lineRef.current?.setAttribute('d', d);
    glowRef.current?.setAttribute('d', d);
    BUBBLES.forEach((f, i) => {
      const c = bubbleRefs.current[i];
      if (!c) return;
      const y = f * h;
      c.setAttribute('cx', (edge(y) + (i % 2 ? 2.5 : -2)).toFixed(1));
      c.setAttribute('cy', y.toFixed(1));
    });
    const hx = edge(h / 2);
    if (handleRef.current) {
      handleRef.current.style.transform = `translate(${hx.toFixed(1)}px, ${(h / 2).toFixed(1)}px) translate(-50%, -50%)`;
      handleRef.current.setAttribute('aria-valuenow', String(Math.round(st.pos * 100)));
    }
    if (afterTagRef.current) afterTagRef.current.style.opacity = String(clamp((st.pos - 0.14) * 8, 0, 1));
    if (beforeTagRef.current) beforeTagRef.current.style.opacity = String(clamp((0.86 - st.pos) * 8, 0, 1));
  }, []);

  const step = useCallback(
    (t: number) => {
      const st = s.current;
      const dt = clamp((t - (st.last || t)) / 1000, 0.001, 0.05);
      st.last = t;
      const prev = st.pos;
      if (st.intro) {
        const k = clamp((t - st.intro.t0) / st.intro.dur, 0, 1);
        st.pos = st.intro.from + (st.intro.to - st.intro.from) * easeInOut(k);
        st.target = st.pos;
        if (k >= 1) st.intro = null;
      } else {
        st.pos += (st.target - st.pos) * (1 - Math.exp(-dt * (st.drag ? 28 : 14)));
        if (Math.abs(st.target - st.pos) < 0.0004) st.pos = st.target;
      }
      st.vel = (st.pos - prev) / dt;
      const speed = Math.min(1, Math.abs(st.vel) * 0.8);
      st.amp += (3 + speed * 15 - st.amp) * (1 - Math.exp(-dt * 6));
      st.phase += dt * (1 + speed * 10);
      draw();
      const busy = st.drag || st.intro || st.pos !== st.target || Math.abs(st.amp - 3) > 0.05;
      st.raf = busy ? requestAnimationFrame(step) : 0;
      if (!busy) st.last = 0;
    },
    [draw]
  );

  const kick = useCallback(() => {
    if (!s.current.raf) s.current.raf = requestAnimationFrame(step);
  }, [step]);

  const sweep = useCallback(
    (from: number, to: number, dur: number) => {
      if (prefersReducedMotion()) {
        s.current.pos = s.current.target = to;
        draw();
        return;
      }
      s.current.intro = { from, to, t0: performance.now(), dur };
      kick();
    },
    [draw, kick]
  );

  // size + the stage outline (a rounded frame with an editorial notch for the caption on desktop)
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      s.current.w = w;
      s.current.h = h;
      if (w >= 768) {
        const R = 30;
        const r = 22;
        const nw = Math.round(clamp(w * 0.36, 300, 440));
        const nh = 96;
        el.style.clipPath = `path('M${R} 0H${w - R}Q${w} 0 ${w} ${R}V${h - R}Q${w} ${h} ${w - R} ${h}H${nw + r}Q${nw} ${h} ${nw} ${h - r}V${h - nh + r}Q${nw} ${h - nh} ${nw - r} ${h - nh}H${r}Q0 ${h - nh} 0 ${h - nh - r}V${R}Q0 0 ${R} 0Z')`;
      } else {
        el.style.clipPath = '';
      }
      draw();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [draw]);

  // first time on screen: one squeegee pass across the room, then load the other rooms quietly
  useEffect(() => {
    if (!stageIn) return;
    sweep(0.08, 0.56, 1900);
    const t = setTimeout(() => setMounted(new Set(ROOMS.map((_, i) => i))), 2500);
    return () => clearTimeout(t);
  }, [stageIn, sweep]);

  useEffect(() => () => cancelAnimationFrame(s.current.raf), []);

  const posFromEvent = (e: React.PointerEvent) => {
    const r = stageRef.current!.getBoundingClientRect();
    return clamp((e.clientX - r.left) / r.width, 0.02, 0.98);
  };
  const beginDrag = (e: React.PointerEvent) => {
    const st = s.current;
    st.drag = true;
    st.intro = null;
    st.pending = null;
    stageRef.current?.setPointerCapture(e.pointerId);
    st.target = posFromEvent(e);
    setInteracted(true);
    kick();
  };
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    // touch: wait to see whether this is a sideways drag or a page scroll
    if (e.pointerType === 'mouse') beginDrag(e);
    else s.current.pending = { x: e.clientX, y: e.clientY, id: e.pointerId };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const st = s.current;
    if (st.pending) {
      const dx = Math.abs(e.clientX - st.pending.x);
      const dy = Math.abs(e.clientY - st.pending.y);
      if (dx > 8 && dx > dy) beginDrag(e);
      else if (dy > 10) st.pending = null;
      return;
    }
    if (!st.drag) return;
    st.target = posFromEvent(e);
    kick();
  };
  const endDrag = () => {
    s.current.drag = false;
    s.current.pending = null;
    kick();
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    const st = s.current;
    const k = { ArrowLeft: -0.05, ArrowRight: 0.05, ArrowDown: -0.05, ArrowUp: 0.05 }[e.key];
    if (k !== undefined) st.target = clamp(st.target + k, 0.02, 0.98);
    else if (e.key === 'Home') st.target = 0.02;
    else if (e.key === 'End') st.target = 0.98;
    else return;
    e.preventDefault();
    st.intro = null;
    setInteracted(true);
    kick();
  };

  const choose = (i: number) => {
    if (i === active) return;
    setMounted((m) => new Set(m).add(i));
    setActive(i);
    sweep(Math.min(s.current.pos, 0.1), 0.56, 1500);
  };
  const warm = (i: number) => setMounted((m) => (m.has(i) ? m : new Set(m).add(i)));

  const room = ROOMS[active];

  return (
    <section
      id="results"
      ref={sectionRef}
      className={`${inter.className} relative section-clip bg-[#f6f4ef] pb-28 pt-32 md:pb-40 md:pt-44`}
    >
      {/* the white of the Services section flows down into this one along a soft curve */}
      <svg aria-hidden className="absolute inset-x-0 top-0 h-[64px] w-full md:h-[110px]" viewBox="0 0 1440 110" preserveAspectRatio="none">
        <path d="M0 0H1440V30C1210 96 900 112 590 74 370 47 170 52 0 96Z" fill="#ffffff" />
      </svg>
      <div aria-hidden className="pointer-events-none absolute -right-48 top-48 h-[560px] w-[560px] rounded-full bg-sky-200/40 blur-[130px]" />
      <div aria-hidden className="pointer-events-none absolute -left-40 bottom-10 h-[420px] w-[420px] rounded-full bg-emerald-100/50 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        {/* heading: the same voice as the Hero headline */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <p className="reveal text-[10px] font-medium uppercase tracking-[0.32em] text-neutral-500 md:text-[11px]" data-in={inView}>
              The difference
            </p>
            <h2
              className="reveal mt-4 text-[2.7rem] leading-[1.02] tracking-[-0.02em] text-neutral-900 sm:text-6xl md:text-[clamp(3.4rem,5vw,5.25rem)]"
              data-in={inView}
              style={{ transitionDelay: '80ms' }}
            >
              <span className="font-[350]">Same room.</span>
              <br />
              <span className="font-[300] italic text-neutral-400">two hours </span>
              <span className="font-bold">apart.</span>
            </h2>
          </div>
          <p
            className="reveal max-w-sm text-[15px] leading-relaxed text-neutral-500 md:col-span-4 md:col-start-9 md:pb-3"
            data-in={inView}
            style={{ transitionDelay: '160ms' }}
          >
            Drag across the room to wipe away the before. Every job ends with a walkthrough — nothing is signed off until it looks like this.
          </p>
        </div>

        {/* room index: pills on mobile */}
        <div className="-mx-5 mt-10 flex gap-2 overflow-x-auto px-5 pb-1 md:hidden" role="tablist" aria-label="Rooms">
          {ROOMS.map((r, i) => (
            <button
              key={r.id}
              role="tab"
              aria-selected={i === active}
              onClick={() => choose(i)}
              className={`shrink-0 rounded-full border px-4 py-2 text-[13px] transition-colors ${
                i === active ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300 text-neutral-600'
              }`}
            >
              <span className={`${serif.className} mr-1.5 text-[14px] italic opacity-60`}>0{i + 1}</span>
              {r.label}
            </button>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-10 md:mt-16 md:grid-cols-12">
          {/* the stage */}
          <div ref={stageWrapRef} className="relative md:col-span-10">
            <div aria-hidden className="absolute inset-x-10 -bottom-6 top-16 -z-10 rounded-[48px] bg-[#5b4a2f]/20 blur-3xl" />
            <div
              ref={stageRef}
              className="ba-stage section-clip relative aspect-[4/3] w-full select-none rounded-[26px] bg-[#e9e4da] md:aspect-[16/10] md:rounded-none"
              style={{ touchAction: 'pan-y', cursor: 'ew-resize' }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onLostPointerCapture={endDrag}
            >
              {/* before: the full room underneath */}
              {ROOMS.map((r, i) =>
                mounted.has(i) ? (
                  <img
                    key={`b-${r.id}`}
                    src={img(r.id, 'before', 1600)}
                    srcSet={srcSet(r.id, 'before')}
                    sizes={SIZES}
                    alt={i === active ? `${r.label} before cleaning` : ''}
                    width={1600}
                    height={1000}
                    decoding="async"
                    draggable={false}
                    className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
                    style={{ opacity: i === active ? 1 : 0 }}
                  />
                ) : null
              )}
              {/* after: clipped to the clean side of the squeegee */}
              <div ref={afterRef} className="absolute inset-0" style={{ clipPath: 'inset(0 100% 0 0)', transform: 'translateZ(0)' }}>
                {ROOMS.map((r, i) =>
                  mounted.has(i) ? (
                    <img
                      key={`a-${r.id}`}
                      src={img(r.id, 'after', 1600)}
                      srcSet={srcSet(r.id, 'after')}
                      sizes={SIZES}
                      alt={i === active ? `${r.label} after cleaning` : ''}
                      width={1600}
                      height={1000}
                      decoding="async"
                      draggable={false}
                      className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
                      style={{ opacity: i === active ? 1 : 0 }}
                    />
                  ) : null
                )}
              </div>

              {/* the wet edge: a sheen, the blade line and a few suds riding along it */}
              <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
                <path ref={glowRef} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="14" style={{ filter: 'blur(6px)' }} />
                <path ref={lineRef} fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="2" />
                {BUBBLES.map((f, i) => (
                  <circle
                    key={f}
                    ref={(c) => {
                      bubbleRefs.current[i] = c;
                    }}
                    r={i % 3 === 0 ? 4.5 : i % 3 === 1 ? 2.5 : 3.4}
                    fill="rgba(255,255,255,0.35)"
                    stroke="rgba(255,255,255,0.9)"
                    strokeWidth="1"
                  />
                ))}
              </svg>

              <span
                ref={afterTagRef}
                className="pointer-events-none absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-900 shadow-sm md:left-6 md:top-6"
              >
                After
              </span>
              <span
                ref={beforeTagRef}
                className="pointer-events-none absolute right-4 top-4 rounded-full bg-neutral-900/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white md:right-6 md:top-6"
              >
                Before
              </span>

              {/* handle */}
              <div
                ref={handleRef}
                role="slider"
                tabIndex={0}
                aria-label="Before and after comparison: move left or right"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={8}
                onKeyDown={onKeyDown}
                className="ba-handle absolute left-0 top-0 grid h-14 w-14 place-items-center rounded-full bg-white text-neutral-900 shadow-[0_10px_30px_-8px_rgba(15,23,42,0.45)] outline-none ring-sky-400/60 focus-visible:ring-4 md:h-16 md:w-16"
              >
                <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden>
                  <path d="M9 8l-5 5 5 5M17 8l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span
                  className={`pointer-events-none absolute top-full mt-3 whitespace-nowrap rounded-full bg-neutral-900/80 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-white transition-opacity duration-500 ${
                    stageIn && !interacted ? 'opacity-100' : 'opacity-0'
                  }`}
                  // shown once the opening wipe has come to rest
                  style={{ transitionDelay: stageIn && !interacted ? '1.7s' : '0s' }}
                >
                  Drag to clean
                </span>
              </div>
            </div>

            {/* caption: sits in the frame's notch on desktop, below it on mobile */}
            <div className="mt-5 md:absolute md:bottom-0 md:left-0 md:mt-0 md:w-[clamp(280px,32%,410px)] md:pr-6">
              <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-neutral-500">{room.place}</p>
              <p className="mt-1.5 text-[15px] text-neutral-900">
                <span className={`${serif.className} text-[22px] leading-none`}>{room.time}</span>
                <span className="mx-2 text-neutral-300">/</span>
                {room.team}
              </p>
              <p className="mt-1 text-[13px] leading-snug text-neutral-500">{room.work}</p>
            </div>
          </div>

          {/* room index: an editorial rail on desktop */}
          <div className="hidden md:col-span-2 md:block">
            <ol className="sticky top-32 space-y-1 border-l border-neutral-300/70" role="tablist" aria-label="Rooms">
              {ROOMS.map((r, i) => (
                <li key={r.id}>
                  <button
                    role="tab"
                    aria-selected={i === active}
                    onClick={() => choose(i)}
                    onMouseEnter={() => warm(i)}
                    onFocus={() => warm(i)}
                    className="group relative block w-full py-3 pl-5 text-left"
                  >
                    <span
                      className={`absolute -left-px top-3 bottom-3 w-[2px] origin-top rounded-full bg-gradient-to-b from-sky-500 to-emerald-400 transition-transform duration-500 ${
                        i === active ? 'scale-y-100' : 'scale-y-0'
                      }`}
                    />
                    <span className={`${serif.className} block text-[15px] italic ${i === active ? 'text-sky-600' : 'text-neutral-400'}`}>0{i + 1}</span>
                    <span
                      className={`block text-[17px] leading-tight transition-colors ${
                        i === active ? 'font-semibold text-neutral-900' : 'text-neutral-500 group-hover:text-neutral-800'
                      }`}
                    >
                      {r.label}
                    </span>
                    <span className="mt-0.5 block text-[12px] text-neutral-400">{r.time}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* the blade's line carries on down into How It Works */}
      <div aria-hidden className="absolute bottom-0 left-1/2 h-28 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-sky-300/60 to-sky-400" />
    </section>
  );
}
