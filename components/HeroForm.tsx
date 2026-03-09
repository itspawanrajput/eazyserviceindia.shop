
import React, { useState } from 'react';
import { MapPin, Phone, User, MessageSquare, ChevronDown, Loader2, Mail } from 'lucide-react';
import { SERVICES } from '../constants';
import { createLead, detectLocation } from '../services/api';

import Editable from '../src/components/Editable';

const HeroForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    location: '',
    serviceType: '',
    message: ''
  });
  const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [showWarnings, setShowWarnings] = useState({ email: false, location: false });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleDetectLocation = () => {
    setIsDetecting(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setCoords({ lat: latitude, lng: longitude });

          try {
            const area = await detectLocation(latitude, longitude);
            setFormData(prev => ({ ...prev, location: area }));
            setShowWarnings(prev => ({ ...prev, location: false }));
          } catch (error) {
            console.error("Error reverse geocoding:", error);
            setFormData(prev => ({ ...prev, location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` }));
          } finally {
            setIsDetecting(false);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          setIsDetecting(false);
          alert("Could not detect location. Please enter it manually.");
        }
      );
    } else {
      setIsDetecting(false);
      alert("Geolocation is not supported by your browser.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check for optional fields on first attempt
    if (attemptCount === 0 && (!formData.email || !formData.location)) {
      setShowWarnings({
        email: !formData.email,
        location: !formData.location
      });
      setAttemptCount(1);
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Save to DB
      await createLead({
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        location: formData.location,
        service_type: formData.serviceType,
        message: formData.message,
        source: 'Hero Form'
      });

      setSubmitStatus('success');
      setFormData({
        name: '',
        phone: '',
        email: '',
        location: '',
        serviceType: '',
        message: ''
      });
      setCoords(null);
      setAttemptCount(0);
      setShowWarnings({ email: false, location: false });
    } catch (err) {
      console.error('Failed to save lead', err);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative z-20 w-full max-w-sm md:max-w-xl mx-auto md:ml-auto">
      <Editable id="hero-form-card" type="section">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 md:p-8 shadow-2xl">
          <div className="text-center md:text-left mb-6">
            <Editable id="hero-form-title" type="text">
              <h3 className="text-xl md:text-2xl font-black text-white mb-1">Book a Fast Service Visit Now</h3>
            </Editable>
            <Editable id="hero-form-subtitle" type="text">
              <p className="text-[#FFDC64] text-[10px] md:text-xs font-bold uppercase tracking-wider">Get an Instant Callback Within 10 Minutes</p>
            </Editable>
          </div>

          {submitStatus === 'success' ? (
            <div className="bg-green-500/20 border border-green-500/50 rounded-2xl p-6 text-center animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/20">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-white font-black text-lg mb-2">Thank you!</h4>
              <p className="text-green-100 text-sm font-medium">Your request has been received. Our team will contact you shortly.</p>
              <button
                onClick={() => setSubmitStatus('idle')}
                className="mt-6 text-white/60 hover:text-white text-xs font-bold underline underline-offset-4"
              >
                Submit another request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              {submitStatus === 'error' && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-center text-red-100 text-xs font-bold">
                  Something went wrong. Please try again.
                </div>
              )}

              {attemptCount === 1 && (showWarnings.email || showWarnings.location) && (
                <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-3 text-center text-yellow-100 text-[10px] font-bold animate-pulse">
                  You can still submit without these fields. Click Submit again to continue.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Name */}
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                  <input
                    type="text"
                    placeholder="Your Name"
                    required
                    className="w-full bg-white/10 border border-white/20 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                {/* Phone */}
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    required
                    className="w-full bg-white/10 border border-white/20 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                {/* Email */}
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                  <input
                    type="email"
                    placeholder="Email Address"
                    className="w-full bg-white/10 border border-white/20 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (e.target.value) setShowWarnings(prev => ({ ...prev, email: false }));
                    }}
                  />
                  {showWarnings.email && (
                    <p className="text-yellow-400 text-[9px] mt-1 font-bold leading-tight">
                      Add your email to receive future discounts and service updates.
                    </p>
                  )}
                </div>

                {/* Location with Detect Option */}
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                  <input
                    type="text"
                    placeholder="Location / Area"
                    className="w-full bg-white/10 border border-white/20 rounded-xl py-2.5 pl-10 pr-24 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    value={formData.location}
                    onChange={(e) => {
                      setFormData({ ...formData, location: e.target.value });
                      if (e.target.value) setShowWarnings(prev => ({ ...prev, location: false }));
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={isDetecting}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-bold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                  >
                    {isDetecting ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <MapPin className="w-2.5 h-2.5" />}
                    Detect
                  </button>
                  {showWarnings.location && (
                    <p className="text-yellow-400 text-[9px] mt-1 font-bold leading-tight">
                      Click the blue Detect button. Location helps our technician reach you faster and accurately.
                    </p>
                  )}
                </div>
              </div>

              {/* Service Type */}
              <div className="relative">
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60 pointer-events-none" />
                <select
                  className="w-full bg-white/10 border border-white/20 rounded-xl py-2.5 pl-4 pr-10 text-sm text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  value={formData.serviceType}
                  onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                >
                  <option value="" disabled className="bg-slate-900">Select Service Type</option>
                  <option value="Service & Cleaning" className="bg-slate-900">Service & Cleaning</option>
                  <option value="Repair & Parts" className="bg-slate-900">Repair & Parts</option>
                  <option value="Installation/Uninstalltion" className="bg-slate-900">Installation/Uninstalltion</option>
                  <option value="Gas Refill" className="bg-slate-900">Gas Refill</option>
                </select>
              </div>

              {/* Message */}
              <div className="relative">
                <MessageSquare className="absolute left-4 top-3 w-4 h-4 text-white/60" />
                <textarea
                  placeholder="Describe your problem here......"
                  rows={4}
                  className="w-full bg-white/10 border border-white/20 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />
                <p className="text-[9px] text-white/40 mt-0.5 ml-1">Describe your problem little bit here!</p>
              </div>

              <Editable id="hero-form-submit" type="button">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl shadow-xl shadow-blue-900/20 transition-all active:scale-[0.98] mt-1 text-sm flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : 'Submit Request'}
                </button>
              </Editable>
              <p className="text-center text-white/60 text-[9px] mt-2 font-medium">
                1-Month Repeat Visit Guarantee Included
              </p>
            </form>
          )}
        </div>
      </Editable>
    </div>
  );
};

export default HeroForm;
