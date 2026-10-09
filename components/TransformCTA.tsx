'use client';

import React, { useState } from 'react';
import { ArrowRight, Check, ChevronDown, Clock, Mail, MapPin, MessageSquare, Phone, Sparkles, User } from 'lucide-react';
import BrandMark from './BrandMark';
import confetti from 'canvas-confetti';
import { useContent } from './ContentProvider';
import { useInView } from './home/hooks';
import SectionHeading from './home/SectionHeading';

// one look for every field: a warm off-white well that turns white with a soft blue ring on focus
const FIELD =
  'w-full rounded-2xl border border-[#e6dfd2] bg-[#fbfaf7] text-[15px] text-neutral-900 placeholder:text-neutral-400 transition-[border-color,background-color,box-shadow] duration-300 hover:border-[#d8cfbf] focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-500/10';
const LABEL = 'mb-1.5 block text-[13px] font-semibold text-neutral-700';
const ICON = 'pointer-events-none absolute start-4 h-[18px] w-[18px] text-neutral-400 transition-colors group-focus-within:text-sky-600';

export default function TransformCTA() {
  const t = useContent();
  const b = t.booking;
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    district: b.districts[0],
    service: t.services.cleaning.items[0].title,
    notes: '',
  });
  const [ref, shown] = useInView<HTMLDivElement>({ rootMargin: '0px 0px -15% 0px', threshold: 0 });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  return (
    <section id="contact" className="relative bg-white pb-24 md:pb-32">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div ref={ref} className="relative overflow-hidden rounded-[32px] bg-[#f6f4ef] px-4 py-12 sm:px-8 md:rounded-[40px] md:px-12 md:py-14">
          {/* the logo's drop, large and faint behind the words */}
          <svg aria-hidden viewBox="0 0.85 40 40" className="pointer-events-none absolute -bottom-64 -start-40 h-[620px] w-[620px] text-[#ebe4d7]" fill="none">
            <path d="M20 3.5C20 3.5 7 17.2 7 25.2a13 13 0 0 0 26 0C33 17.2 20 3.5 20 3.5Z" stroke="currentColor" strokeWidth="0.16" />
            <path d="M20 8.5C20 8.5 10.5 19 10.5 25.2a9.5 9.5 0 0 0 19 0C29.5 19 20 8.5 20 8.5Z" stroke="currentColor" strokeWidth="0.12" />
          </svg>

          {/* the headline runs across the top; the form below gets the room */}
          <div className="relative grid grid-cols-1 gap-6 md:grid-cols-12 md:items-end md:gap-8">
            <div className="md:col-span-7">
              <SectionHeading h={b} shown={shown} size="sm" />
            </div>
            <p
              className="reveal max-w-md text-[15px] leading-relaxed text-neutral-600 md:col-span-5 md:justify-self-end md:pb-2 md:text-end"
              data-in={shown}
              style={{ transitionDelay: '160ms' }}
            >
              {b.intro}
            </p>
          </div>

          <div className="relative mt-10 grid grid-cols-1 gap-x-10 gap-y-10 lg:grid-cols-12 lg:items-start">
            {/* the figures and the dispatch desk, kept short beside the form */}
            <div className="order-2 lg:order-1 lg:col-span-5">
              <dl className="reveal grid grid-cols-2 border-t border-[#e2dacb]" data-in={shown} style={{ transitionDelay: '240ms' }}>
                {b.stats.map((s, i) => (
                  <div key={s.label} className={`flex flex-col-reverse gap-2 border-b border-[#e2dacb] py-5 ${i % 2 ? 'border-s ps-6' : 'pe-6'}`}>
                    <dt className="text-[13px] leading-snug text-neutral-500">{s.label}</dt>
                    <dd className="text-[1.8rem] font-[300] leading-none tracking-[-0.03em] text-neutral-900 md:text-[2rem]">{s.value}</dd>
                  </div>
                ))}
              </dl>

              <div className="reveal mt-8" data-in={shown} style={{ transitionDelay: '320ms' }}>
                <p className="text-[13px] font-semibold uppercase tracking-[0.22em] text-neutral-500">{b.contactTitle}</p>
                <ul className="mt-4 space-y-3 text-[14px] text-neutral-700">
                  <li className="flex items-start gap-3.5">
                    <MapPin className="mt-0.5 h-[18px] w-[18px] shrink-0 text-sky-600" />
                    {b.address}
                  </li>
                  <li className="flex items-center gap-3.5">
                    <Phone className="h-[18px] w-[18px] shrink-0 text-sky-600" />
                    <span dir="ltr" className="flex flex-wrap gap-x-2">
                      <a href="tel:+966501234567" className="transition-colors hover:text-sky-700">
                        +966 50 123 4567
                      </a>
                      <span className="text-neutral-300">/</span>
                      <a href="tel:+966118009000" className="transition-colors hover:text-sky-700">
                        +966 11 800 9000
                      </a>
                    </span>
                  </li>
                  <li className="flex items-center gap-3.5">
                    <Mail className="h-[18px] w-[18px] shrink-0 text-sky-600" />
                    <a href="mailto:booking@freshspaces.sa" className="transition-colors hover:text-sky-700">
                      booking@freshspaces.sa
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* the form: the same fields, given the larger share of the section */}
            <div className="order-1 lg:order-2 lg:col-span-7">
              <div
                className="reveal rounded-[28px] border border-[#e9e2d5] bg-white p-5 shadow-[0_40px_80px_-60px_rgba(91,74,47,0.45)] sm:p-8 md:rounded-[28px] lg:p-9"
                data-in={shown}
                style={{ transitionDelay: '120ms' }}
              >
                {submitted ? (
                  <div className="flex min-h-[420px] flex-col items-center justify-center py-8 text-center">
                    <span className="grid h-16 w-16 place-items-center rounded-full bg-sky-600 text-white">
                      <Check className="h-7 w-7" strokeWidth={2.5} />
                    </span>
                    <h3 className="mt-7 text-[1.8rem] font-semibold tracking-[-0.015em] text-neutral-900 md:text-[2rem]">{b.doneTitle}</h3>
                    <p className="mt-3 max-w-md text-[16px] leading-relaxed text-neutral-600">
                      {b.done[0]}
                      <span className="font-semibold text-neutral-900">{formData.name}</span>
                      {b.done[1]}
                      <span className="font-semibold text-neutral-900" dir="ltr">
                        {formData.phone}
                      </span>
                      {b.done[2]}
                    </p>
                    <button
                      onClick={() => setSubmitted(false)}
                      className="group/again mt-8 inline-flex items-center gap-3 text-[15px] font-semibold text-neutral-900 transition-colors hover:text-sky-700"
                    >
                      {b.again}
                      <span className="grid h-10 w-10 place-items-center rounded-full border border-neutral-900/15 transition-colors group-hover/again:border-sky-600">
                        <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
                      </span>
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="flex items-start justify-between gap-6 border-b border-[#efe9de] pb-5">
                      <div>
                        <h3 className="text-[1.4rem] font-semibold leading-tight tracking-[-0.015em] text-neutral-900 sm:text-[1.6rem]">
                          {b.formTitle}
                        </h3>
                        <p className="mt-1.5 text-[14px] text-neutral-500">{b.formIntro}</p>
                      </div>
                      <BrandMark size={40} className="hidden shrink-0 sm:block" />
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="bk-name" className={LABEL}>
                          {b.name}
                        </label>
                        <div className="group relative flex items-center">
                          <User className={ICON} />
                          <input
                            id="bk-name"
                            type="text"
                            required
                            autoComplete="name"
                            placeholder={b.namePlaceholder}
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className={`${FIELD} h-12 pe-4 ps-12`}
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="bk-phone" className={LABEL}>
                          {b.phone}
                        </label>
                        {/* numbers read left to right in both languages, icon included */}
                        <div dir="ltr" className="group relative flex items-center">
                          <Phone className={ICON} />
                          <input
                            id="bk-phone"
                            type="tel"
                            required
                            autoComplete="tel"
                            placeholder="+966 5X XXX XXXX"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className={`${FIELD} h-12 pe-4 ps-12`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* service names are long: the service choice gets the wider share of its row */}
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-[5fr_6fr]">
                      <div>
                        <label htmlFor="bk-district" className={LABEL}>
                          {b.district}
                        </label>
                        <div className="group relative flex items-center">
                          <MapPin className={ICON} />
                          <select
                            id="bk-district"
                            value={formData.district}
                            onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                            className={`${FIELD} h-12 cursor-pointer appearance-none truncate pe-10 ps-12 md:text-[15px]`}
                          >
                            {b.districts.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute end-4 h-4 w-4 text-neutral-500" />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="bk-service" className={LABEL}>
                          {b.service}
                        </label>
                        <div className="group relative flex items-center">
                          <Sparkles className={ICON} />
                          <select
                            id="bk-service"
                            value={formData.service}
                            onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                            className={`${FIELD} h-12 cursor-pointer appearance-none truncate pe-10 ps-12 md:text-[15px]`}
                          >
                            {/* the same services, grouped by type as on the rest of the site */}
                            {[t.services.cleaning, t.services.maintenance].map((g) => (
                              <optgroup key={g.title} label={g.title}>
                                {g.items.map((sv) => (
                                  <option key={sv.title} value={sv.title}>
                                    {sv.title}
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute end-4 h-4 w-4 text-neutral-500" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label htmlFor="bk-notes" className={LABEL}>
                        {b.notes}
                      </label>
                      <div className="group relative">
                        <MessageSquare className={`${ICON} top-[15px]`} />
                        <textarea
                          id="bk-notes"
                          rows={3}
                          placeholder={b.notesPlaceholder}
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          className={`${FIELD} block resize-none py-3 pe-4 ps-12 leading-relaxed`}
                        ></textarea>
                      </div>
                    </div>

                    {/* send, and what happens next */}
                    <div className="mt-6 flex flex-col items-center gap-4 border-t border-[#efe9de] pt-5 sm:flex-row sm:justify-between">
                      <button
                        type="submit"
                        className="group/btn order-1 flex shrink-0 items-center gap-4 whitespace-nowrap rounded-full py-1 text-[16px] font-semibold text-neutral-900 transition-colors duration-300 hover:text-sky-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-500/30 sm:order-2"
                      >
                        {b.submit}
                        <span className="grid h-12 w-12 place-items-center rounded-full bg-sky-600 text-white transition-[transform,background-color] duration-500 group-hover/btn:translate-x-1 group-hover/btn:bg-sky-700 rtl:group-hover/btn:-translate-x-1">
                          <ArrowRight className="h-5 w-5 rtl:-scale-x-100" />
                        </span>
                      </button>
                      <p className="order-2 flex max-w-xs items-start gap-2 text-center text-[13px] leading-snug text-neutral-500 sm:order-1 sm:text-start">
                        <Clock className="mt-px h-4 w-4 shrink-0 text-sky-600" />
                        {b.reassure}
                      </p>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
