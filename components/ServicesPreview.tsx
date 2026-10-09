'use client';

import React from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { useContent } from './ContentProvider';
import { useInView } from './home/hooks';
import type { ServiceGroup } from '@/content/types';

// Card photos, in the same order as each group's services in the content (content/*.ts)
export const CLEANING_IMAGES = ['/images/services/villa-deep-cleaning.webp', '/images/services/upholstery-carpet.webp', '/images/services/post-construction.webp'];
export const MAINTENANCE_IMAGES = ['/images/services/ac-maintenance.webp', '/images/services/plumbing-repairs.webp', '/images/services/electrical-repairs.webp'];

/** One service: a photo with one deep, drop-like corner (the logo's shape), then its name and a line. */
export function ServiceCard({
  title,
  description,
  image,
  index,
  shown,
  aspect = 'aspect-[4/5]',
}: {
  title: string;
  description: string;
  image: string;
  index: number;
  shown: boolean;
  aspect?: string;
}) {
  return (
    <article className="reveal group" data-in={shown} style={{ transitionDelay: `${120 + (index % 4) * 110}ms` }}>
      <div className="transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-1.5">
        <div className={`relative ${aspect} overflow-hidden rounded-[26px] rounded-ss-[88px] bg-[#efe9df] shadow-[0_26px_50px_-36px_rgba(15,23,42,0.55)] transition-shadow duration-700 group-hover:shadow-[0_34px_60px_-34px_rgba(15,23,42,0.6)]`}>
          <img
            src={image}
            alt={title}
            width={720}
            height={960}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.045]"
          />
          {/* a little depth at the foot of the photo */}
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/25 to-transparent" />
          {/* the number sits in the square corner, away from the deep one */}
          <span className="absolute end-5 top-5 text-[12px] font-medium tabular-nums text-white [text-shadow:0_1px_10px_rgba(0,0,0,0.45)]">
            0{index + 1}
          </span>
          <span
            aria-hidden
            className="absolute bottom-4 end-4 grid h-11 w-11 translate-y-2 place-items-center rounded-full bg-white text-neutral-900 opacity-0 shadow-sm transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100"
          >
            <ArrowUpRight className="h-4 w-4 rtl:-scale-x-100" />
          </span>
        </div>
        <h3 className="mt-6 text-[1.35rem] font-semibold leading-snug tracking-[-0.01em] text-neutral-900 md:text-[1.5rem]">{title}</h3>
        <p className="mt-2 max-w-[34ch] text-[15px] leading-relaxed text-neutral-500">{description}</p>
      </div>
    </article>
  );
}

/** Heading and line of one group. */
function GroupHead({ group, shown }: { group: ServiceGroup; shown: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:items-end md:gap-8">
      <div className="md:col-span-7">
        <p className="reveal text-[13px] font-semibold uppercase tracking-[0.24em] text-neutral-600 md:text-[14px]" data-in={shown}>
          {group.eyebrow}
        </p>
        <h2
          className="reveal mt-4 text-[2.5rem] font-[350] leading-[1.04] tracking-[-0.025em] text-neutral-900 sm:text-5xl md:text-[clamp(3rem,4.2vw,4.25rem)]"
          data-in={shown}
          style={{ transitionDelay: '80ms' }}
        >
          {group.title}
        </h2>
      </div>
      <p
        className="reveal max-w-sm text-[15px] leading-relaxed text-neutral-500 md:col-span-5 md:justify-self-end md:text-end"
        data-in={shown}
        style={{ transitionDelay: '160ms' }}
      >
        {group.intro}
      </p>
    </div>
  );
}

/** One group in its own warm panel: heading, its three cards in a straight row, then the "View all" link centred below. */
function GroupPanel({ id, group, images, href, className }: { id: string; group: ServiceGroup; images: string[]; href: string; className: string }) {
  const [ref, shown] = useInView<HTMLDivElement>({ rootMargin: '0px 0px -15% 0px', threshold: 0 });
  return (
    <section id={id} className={`relative bg-white ${className}`}>
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div ref={ref} className="relative overflow-hidden rounded-[32px] bg-[#f6f4ef] px-5 pb-12 pt-10 sm:px-8 md:rounded-[40px] md:px-14 md:pb-14 md:pt-12">
          {/* the logo's drop, drawn large and faint in the corner of the panel */}
          <svg
            aria-hidden
            viewBox="0 0.85 40 40"
            className="pointer-events-none absolute -bottom-56 -end-32 h-[560px] w-[560px] text-[#e9e3d7] md:-bottom-72 md:-end-24"
            fill="none"
          >
            <path d="M20 3.5C20 3.5 7 17.2 7 25.2a13 13 0 0 0 26 0C33 17.2 20 3.5 20 3.5Z" stroke="currentColor" strokeWidth="0.18" />
            <path d="M20 8.5C20 8.5 10.5 19 10.5 25.2a9.5 9.5 0 0 0 19 0C29.5 19 20 8.5 20 8.5Z" stroke="currentColor" strokeWidth="0.14" />
          </svg>
          <div className="relative">
            <GroupHead group={group} shown={shown} />
            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 md:mt-12 lg:grid-cols-3 lg:gap-x-8">
              {group.items.map((s, i) => (
                <ServiceCard key={s.title} title={s.title} description={s.description} image={images[i]} index={i} shown={shown} />
              ))}
            </div>
            <div className="reveal mt-12 flex justify-center md:mt-14" data-in={shown} style={{ transitionDelay: '450ms' }}>
              <a
                href={href}
                className="group/cta inline-flex items-center gap-4 text-[16px] font-semibold text-neutral-900 transition-colors duration-300 hover:text-sky-700 md:text-[17px]"
              >
                {group.cta}
                <span className="grid h-12 w-12 place-items-center rounded-full bg-sky-600 text-white transition-[transform,background-color] duration-500 group-hover/cta:translate-x-1 group-hover/cta:bg-sky-700 rtl:group-hover/cta:-translate-x-1">
                  <ArrowRight className="h-5 w-5 rtl:-scale-x-100" />
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ServicesPreview() {
  const t = useContent();
  const base = t.locale === 'ar' ? '/ar/services' : '/services';

  return (
    <>
      {/* A) cleaning, B) maintenance & repairs: two matching panels, so the two kinds of service never mix */}
      <GroupPanel id="services" group={t.services.cleaning} images={CLEANING_IMAGES} href={`${base}#cleaning`} className="pb-6 pt-24 md:pb-8 md:pt-32" />
      <GroupPanel id="maintenance" group={t.services.maintenance} images={MAINTENANCE_IMAGES} href={`${base}#maintenance`} className="pb-24 md:pb-32" />
    </>
  );
}
