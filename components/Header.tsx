'use client';

import React, { useState, useEffect } from 'react';
import { PhoneCall, Menu, X, MapPin, ShieldCheck } from 'lucide-react';
import BrandMark from './BrandMark';

// Header links, in the order the sections appear on the homepage
const NAV = [
  { id: 'services', label: 'Services' },
  { id: 'results', label: 'Before & After' },
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'contact', label: 'Contact' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);

  // highlight the section that is in the middle of the screen
  useEffect(() => {
    const els = NAV.map((n) => document.getElementById(n.id)).filter((e): e is HTMLElement => !!e);
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

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 border-b border-slate-200 py-3 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.25)]'
          : 'bg-gradient-to-b from-white/90 to-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <a href="#" className="flex items-center gap-3 group">
          <BrandMark size={48} className="transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-105" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight text-slate-900 font-sans">
                Fresh<span className="text-sky-600">Spaces</span>
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-sky-500/10 text-sky-600 border border-sky-500/20 rounded-full">
                Riyadh
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
              <MapPin className="w-3 h-3 text-emerald-600" />
              <span>Riyadh, Saudi Arabia</span>
            </div>
          </div>
        </a>

        {/* Desktop Navigation: one link per homepage section, the one in view highlighted */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600">
          {NAV.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              aria-current={current === item.id ? 'true' : undefined}
              className={`relative py-1 transition-colors hover:text-sky-600 ${current === item.id ? 'text-slate-900' : ''}`}
            >
              {item.label}
              <span
                className={`absolute -bottom-0.5 left-0 h-[2px] w-full origin-left rounded-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-transform duration-500 ${
                  current === item.id ? 'scale-x-100' : 'scale-x-0'
                }`}
              />
            </a>
          ))}
        </nav>

        {/* Right CTA */}
        <div className="hidden sm:flex items-center gap-4">
          <a
            href="tel:+966500000000"
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors px-3 py-2 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50"
          >
            <PhoneCall className="w-3.5 h-3.5 text-sky-600" />
            <span>+966 50 123 4567</span>
          </a>

          <a
            href="#contact"
            className="relative group overflow-hidden rounded-xl p-[1px] focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400 rounded-xl animate-gradient-x"></span>
            <span className="relative block px-5 py-2.5 rounded-xl bg-white transition-all duration-200 group-hover:bg-transparent">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-600 group-hover:text-white transition-colors" />
                Book Cleaning
              </span>
            </span>
          </a>
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-6 py-6 flex flex-col gap-4 text-slate-700">
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
              Call +966 50 123 4567
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
