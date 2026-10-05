'use client';

import { useEffect, useRef, useState } from 'react';

/** True once the element has scrolled into view (never flips back). */
export function useInView<T extends Element>(options: IntersectionObserverInit = { threshold: 0.2 }) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        io.disconnect();
      }
    }, options);
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);
  return [ref, inView] as const;
}

/** Whether the element is currently on screen (for pausing work that isn't visible). */
export function useOnScreen<T extends Element>(rootMargin = '0px') {
  const ref = useRef<T>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setOn(entry.isIntersecting), { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);
  return [ref, on] as const;
}

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Calls `onFrame` (at most once per animation frame) while the page scrolls or resizes and the
 * element is near the viewport. No React state: callers write straight to the DOM.
 */
export function useScrollFrame<T extends Element>(onFrame: (el: T) => void) {
  const ref = useRef<T>(null);
  const cb = useRef(onFrame);
  cb.current = onFrame;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let near = false;
    const tick = () => {
      raf = 0;
      cb.current(el);
    };
    const request = () => {
      if (near && !raf) raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        near = entry.isIntersecting;
        request();
      },
      { rootMargin: '200px 0px' }
    );
    io.observe(el);
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    return () => {
      io.disconnect();
      window.removeEventListener('scroll', request);
      window.removeEventListener('resize', request);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return ref;
}
