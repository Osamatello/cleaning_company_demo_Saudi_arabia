'use client';

import React from 'react';
import { MapPin, Phone, Mail, ArrowUp } from 'lucide-react';
import BrandMark from './BrandMark';
import { SERVICE_TITLES, SELECT_SERVICE } from './ServicesCarousel';

// Same links, in the same order, as the header
const NAV = [
  { id: 'services', label: 'Services' },
  { id: 'results', label: 'Before & After' },
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'contact', label: 'Contact' },
];

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-500">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* brand + section links, mirroring the header */}
        <div className="flex flex-col gap-5 py-7 lg:flex-row lg:items-center lg:justify-between">
          <a href="#" className="group flex items-center gap-3">
            <BrandMark size={40} className="transition-transform duration-500 group-hover:-rotate-6" />
            <span className="text-lg font-extrabold tracking-tight text-slate-900">
              Fresh<span className="text-sky-600">Spaces</span>
            </span>
            <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-600">
              Riyadh
            </span>
          </a>

          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-slate-600">
            {NAV.map((item) => (
              <a key={item.id} href={`#${item.id}`} className="transition-colors hover:text-sky-600">
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        {/* services (same names as the cards; clicking one brings it to the front) and contact */}
        <div className="flex flex-col gap-4 border-t border-slate-200 py-5 text-[13px] lg:flex-row lg:items-center lg:justify-between">
          <ul className="flex flex-wrap gap-x-5 gap-y-1.5">
            {SERVICE_TITLES.map((title, i) => (
              <li key={title}>
                <a
                  href="#services"
                  onClick={() => window.dispatchEvent(new CustomEvent(SELECT_SERVICE, { detail: i }))}
                  className="transition-colors hover:text-sky-600"
                >
                  {title}
                </a>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
            <a href="tel:+966501234567" className="flex items-center gap-1.5 text-slate-900 transition-colors hover:text-sky-600">
              <Phone className="h-3.5 w-3.5 text-sky-600" />
              +966 50 123 4567
            </a>
            <a href="mailto:booking@freshspaces.sa" className="flex items-center gap-1.5 transition-colors hover:text-sky-600">
              <Mail className="h-3.5 w-3.5 text-sky-600" />
              booking@freshspaces.sa
            </a>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 py-4 text-xs sm:flex-row">
          <p className="flex items-center gap-1.5">
            © {new Date().getFullYear()} FreshSpaces
            <span className="text-slate-300">·</span>
            <MapPin className="h-3 w-3 text-emerald-600" />
            King Fahd Road, Al Olaya, Riyadh
          </p>
          <a href="#" className="group inline-flex items-center gap-2 font-medium text-slate-600 transition-colors hover:text-sky-600">
            Back to top
            <ArrowUp className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
