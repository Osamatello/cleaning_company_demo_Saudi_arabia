'use client';

import React, { useState, useEffect } from 'react';
import { PhoneCall, Menu, X, MapPin, ShieldCheck } from 'lucide-react';
import BrandMark from './BrandMark';
import { useContent } from './ContentProvider';
import type { SiteContent } from '@/content/types';

// Header links, in the order the sections appear on the homepage
const NAV_IDS: [string, keyof SiteContent['nav']][] = [
  ['services', 'services'],
  ['results', 'results'],
  ['how-it-works', 'howItWorks'],
  ['reviews', 'reviews'],
  ['contact', 'contact'],
];

/** The other language, at the same place on the page (keeps the #section). */
function LangLink({ className, onClick }: { className: string; onClick?: () => void }) {
  const t = useContent();
  return (
    <a
      href={t.lang.href}
      hrefLang={t.locale === 'ar' ? 'en' : 'ar'}
      lang={t.locale === 'ar' ? 'en' : 'ar'}
      aria-label={t.lang.aria}
      onClick={(e) => {
        onClick?.();
        if (window.location.hash) {
          e.preventDefault();
          window.location.href = t.lang.href + window.location.hash;
        }
      }}
      className={className}
    >
      {t.lang.label}
    </a>
  );
}

export default function Header() {
  const t = useContent();
  const NAV = NAV_IDS.map(([id, key]) => ({ id, label: t.nav[key] }));
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);

  // highlight the section that is in the middle of the screen
  useEffect(() => {
    const els = NAV_IDS.map(([id]) => document.getElementById(id)).filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setCurrent(e.target.id);
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    els.forEach((e) => io.observe(e));
    const top = () => {
      if (window.scrollY < window.innerHeight * 0.5) setCurrent(null);
    };
    window.addEventListener('scroll', top, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener('scroll', top);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // over the hero film the bar is clear with white type; once the page scrolls it fades to white
  const light = !scrolled && !mobileMenuOpen;
  const fade = 'transition-colors duration-500';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 border-b transition-[background-color,border-color,box-shadow,padding] duration-500 ${
        light
          ? 'border-transparent bg-transparent py-5'
          : 'border-slate-200 bg-white/95 py-3 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.25)]'
      }`}
    >
      {/* a soft shade from the top keeps the white type readable over bright frames of the film */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-0 h-[150%] bg-gradient-to-b from-black/45 to-transparent transition-opacity duration-500 ${
          light ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <a href="#" className="flex items-center gap-3 group">
          <BrandMark size={48} className="transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-105" />
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xl font-extrabold tracking-tight font-sans ${fade} ${light ? 'text-white' : 'text-slate-900'}`}>
                Fresh<span className={`${fade} ${light ? 'text-sky-300' : 'text-sky-600'}`}>Spaces</span>
              </span>
              <span
                className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border rounded-full ${fade} ${
                  light ? 'bg-white/10 text-white border-white/30' : 'bg-sky-500/10 text-sky-600 border-sky-500/20'
                }`}
              >
                {t.header.city}
              </span>
            </div>
            <div className={`flex items-center gap-1.5 whitespace-nowrap text-[11px] font-medium ${fade} ${light ? 'text-white/75' : 'text-slate-500'}`}>
              <MapPin className={`w-3 h-3 ${fade} ${light ? 'text-sky-300' : 'text-sky-600'}`} />
              <span>{t.header.tagline}</span>
            </div>
          </div>
        </a>

        {/* Desktop Navigation: one link per homepage section, the one in view highlighted */}
        <nav className={`hidden lg:flex items-center gap-5 xl:gap-7 text-sm font-medium ${fade} ${light ? 'text-white/85' : 'text-slate-600'}`}>
          {NAV.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              aria-current={current === item.id ? 'true' : undefined}
              className={`relative whitespace-nowrap py-1 transition-colors ${light ? 'hover:text-white' : 'hover:text-sky-600'} ${
                current === item.id ? (light ? 'text-white' : 'text-slate-900') : ''
              }`}
            >
              {item.label}
              <span
                className={`absolute -bottom-0.5 left-0 h-[2px] w-full origin-left rtl:origin-right rounded-full transition-transform duration-500 ${light ? 'bg-white' : 'bg-sky-600'} ${
                  current === item.id ? 'scale-x-100' : 'scale-x-0'
                }`}
              />
            </a>
          ))}
        </nav>

        {/* Right CTA */}
        <div className="hidden sm:flex items-center gap-4">
          <LangLink
            className={`whitespace-nowrap text-[13px] font-semibold px-3 py-2 rounded-lg ${fade} ${
              light ? 'text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          />
          <a
            href="#contact"
            className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider ${fade} focus:outline-none focus:ring-2 focus:ring-sky-400 ${
              light ? 'bg-white text-sky-900 hover:bg-sky-50' : 'bg-sky-900 text-white hover:bg-sky-700'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            {t.header.book}
          </a>
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`lg:hidden p-2 ${fade} ${light ? 'text-white' : 'text-slate-600 hover:text-slate-900'}`}
          aria-label={t.header.menu}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="relative lg:hidden bg-white border-b border-slate-200 px-6 py-6 flex flex-col gap-4 text-slate-700">
          {NAV.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={() => setMobileMenuOpen(false)}
              className={`text-base font-medium hover:text-sky-600 py-1 ${current === item.id ? 'text-sky-600' : ''}`}
            >
              {item.label}
            </a>
          ))}
          <div className="pt-3 border-t border-slate-200 flex flex-col gap-3">
            <a
              href="tel:+966500000000"
              className="flex items-center justify-center gap-2 text-sm font-semibold text-sky-600 py-2 rounded-lg bg-sky-500/10 border border-sky-500/20"
            >
              <PhoneCall className="w-4 h-4" />
              {t.header.call} <span dir="ltr">+966 50 123 4567</span>
            </a>
            <LangLink
              onClick={() => setMobileMenuOpen(false)}
              className="text-center text-sm font-semibold text-slate-700 py-2 rounded-lg border border-slate-200 hover:bg-slate-50"
            />
          </div>
        </div>
      )}
    </header>
  );
}
