'use client';

import React from 'react';
import { MapPin, Phone, Mail, Globe, ShieldCheck, ArrowUp } from 'lucide-react';
import BrandMark from './BrandMark';
import { useContent } from './ContentProvider';
import type { Page } from './Header';

export default function Footer({ page = 'home' }: { page?: Page }) {
  const t = useContent();
  const f = t.footer;
  // on the services page, section links lead back to the homepage and service names to this page's lists
  const home = page === 'home' ? '' : t.locale === 'ar' ? '/ar' : '/';
  const [cleaningAt, maintenanceAt] = page === 'services' ? ['#cleaning', '#maintenance'] : ['#services', '#maintenance'];
  // Same links, in the same order, as the header
  const NAV = [
    { id: 'services', label: t.nav.services },
    { id: 'results', label: t.nav.results },
    { id: 'how-it-works', label: t.nav.howItWorks },
    { id: 'reviews', label: t.nav.reviews },
    { id: 'contact', label: t.nav.contact },
  ];
  // service names, the same as the homepage cards
  const SERVICE_TITLES = [...t.services.cleaning.items, ...t.services.maintenance.items].map((s) => s.title);
  return (
    <footer className="border-t border-[#e4dfd4] bg-[#f2efe9] text-slate-600">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* brand + section links, mirroring the header */}
        <div className="flex flex-col gap-5 py-7 lg:flex-row lg:items-center lg:justify-between">
          <a href={home || '#'} className="group flex items-center gap-3">
            <BrandMark size={40} className="transition-transform duration-500 group-hover:-rotate-6" />
            <span className="text-lg font-extrabold tracking-tight text-slate-900">
              Fresh<span className="text-sky-600">Spaces</span>
            </span>
            <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-600">
              {t.header.city}
            </span>
          </a>

          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-slate-600">
            {NAV.map((item) => (
              <a key={item.id} href={`${home}#${item.id}`} className="transition-colors hover:text-sky-600">
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        {/* services (same names as the cards; clicking one brings it to the front) and the dispatch HQ */}
        <div className="grid grid-cols-1 gap-8 border-t border-[#e4dfd4] py-7 text-[13px] lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h4 className="mb-4 text-[13px] font-bold uppercase tracking-wider text-slate-900">{f.servicesTitle}</h4>
            <ul className="grid grid-cols-1 gap-x-8 gap-y-2.5 sm:grid-cols-2">
              {SERVICE_TITLES.map((title, i) => (
                <li key={title}>
                  <a href={i < 3 ? cleaningAt : maintenanceAt} className="transition-colors hover:text-sky-600">
                    {title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-5">
            <h4 className="mb-4 text-[13px] font-bold uppercase tracking-wider text-slate-900">{f.hqTitle}</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                {f.address}
              </li>
              <li>
                <a href="tel:+966501234567" className="flex items-center gap-3 text-slate-900 transition-colors hover:text-sky-600">
                  <Phone className="h-4 w-4 shrink-0 text-sky-600" />
                  <span dir="ltr">+966 50 123 4567</span>
                </a>
              </li>
              <li>
                <a href="mailto:support@freshspaces.sa" className="flex items-center gap-3 transition-colors hover:text-sky-600">
                  <Mail className="h-4 w-4 shrink-0 text-sky-600" />
                  support@freshspaces.sa
                </a>
              </li>
              <li>
                <a href="tel:+966501234567" className="flex items-center gap-3 font-medium text-sky-700 transition-colors hover:text-sky-900">
                  <Globe className="h-4 w-4 shrink-0" />
                  {f.hotline}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-[#e4dfd4] py-4 text-xs sm:flex-row">
          <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <span>© {new Date().getFullYear()} FreshSpaces</span>
            <span className="text-slate-300">·</span>
            <span className="flex items-center gap-1.5 text-sky-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              {f.licensed}
            </span>
          </p>
          <a href="#" className="group inline-flex items-center gap-2 font-medium text-slate-600 transition-colors hover:text-sky-600">
            {f.backToTop}
            <ArrowUp className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
