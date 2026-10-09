'use client';

import React, { useState } from 'react';
import { Phone, Mail, MapPin, Send, CheckCircle2, ShieldCheck, Clock, Award } from 'lucide-react';
import BrandMark from './BrandMark';
import confetti from 'canvas-confetti';
import { useContent } from './ContentProvider';

export default function TransformCTA() {
  const t = useContent();
  const b = t.booking;
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    district: b.districts[0],
    service: t.services.items[0].title,
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  return (
    <section id="contact" className="relative py-24 bg-white border-t border-slate-200">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Why Choose FreshSpaces */}
          <div className="lg:col-span-6 space-y-8">
            <div>
              <p className="mb-5 flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.32em] text-neutral-500 md:text-[11px]">
                {b.eyebrow}
              </p>
              <h2 className="text-[2.4rem] leading-[1.04] tracking-[-0.02em] text-slate-900 sm:text-5xl lg:text-[3rem]">
                <span className="font-[350]">{b.line1}</span>
                <br />
                <span className="font-[300] italic text-neutral-400">{b.soft}</span>
                <span className="font-bold">{b.bold}</span>
              </h2>
              <p className="mt-4 text-slate-600 text-base sm:text-lg leading-relaxed">
                {b.intro}
              </p>
            </div>

            {/* Value Props */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl glass-panel border border-slate-200 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-sky-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{b.props[0].title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{b.props[0].text}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl glass-panel border border-slate-200 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5 text-sky-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{b.props[1].title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{b.props[1].text}</p>
                </div>
              </div>
            </div>

            {/* Riyadh Contact Info Cards */}
            <div className="p-6 rounded-3xl glass-panel border border-slate-200 space-y-4">
              <div className="flex items-center gap-4 text-slate-600">
                <MapPin className="w-5 h-5 text-sky-600 shrink-0" />
                <span className="text-sm">{b.address}</span>
              </div>
              <div className="flex items-center gap-4 text-slate-600">
                <Phone className="w-5 h-5 text-sky-600 shrink-0" />
                <span className="text-sm" dir="ltr">+966 50 123 4567 / +966 11 800 9000</span>
              </div>
              <div className="flex items-center gap-4 text-slate-600">
                <Mail className="w-5 h-5 text-sky-600 shrink-0" />
                <span className="text-sm">booking@freshspaces.sa</span>
              </div>
            </div>
          </div>

          {/* Right Column: Instant Booking Form */}
          <div className="lg:col-span-6">
            <div className="p-8 sm:p-10 rounded-3xl glass-panel border border-slate-200 shadow-2xl relative">
              {submitted ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-700 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">{b.doneTitle}</h3>
                  <p className="text-sm text-slate-600 max-w-sm mx-auto">
                    {b.done[0]}
                    <span className="text-sky-600 font-bold">{formData.name}</span>
                    {b.done[1]}
                    <span className="text-slate-900" dir="ltr">{formData.phone}</span>
                    {b.done[2]}
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-4 px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-900 transition-colors"
                  >
                    {b.again}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
                      <BrandMark size={30} />
                      {b.formTitle}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">{b.formIntro}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                        {b.name}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={b.namePlaceholder}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-sky-400 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                        {b.phone}
                      </label>
                      <input
                        type="tel"
                        dir="ltr"
                        required
                        placeholder="+966 5X XXX XXXX"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-sky-400 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                        {b.district}
                      </label>
                      <select
                        value={formData.district}
                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-sky-400 transition-colors"
                      >
                        {b.districts.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                        {b.service}
                      </label>
                      <select
                        value={formData.service}
                        onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-sky-400 transition-colors"
                      >
                        {t.services.items.map((sv) => (
                          <option key={sv.title} value={sv.title}>
                            {sv.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                      {b.notes}
                    </label>
                    <textarea
                      rows={3}
                      placeholder={b.notesPlaceholder}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-sky-400 transition-colors resize-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 rounded-xl bg-sky-900 text-white font-bold uppercase tracking-wider text-xs transition-colors hover:bg-sky-700 active:scale-[0.99] flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4 rtl:-scale-x-100" />
                    {b.submit}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
