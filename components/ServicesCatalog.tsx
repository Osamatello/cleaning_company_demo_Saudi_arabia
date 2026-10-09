'use client';

import React from 'react';
import { ArrowRight, Phone } from 'lucide-react';
import { useContent } from './ContentProvider';
import { useInView } from './home/hooks';
import SectionHeading from './home/SectionHeading';
import { CLEANING_IMAGES, MAINTENANCE_IMAGES, ServiceCard } from './ServicesPreview';
import type { ServiceGroup } from '@/content/types';

const photo = (name: string) => `/images/services/${name}.webp`;
// each list starts with the homepage's three, then the rest in the order of servicesPage.*More in the content
const CLEANING_ALL = [...CLEANING_IMAGES, ...['disinfection', 'facade-windows', 'marble-polishing', 'kitchen-deep-cleaning', 'move-in-out'].map(photo)];
const MAINTENANCE_ALL = [
  ...MAINTENANCE_IMAGES,
  ...['painting-walls', 'carpentry-doors', 'appliance-repairs', 'tiling-grout', 'mounting-installation'].map(photo),
];

/** the logo's drop, drawn large and faint in the corner of a panel */
function Drop({ className }: { className: string }) {
  return (
    <svg aria-hidden viewBox="0 0.85 40 40" className={`pointer-events-none absolute ${className}`} fill="none">
      <path d="M20 3.5C20 3.5 7 17.2 7 25.2a13 13 0 0 0 26 0C33 17.2 20 3.5 20 3.5Z" stroke="currentColor" strokeWidth="0.18" />
      <path d="M20 8.5C20 8.5 10.5 19 10.5 25.2a9.5 9.5 0 0 0 19 0C29.5 19 20 8.5 20 8.5Z" stroke="currentColor" strokeWidth="0.14" />
    </svg>
  );
}

/** a card that shows itself as it scrolls into view (a long list, so each card watches for itself) */
function Card({ title, description, image, index }: { title: string; description: string; image: string; index: number }) {
  const [ref, shown] = useInView<HTMLDivElement>({ rootMargin: '0px 0px -10% 0px', threshold: 0 });
  return (
    <div ref={ref}>
      <ServiceCard title={title} description={description} image={image} index={index} shown={shown} aspect="aspect-[4/3] sm:aspect-[4/5]" />
    </div>
  );
}

/**
 * One service type in its own panel: cleaning in a cool, water-blue tint and maintenance in warm sand,
 * each with its own number, so the two never read as one list.
 */
function Group({
  id,
  number,
  group,
  items,
  images,
  tone,
}: {
  id: string;
  number: string;
  group: ServiceGroup;
  items: { title: string; description: string }[];
  images: string[];
  tone: 'cool' | 'warm';
}) {
  const [ref, shown] = useInView<HTMLDivElement>({ rootMargin: '0px 0px -15% 0px', threshold: 0 });
  const cool = tone === 'cool';
  return (
    <section id={id} className="scroll-mt-20 bg-white pb-5 md:pb-8">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className={`relative overflow-hidden rounded-[32px] px-5 pb-14 pt-12 sm:px-8 md:rounded-[40px] md:px-14 md:pb-20 md:pt-16 ${cool ? 'bg-[#eef5f9]' : 'bg-[#f6f4ef]'}`}>
          <Drop className={`-bottom-56 -end-32 h-[560px] w-[560px] md:-bottom-72 md:-end-24 ${cool ? 'text-[#d6e7f1]' : 'text-[#e9e3d7]'}`} />
          <div className="relative">
            <div ref={ref} className="grid grid-cols-1 gap-6 md:grid-cols-12 md:items-end md:gap-8">
              <div className="flex items-start gap-5 md:col-span-8 md:gap-8">
                <span
                  className={`reveal text-[3.5rem] font-[200] leading-[0.9] tabular-nums md:text-[6rem] ${cool ? 'text-sky-600/70' : 'text-[#b49c76]'}`}
                  data-in={shown}
                >
                  {number}
                </span>
                <div>
                  <p className="reveal text-[13px] font-semibold uppercase tracking-[0.24em] text-neutral-600 md:text-[14px]" data-in={shown}>
                    {group.eyebrow}
                  </p>
                  <h2
                    className="reveal mt-3 text-[2.3rem] font-[350] leading-[1.04] tracking-[-0.025em] text-neutral-900 sm:text-5xl md:text-[clamp(2.8rem,4vw,4rem)]"
                    data-in={shown}
                    style={{ transitionDelay: '80ms' }}
                  >
                    {group.title}
                  </h2>
                </div>
              </div>
              <p
                className="reveal max-w-sm text-[15px] leading-relaxed text-neutral-500 md:col-span-4 md:justify-self-end md:text-end"
                data-in={shown}
                style={{ transitionDelay: '160ms' }}
              >
                {group.intro}
              </p>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 md:mt-16 lg:grid-cols-4 lg:gap-x-7 lg:gap-y-14">
              {items.map((s, i) => (
                <Card key={s.title} title={s.title} description={s.description} image={images[i]} index={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** The /services page body: a heading, the two service types apart, and one booking call to action at the end. */
export default function ServicesCatalog() {
  const t = useContent();
  const p = t.servicesPage;
  const home = t.locale === 'ar' ? '/ar' : '/';
  const [headRef, headIn] = useInView<HTMLDivElement>({ threshold: 0 });
  const [ctaRef, ctaIn] = useInView<HTMLDivElement>({ rootMargin: '0px 0px -15% 0px', threshold: 0 });

  return (
    <>
      <section className="bg-white pb-12 pt-32 md:pb-16 md:pt-44">
        <div ref={headRef} className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <SectionHeading h={p} shown={headIn} level={1} />
          <p
            className="reveal mt-6 max-w-xl text-[16px] leading-relaxed text-neutral-500"
            data-in={headIn}
            style={{ transitionDelay: '160ms' }}
          >
            {p.intro}
          </p>
        </div>
      </section>

      <Group id="cleaning" number="01" group={t.services.cleaning} items={[...t.services.cleaning.items, ...p.cleaningMore]} images={CLEANING_ALL} tone="cool" />
      <Group
        id="maintenance"
        number="02"
        group={t.services.maintenance}
        items={[...t.services.maintenance.items, ...p.maintenanceMore]}
        images={MAINTENANCE_ALL}
        tone="warm"
      />

      {/* one call to action for the whole page: book an appointment, or call */}
      <section id="book" className="bg-white pb-24 pt-14 md:pb-32 md:pt-20">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div ref={ctaRef} className="relative overflow-hidden rounded-[32px] bg-[#efe7da] px-6 py-16 sm:px-10 md:rounded-[40px] md:px-16 md:py-24">
            <Drop className="-bottom-48 -start-28 h-[520px] w-[520px] text-[#ddd0bb] md:-bottom-64 md:-start-20" />
            <Drop className="-end-24 -top-40 h-[380px] w-[380px] text-[#e6dccb] md:-end-10" />
            <div className="relative mx-auto max-w-3xl text-center">
              <p className="reveal text-[13px] font-semibold uppercase tracking-[0.24em] text-neutral-600 md:text-[14px]" data-in={ctaIn}>
                {p.cta.eyebrow}
              </p>
              <h2
                className="reveal mt-5 text-[2.5rem] leading-[1.05] tracking-[-0.02em] text-neutral-900 sm:text-5xl md:text-[clamp(3rem,4.4vw,4.25rem)]"
                data-in={ctaIn}
                style={{ transitionDelay: '80ms' }}
              >
                <span className="font-[350]">{p.cta.line1}</span>
                <br />
                <span className="font-[350] italic text-[#7a6850]">{p.cta.soft}</span>
                <span className="font-bold">{p.cta.bold}</span>
              </h2>
              <p
                className="reveal mx-auto mt-6 max-w-xl text-[16px] leading-relaxed text-neutral-600 md:text-[17px]"
                data-in={ctaIn}
                style={{ transitionDelay: '160ms' }}
              >
                {p.cta.intro}
              </p>
              <div
                className="reveal mt-10 flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-12"
                data-in={ctaIn}
                style={{ transitionDelay: '240ms' }}
              >
                <a
                  href={`${home}#contact`}
                  className="group/cta inline-flex items-center gap-4 text-[16px] font-semibold text-neutral-900 md:text-[17px]"
                >
                  {p.cta.book}
                  {/* sand circles with black icons, in the panel's own colours */}
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-[#ddd0bb] text-neutral-900 transition-[transform,background-color] duration-500 group-hover/cta:translate-x-1 group-hover/cta:bg-[#d2c3aa] rtl:group-hover/cta:-translate-x-1">
                    <ArrowRight className="h-5 w-5 rtl:-scale-x-100" />
                  </span>
                </a>
                <a
                  href="tel:+966501234567"
                  className="group/call inline-flex items-center gap-4 text-[16px] font-semibold text-neutral-900 md:text-[17px]"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-[#ddd0bb] text-neutral-900 transition-colors duration-300 group-hover/call:bg-[#d2c3aa]">
                    <Phone className="h-5 w-5" />
                  </span>
                  <span>
                    {p.cta.call} <span dir="ltr" className="ms-1 font-normal text-neutral-500">+966 50 123 4567</span>
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
