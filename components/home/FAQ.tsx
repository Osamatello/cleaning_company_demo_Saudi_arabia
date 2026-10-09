'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useContent } from '../ContentProvider';
import { useInView } from './hooks';
import SectionHeading from './SectionHeading';

/** Frequently asked questions: one answer open at a time, each sliding open under its question. */
export default function FAQ() {
  const t = useContent();
  const f = t.faq;
  const [open, setOpen] = useState<number | null>(0);
  const [ref, shown] = useInView<HTMLDivElement>({ rootMargin: '0px 0px -15% 0px', threshold: 0 });

  return (
    <section id="faq" className="relative border-t border-slate-200 bg-white py-24 md:py-32">
      <div ref={ref} className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-5 sm:px-6 lg:grid-cols-12 lg:gap-10 lg:px-8">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-32">
            <SectionHeading h={f} shown={shown} />
            <p className="reveal mt-6 max-w-sm text-[15px] leading-relaxed text-neutral-500" data-in={shown} style={{ transitionDelay: '160ms' }}>
              {f.intro}
            </p>
          </div>
        </div>

        <ul className="border-t border-neutral-200 lg:col-span-7">
          {f.items.map((item, i) => {
            const isOpen = open === i;
            return (
              <li key={item.q} className="reveal border-b border-neutral-200" data-in={shown} style={{ transitionDelay: `${160 + i * 60}ms` }}>
                <h3>
                  <button
                    type="button"
                    id={`faq-q-${i}`}
                    aria-expanded={isOpen}
                    aria-controls={`faq-a-${i}`}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="group flex w-full items-start justify-between gap-6 py-6 text-start md:py-7"
                  >
                    <span className="flex gap-5">
                      <span className={`w-4 shrink-0 pt-1 text-[12px] font-semibold tabular-nums transition-colors ${isOpen ? 'text-sky-600' : 'text-neutral-400'}`}>
                        0{i + 1}
                      </span>
                      <span className="text-[17px] font-medium leading-snug text-neutral-900 md:text-[19px]">{item.q}</span>
                    </span>
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border transition-[transform,background-color,border-color,color] duration-500 ${
                        isOpen ? 'rotate-45 border-sky-600 bg-sky-600 text-white' : 'border-neutral-300 text-neutral-700 group-hover:border-neutral-900'
                      }`}
                    >
                      <Plus className="h-4 w-4" />
                    </span>
                  </button>
                </h3>
                <div
                  id={`faq-a-${i}`}
                  role="region"
                  aria-labelledby={`faq-q-${i}`}
                  aria-hidden={!isOpen}
                  className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                >
                  <div className="overflow-hidden">
                    <p className="max-w-2xl pb-7 pe-16 ps-9 text-[15px] leading-relaxed text-neutral-500 md:text-[16px]">{item.a}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
