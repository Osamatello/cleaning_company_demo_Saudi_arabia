'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, PhoneCall, Menu, X, MapPin, ShieldCheck } from 'lucide-react';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/85 backdrop-blur-md border-b border-slate-200 py-3 shadow-xl'
          : 'bg-gradient-to-b from-white/90 to-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <a href="#" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-cyan-300 flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
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

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#hero-3d" className="hover:text-sky-600 transition-colors">
            3D Transformation
          </a>
          <a href="#services" className="hover:text-sky-600 transition-colors">
            Services
          </a>
          <a href="#about" className="hover:text-sky-600 transition-colors">
            Why Us
          </a>
          <a href="#contact" className="hover:text-sky-600 transition-colors">
            Contact
          </a>
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
          className="md:hidden p-2 text-slate-600 hover:text-slate-900"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-6 py-6 flex flex-col gap-4 text-slate-700">
          <a
            href="#hero-3d"
            onClick={() => setMobileMenuOpen(false)}
            className="text-base font-medium hover:text-sky-600 py-1"
          >
            3D Experience
          </a>
          <a
            href="#services"
            onClick={() => setMobileMenuOpen(false)}
            className="text-base font-medium hover:text-sky-600 py-1"
          >
            Services
          </a>
          <a
            href="#about"
            onClick={() => setMobileMenuOpen(false)}
            className="text-base font-medium hover:text-sky-600 py-1"
          >
            Why FreshSpaces
          </a>
          <a
            href="#contact"
            onClick={() => setMobileMenuOpen(false)}
            className="text-base font-medium hover:text-sky-600 py-1"
          >
            Contact
          </a>
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
