'use client';

import React from 'react';
import { Sparkles, MapPin, Phone, Mail, Globe, Shield, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 pt-16 pb-12 text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-cyan-300 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-slate-950 stroke-[2.5]" />
              </div>
              <span className="text-xl font-extrabold text-slate-900 font-sans">
                Fresh<span className="text-sky-600">Spaces</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-500">
              Riyadh’s premier 3D-driven villa, residential & commercial deep cleaning company. Transform your living space from chaos to spotless in 1 hour.
            </p>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-600">
              <Shield className="w-4 h-4" />
              <span>Licensed Saudi Commercial CR #101089201</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4 font-mono">
              Quick Navigation
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a href="#hero-3d" className="hover:text-sky-600 transition-colors">
                  3D Hero Experience
                </a>
              </li>
              <li>
                <a href="#services" className="hover:text-sky-600 transition-colors">
                  Our Services
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-sky-600 transition-colors">
                  Riyadh Coverage
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-sky-600 transition-colors">
                  Instant Booking
                </a>
              </li>
            </ul>
          </div>

          {/* Services Offered */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4 font-mono">
              Popular Services
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a href="#services" className="hover:text-sky-600 transition-colors">
                  Villa Deep Cleaning
                </a>
              </li>
              <li>
                <a href="#services" className="hover:text-sky-600 transition-colors">
                  Post-Construction Clean
                </a>
              </li>
              <li>
                <a href="#services" className="hover:text-sky-600 transition-colors">
                  Sofa & Carpet Steam Care
                </a>
              </li>
              <li>
                <a href="#services" className="hover:text-sky-600 transition-colors">
                  Marble Floor Polishing
                </a>
              </li>
            </ul>
          </div>

          {/* Riyadh Office Location */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4 font-mono">
              Riyadh Dispatch HQ
            </h4>
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <span>King Fahd Road, Al Olaya District, Riyadh, Kingdom of Saudi Arabia</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-mono text-slate-900">+966 50 123 4567</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-cyan-600 shrink-0" />
                <span className="font-mono">support@freshspaces.sa</span>
              </div>
              <div className="flex items-center gap-2.5 text-emerald-600 font-mono text-[11px]">
                <Globe className="w-3.5 h-3.5" />
                <span>24/7 Emergency Cleaning Hotline</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© {new Date().getFullYear()} FreshSpaces Cleaning Services Ltd. All rights reserved.</p>
          <div className="flex items-center gap-1 text-slate-500">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-sky-500 fill-sky-500" />
            <span>for Riyadh, Saudi Arabia</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
