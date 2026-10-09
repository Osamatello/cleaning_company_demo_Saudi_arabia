'use client';

import React from 'react';
import { useContent } from '../ContentProvider';
import { useInView } from './hooks';
import SectionHeading from './SectionHeading';

// The team at work, in the order of about.alts in the content: the large picture, then the two small ones
const PHOTOS = ['/images/services/marble-polishing.webp', '/images/services/disinfection.webp', '/images/services/appliance-repairs.webp'];

/** About us: the company, the team and the service, beside three pictures cut with the logo's drop corner. */
export default function About() {
  const t = useContent();
  const a = t.about;
  const [ref, shown] = useInView<HTMLDivElement>({ rootMargin: '0px 0px -15% 0px', threshold: 0 });

  const pic = (i: number, className: string, delay: number) => (
    <div className={`reveal overflow-hidden bg-[#efe9df] ${className}`} data-in={shown} style={{ transitionDelay: `${delay}ms` }}>
      <img src={PHOTOS[i]} alt={a.alts[i]} width={720} height={960} loading="lazy" decoding="async" className="h-full w-full object-cover" />
    </div>
  );

  return (
    <section id="about" className="relative bg-white pb-24 pt-6 md:pb-36 md:pt-10">
      <div ref={ref} className="mx-auto grid max-w-7xl grid-cols-1 gap-14 px-5 sm:px-6 lg:grid-cols-12 lg:items-center lg:gap-10 lg:px-8">
        {/* the pictures: one large, two small laid over its edge */}
        <div className="relative pb-[9%] lg:col-span-6">
          <div className="relative me-[22%]">{pic(0, 'aspect-[4/5] rounded-[28px] rounded-ss-[140px]', 0)}</div>
          {pic(1, 'absolute end-0 top-[9%] aspect-[3/4] w-[36%] rounded-[22px] rounded-se-[70px] border-[6px] border-white', 180)}
          {pic(2, 'absolute bottom-0 end-[7%] aspect-square w-[40%] rounded-[22px] rounded-ee-[70px] border-[6px] border-white', 300)}
        </div>

        {/* the words: who we are, then company, team and service */}
        <div className="lg:col-span-6 lg:ps-8 xl:ps-14">
          <SectionHeading h={a} shown={shown} />
          <p className="reveal mt-6 max-w-xl text-[16px] leading-relaxed text-neutral-500" data-in={shown} style={{ transitionDelay: '160ms' }}>
            {a.intro}
          </p>
          <ul className="mt-10 border-t border-neutral-200">
            {a.points.map((p, i) => (
              <li
                key={p.label}
                className="reveal grid grid-cols-[auto_1fr] gap-x-6 border-b border-neutral-200 py-6"
                data-in={shown}
                style={{ transitionDelay: `${240 + i * 110}ms` }}
              >
                <span className="pt-0.5 text-[12px] font-semibold tabular-nums text-sky-600">0{i + 1}</span>
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-neutral-400">{p.label}</p>
                  <h3 className="mt-1.5 text-[1.25rem] font-semibold leading-snug tracking-[-0.01em] text-neutral-900 md:text-[1.35rem]">{p.title}</h3>
                  <p className="mt-1.5 max-w-lg text-[15px] leading-relaxed text-neutral-500">{p.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
