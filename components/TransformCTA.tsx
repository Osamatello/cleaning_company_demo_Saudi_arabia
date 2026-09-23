'use client';

import React, { useState } from 'react';
import { Sparkles, Phone, Mail, MapPin, Send, CheckCircle2, ShieldCheck, Clock, Award } from 'lucide-react';
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
      {/* Background Glow */}
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-[160px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[160px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Why Choose FreshSpaces */}
          <div className="lg:col-span-6 space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold uppercase tracking-wider mb-4">
                <ShieldCheck className="w-4 h-4" />
                <span>Riyadh Premier Cleaning Specialists</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight font-sans leading-tight">
                Transform Your Space <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-emerald-500">
                  In Just 1 Hour.
                </span>
              </h2>
              <p className="mt-4 text-slate-600 text-base sm:text-lg leading-relaxed">
                Book Riyadh’s top-rated 3D deep cleaning team. We bring specialized industrial equipment, eco-certified detergents, and 100% satisfaction guarantee to your doorstep.
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
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5 text-emerald-600" />
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
                <Phone className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="text-sm font-mono">+966 50 123 4567 / +966 11 800 9000</span>
              </div>
              <div className="flex items-center gap-4 text-slate-600">
                <Mail className="w-5 h-5 text-cyan-600 shrink-0" />
                <span className="text-sm font-mono">booking@freshspaces.sa</span>
              </div>
            </div>
          </div>

          {/* Right Column: Instant Booking Form */}
          <div className="lg:col-span-6">
            <div className="p-8 sm:p-10 rounded-3xl glass-panel border border-slate-200 shadow-2xl relative">
              {submitted ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Booking Request Received!</h3>
                  <p className="text-sm text-slate-600 max-w-sm mx-auto">
                    Thank you, <span className="text-sky-600 font-bold">{formData.name}</span>. Our Riyadh dispatch team will call you at <span className="font-mono text-slate-900">{formData.phone}</span> within 15 minutes.
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
                    <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-sky-600" />
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
                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-sky-400 transition-colors font-mono"
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
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400 text-slate-950 font-extrabold uppercase tracking-wider text-xs shadow-lg shadow-sky-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4 fill-slate-950" />
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
