'use client';

import { useEffect } from 'react';

/**
 * Marks page sections that are off screen with `data-offscreen`, which pauses every CSS animation
 * inside them (see globals.css). A looping animation keeps the browser producing frames even when
 * nobody can see it, and that work competes with whatever is on screen.
 */
export default function PauseOffscreen() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.target.toggleAttribute('data-offscreen', !e.isIntersecting)),
      { rootMargin: '0px' }
    );
    document.querySelectorAll('main > section, main > footer, main section[id]').forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);
  return null;
}
