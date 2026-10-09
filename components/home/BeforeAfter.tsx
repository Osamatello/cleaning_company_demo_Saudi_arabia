'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { prefersReducedMotion, useInView } from './hooks';
import { useContent } from '../ContentProvider';
import { fill } from '@/content/types';

// Demo imagery: each "before" is its "after" photo with AI-generated clutter composited in, so the pair lines up
// exactly. Replace with real before/after photos from jobs (same framing) when available.
// Photo names, in the same order as the rooms in the content (their words are in content/*.ts).
const ROOM_IDS = ['living', 'kitchen', 'bathroom'];

const img = (room: string, kind: 'before' | 'after', w: number) => `/images/before-after/${room}-${kind}-${w}.webp`;
const srcSet = (room: string, kind: 'before' | 'after') => `${img(room, kind, 900)} 900w, ${img(room, kind, 1600)} 1600w`;
const SIZES = '(min-width: 1024px) 78vw, 100vw';

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export default function BeforeAfter() {
  const copy = useContent();
  const ba = copy.beforeAfter;
  const rtl = copy.dir === 'rtl';
  const ROOMS = ba.rooms.map((r, i) => ({ ...r, id: ROOM_IDS[i] }));
  const [active, setActive] = useState(0);
  const [mounted, setMounted] = useState<Set<number>>(() => new Set([0]));
  const [interacted, setInteracted] = useState(false);
  // reveal the heading as the section's top comes in (a ratio threshold never fires on tall phones)
  const [sectionRef, inView] = useInView<HTMLElement>({ rootMargin: '0px 0px -20% 0px', threshold: 0 });
  // the opening wipe waits until the room itself is in view
  const [stageWrapRef, stageIn] = useInView<HTMLDivElement>({ threshold: 0.5 });

  const stageRef = useRef<HTMLDivElement>(null);
  const afterRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const beforeTagRef = useRef<HTMLSpanElement>(null);
  const afterTagRef = useRef<HTMLSpanElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);

  // slider state lives outside React: it changes every frame while dragging
  const s = useRef({
    pos: 0.08,
    target: 0.08,
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
    // a straight divider: the clean side is clipped to everything left of it
    const hx = st.pos * w;
    if (afterRef.current) afterRef.current.style.clipPath = `inset(0 ${(w - hx).toFixed(1)}px 0 0)`;
    if (lineRef.current) lineRef.current.style.transform = `translateX(${hx.toFixed(1)}px)`;
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
      if (st.intro) {
        const k = clamp((t - st.intro.t0) / st.intro.dur, 0, 1);
        st.pos = st.intro.from + (st.intro.to - st.intro.from) * easeInOut(k);
        st.target = st.pos;
        if (k >= 1) st.intro = null;
      } else {
        st.pos += (st.target - st.pos) * (1 - Math.exp(-dt * (st.drag ? 28 : 14)));
        if (Math.abs(st.target - st.pos) < 0.0004) st.pos = st.target;
      }
      draw();
      const busy = st.drag || st.intro || st.pos !== st.target;
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
        // the notch is as tall as the caption plus some air, so longer (Arabic) captions never touch the photo
        const nh = Math.max(96, (captionRef.current?.offsetHeight ?? 0) + 26);
        const X = (x: number) => (rtl ? w - x : x);
        el.style.clipPath = `path('M${X(R)} 0H${X(w - R)}Q${X(w)} 0 ${X(w)} ${R}V${h - R}Q${X(w)} ${h} ${X(w - R)} ${h}H${X(nw + r)}Q${X(nw)} ${h} ${X(nw)} ${h - r}V${h - nh + r}Q${X(nw)} ${h - nh} ${X(nw - r)} ${h - nh}H${X(r)}Q${X(0)} ${h - nh} ${X(0)} ${h - nh - r}V${R}Q${X(0)} 0 ${X(R)} 0Z')`;
      } else {
        el.style.clipPath = '';
      }
      draw();
    });
    ro.observe(el);
    if (captionRef.current) ro.observe(captionRef.current);
    return () => ro.disconnect();
  }, [draw, rtl]);

  // phones: once a sideways drag has begun, the page must not scroll under the finger, or the browser takes
  // the gesture over and the drag stops dead (React's touch listeners are passive, so this one is added by hand)
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const hold = (e: TouchEvent) => {
      if (s.current.drag && e.cancelable) e.preventDefault();
    };
    el.addEventListener('touchmove', hold, { passive: false });
    return () => el.removeEventListener('touchmove', hold);
  }, []);

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
    // mouse, or a finger on the handle itself: drag at once; elsewhere on the photo a finger may be
    // scrolling the page, so wait to see whether it moves sideways
    if (e.pointerType === 'mouse' || handleRef.current?.contains(e.target as Node)) beginDrag(e);
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
      className={`relative -mt-[2px] section-clip bg-[#f6f4ef] pb-12 pt-20 md:pb-40 md:pt-28`}
    >
      {/* the white of the Services section flows down into this one along a soft curve */}
      <svg aria-hidden className="absolute inset-x-0 -top-px h-[41px] w-full md:h-[65px]" viewBox="0 0 1440 110" preserveAspectRatio="none">
        <path d="M0 0H1440V30C1210 96 900 112 590 74 370 47 170 52 0 96Z" fill="#ffffff" />
      </svg>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        {/* heading: the same voice as the Hero headline */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <p className="reveal text-[13px] font-semibold uppercase tracking-[0.24em] text-neutral-600 md:text-[14px]" data-in={inView}>
              {ba.eyebrow}
            </p>
            <h2
              className="reveal mt-4 text-[2.7rem] leading-[1.02] tracking-[-0.02em] text-neutral-900 sm:text-6xl md:text-[clamp(3.4rem,5vw,5.25rem)]"
              data-in={inView}
              style={{ transitionDelay: '80ms' }}
            >
              <span className="font-[350]">{ba.line1}</span>
              <br />
              <span className="font-[300] italic text-neutral-400">{ba.soft}</span>
              <span className="font-bold">{ba.bold}</span>
            </h2>
          </div>
          <p
            className="reveal max-w-sm text-[15px] leading-relaxed text-neutral-500 md:col-span-4 md:col-start-9 md:pb-3"
            data-in={inView}
            style={{ transitionDelay: '160ms' }}
          >
            {ba.intro}
          </p>
        </div>

        {/* room index: pills on mobile */}
        <div className="-mx-5 mt-10 flex gap-2 overflow-x-auto px-5 pb-1 md:hidden" role="tablist" aria-label={ba.roomsLabel}>
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
              <span className={`me-1.5 text-[12px] font-medium tabular-nums opacity-60`}>0{i + 1}</span>
              {r.label}
            </button>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-10 md:mt-16 md:grid-cols-12">
          {/* the stage */}
          <div ref={stageWrapRef} className="relative md:col-span-10">
            {/* soft shadow under the stage: a radial gradient, not a blur filter (a 64px blur over an
                area this size is one of the most expensive things a GPU can be asked to draw) */}
            <div aria-hidden className="pointer-events-none absolute inset-x-4 -bottom-20 top-1/3 -z-10 bg-[radial-gradient(closest-side,rgba(91,74,47,0.22),rgba(91,74,47,0.08)_62%,transparent)]" />
            <div
              ref={stageRef}
              dir="ltr"
              className="ba-stage section-clip relative aspect-[4/3] w-full select-none rounded-[26px] bg-[#e9e4da] md:aspect-[16/10] md:rounded-none"
              style={{ touchAction: 'pan-y', cursor: 'ew-resize' }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              // a finger is captured by the photo it lands on; taking the capture over for the stage makes the
              // photo lose it, and that event bubbles up here, so only the stage's own loss ends the drag
              onLostPointerCapture={(e) => {
                if (e.target === e.currentTarget) endDrag();
              }}
            >
              {/* before: the full room underneath */}
              {ROOMS.map((r, i) =>
                mounted.has(i) ? (
                  <img
                    key={`b-${r.id}`}
                    src={img(r.id, 'before', 1600)}
                    srcSet={srcSet(r.id, 'before')}
                    sizes={SIZES}
                    alt={i === active ? fill(ba.beforeAlt, { room: r.label }) : ''}
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
                      alt={i === active ? fill(ba.afterAlt, { room: r.label }) : ''}
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

              {/* the divider: one straight line */}
              <div ref={lineRef} aria-hidden className="pointer-events-none absolute left-0 top-0 -ml-px h-full w-[2px] bg-white shadow-[0_0_0_1px_rgba(15,23,42,0.08)]" />

              <span
                ref={afterTagRef}
                className="pointer-events-none absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-900 shadow-sm md:left-6 md:top-6"
              >
                {ba.after}
              </span>
              <span
                ref={beforeTagRef}
                className="pointer-events-none absolute right-4 top-4 rounded-full bg-neutral-900/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white md:right-6 md:top-6"
              >
                {ba.before}
              </span>

              {/* handle */}
              <div
                ref={handleRef}
                role="slider"
                tabIndex={0}
                aria-label={ba.sliderAria}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={8}
                onKeyDown={onKeyDown}
                style={{ touchAction: 'none' }}
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
                  {ba.drag}
                </span>
              </div>
            </div>

            {/* caption: sits in the frame's notch on desktop, below it on mobile */}
            <div ref={captionRef} className="mt-5 md:absolute md:bottom-0 md:start-0 md:mt-0 md:w-[clamp(280px,32%,410px)] md:pe-6">
              <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-neutral-500">{room.place}</p>
              <p className="mt-1.5 text-[15px] text-neutral-900">
                <span className={`text-[20px] font-[350] leading-none tracking-[-0.01em]`}>{room.time}</span>
                <span className="mx-2 text-neutral-300">/</span>
                {room.team}
              </p>
              <p className="mt-1 text-[13px] leading-snug text-neutral-500">{room.work}</p>
            </div>
          </div>

          {/* room index: an editorial rail on desktop */}
          <div className="hidden md:col-span-2 md:block">
            <ol className="sticky top-32 space-y-1 border-s border-neutral-300/70" role="tablist" aria-label={ba.roomsLabel}>
              {ROOMS.map((r, i) => (
                <li key={r.id}>
                  <button
                    role="tab"
                    aria-selected={i === active}
                    onClick={() => choose(i)}
                    onMouseEnter={() => warm(i)}
                    onFocus={() => warm(i)}
                    className="group relative block w-full py-3 ps-5 text-start"
                  >
                    <span
                      className={`absolute -start-px top-3 bottom-3 w-[2px] bg-sky-600 ${i === active ? 'block' : 'hidden'}`}
                    />
                    <span className={`block text-[12px] font-medium tabular-nums ${i === active ? 'text-sky-600' : 'text-neutral-400'}`}>0{i + 1}</span>
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

      {/* a hairline carries on down into How It Works (desktop only: on a phone it hangs on its own) */}
      <div aria-hidden className="absolute bottom-0 left-1/2 hidden h-28 w-px -translate-x-1/2 bg-sky-300 md:block" />
    </section>
  );
}
