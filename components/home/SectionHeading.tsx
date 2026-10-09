import React from 'react';
import type { Heading } from '@/content/types';

const SIZES = {
  lg: 'text-[2.6rem] sm:text-6xl md:text-[clamp(3.4rem,5vw,5.25rem)]',
  md: 'text-[2.5rem] sm:text-5xl md:text-[clamp(3rem,4.2vw,4.25rem)]',
  sm: 'text-[2.2rem] sm:text-[2.6rem] md:text-[clamp(2.6rem,3.3vw,3.25rem)]',
};

/** Eyebrow, then the two-line heading in the site's voice: a plain line, then a soft word and a bold one. */
export default function SectionHeading({ h, shown, level = 2, size = 'md' }: { h: Heading; shown: boolean; level?: 1 | 2; size?: keyof typeof SIZES }) {
  const Tag = level === 1 ? 'h1' : 'h2';
  return (
    <div>
      <p className="reveal text-[13px] font-semibold uppercase tracking-[0.24em] text-neutral-600 md:text-[14px]" data-in={shown}>
        {h.eyebrow}
      </p>
      <Tag className={`reveal mt-4 leading-[1.03] tracking-[-0.02em] text-neutral-900 ${SIZES[size]}`} data-in={shown} style={{ transitionDelay: '80ms' }}>
        <span className="font-[350]">{h.line1}</span>
        <br />
        <span className="font-[300] italic text-neutral-400">{h.soft}</span>
        <span className="font-bold">{h.bold}</span>
      </Tag>
    </div>
  );
}
