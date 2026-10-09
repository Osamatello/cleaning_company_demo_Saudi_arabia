'use client';

import React, { useState } from 'react';
import { Phone, Mail, MapPin, Send, CheckCircle2, ShieldCheck, Clock, Award } from 'lucide-react';
import BrandMark from './BrandMark';
import confetti from 'canvas-confetti';

export default function TransformCTA() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    district: 'Al Malqa, Riyadh',
    service: 'Villa Deep Cleaning',
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
                Riyadh premier cleaning specialists
              </p>
              <h2 className="text-[2.4rem] leading-[1.04] tracking-[-0.02em] text-slate-900 sm:text-5xl lg:text-[3rem]">
                <span className="font-[350]">Transform your space</span>
                <br />
                <span className="font-[300] italic text-neutral-400">in just </span>
                <span className="font-bold">one hour.</span>
              </h2>
              <p className="mt-4 text-slate-600 text-base sm:text-lg leading-relaxed">
                Book Riyadh’s top-rated deep cleaning team. We bring specialized industrial equipment, eco-certified detergents, and 100% satisfaction guarantee to your doorstep.
              </p>
            </div>

            {/* Value Props */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl glass-panel border border-slate-200 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-sky-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Same-Day Dispatch</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Quick arrival across all Riyadh districts within 90 minutes.</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl glass-panel border border-slate-200 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5 text-sky-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">100% Satisfaction</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Free re-clean guarantee if any spot doesn't sparkle.</p>
                </div>
              </div>
            </div>

            {/* Riyadh Contact Info Cards */}
            <div className="p-6 rounded-3xl glass-panel border border-slate-200 space-y-4">
              <div className="flex items-center gap-4 text-slate-600">
                <MapPin className="w-5 h-5 text-sky-600 shrink-0" />
                <span className="text-sm">King Fahd Road, Al Olaya, Riyadh 12211, Saudi Arabia</span>
              </div>
              <div className="flex items-center gap-4 text-slate-600">
                <Phone className="w-5 h-5 text-sky-600 shrink-0" />
                <span className="text-sm">+966 50 123 4567 / +966 11 800 9000</span>
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
                  <h3 className="text-2xl font-bold text-slate-900">Booking Request Received!</h3>
                  <p className="text-sm text-slate-600 max-w-sm mx-auto">
                    Thank you, <span className="text-sky-600 font-bold">{formData.name}</span>. Our Riyadh dispatch team will call you at <span className="text-slate-900">{formData.phone}</span> within 15 minutes.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-4 px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-900 transition-colors"
                  >
                    Submit Another Request
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
                      <BrandMark size={30} />
                      Book FreshSpaces Cleaning
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Get an instant quote and priority dispatch date.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                        Your Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Osama Tillo"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-sky-400 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                        Mobile Number
                      </label>
                      <input
                        type="tel"
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
                        Riyadh District
                      </label>
                      <select
                        value={formData.district}
                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-sky-400 transition-colors"
                      >
                        <option value="Al Malqa, Riyadh">Al Malqa, Riyadh</option>
                        <option value="Al Nakheel, Riyadh">Al Nakheel, Riyadh</option>
                        <option value="Hittin, Riyadh">Hittin, Riyadh</option>
                        <option value="Al Olaya, Riyadh">Al Olaya, Riyadh</option>
                        <option value="Al Yasmin, Riyadh">Al Yasmin, Riyadh</option>
                        <option value="Other District">Other Riyadh Location</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                        Service Type
                      </label>
                      <select
                        value={formData.service}
                        onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-sky-400 transition-colors"
                      >
                        <option value="Villa Deep Cleaning">Villa Deep Cleaning</option>
                        <option value="Post-Construction Restoration">Post-Construction Restoration</option>
                        <option value="Upholstery & Carpet Steam Care">Upholstery & Carpet Steam Care</option>
                        <option value="Marble & Stone Floor Polishing">Marble & Stone Floor Polishing</option>
                        <option value="Facade & Window Cleaning">Facade & Window Cleaning</option>
                        <option value="Disinfection & Sanitization">Disinfection & Sanitization</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                      Special Requests (Optional)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Specify size of property, number of bedrooms, or specific requirements..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-sky-400 transition-colors resize-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 rounded-xl bg-sky-900 text-white font-bold uppercase tracking-wider text-xs transition-colors hover:bg-sky-700 active:scale-[0.99] flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Confirm Cleaning Booking
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
