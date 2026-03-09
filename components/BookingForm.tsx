
import React, { useState } from 'react';
import { Send, MapPin, Loader2, User, Phone, Mail, MessageSquare, ChevronDown } from 'lucide-react';
import { createLead, detectLocation } from '../services/api';
import Editable from '../src/components/Editable';

const BookingForm: React.FC = () => {
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
    if (attemptCount === 0 && (!formData.email || !formData.location)) {
      setShowWarnings({ email: !formData.email, location: !formData.location });
      setAttemptCount(1);
      return;
    }
    setIsSubmitting(true);
    setSubmitStatus('idle');
    try {
      await createLead({
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        location: formData.location,
        service_type: formData.serviceType,
        message: formData.message,
        source: 'Booking Form'
      });
      setSubmitStatus('success');
      setFormData({ name: '', phone: '', email: '', location: '', serviceType: '', message: '' });
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
    <Editable id="booking-section" type="section">
      {/* Section with blurred background image */}
      <section id="booking-form" className="relative py-14 md:py-20 overflow-hidden">

        {/* Background image — blurred/dimmed */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2000&auto=format&fit=crop"
            alt="AC Service Background"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />
        </div>

        {/* Centered white card */}
        <div className="relative z-10 max-w-5xl mx-auto px-4">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col lg:flex-row">

            {/* ── LEFT: Image panel ── */}
            <div className="relative w-full lg:w-[400px] lg:flex-shrink-0 min-h-[280px] lg:min-h-[560px]">
              <Editable id="booking-panel-image" type="image">
                <img
                  src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=800&auto=format&fit=crop"
                  alt="Professional AC Technician"
                  className="absolute inset-0 w-full h-full object-cover object-top"
                  referrerPolicy="no-referrer"
                />
              </Editable>
              {/* Bottom gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              {/* Stats bar at bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                <div className="flex items-end justify-around gap-2">
                  <div className="text-center">
                    <p className="text-2xl font-black">100%</p>
                    <p className="text-[11px] text-white/75 font-semibold leading-tight mt-0.5">Happy<br />customers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black">10+</p>
                    <p className="text-[11px] text-white/75 font-semibold leading-tight mt-0.5">Years in<br />Industry</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black">4.9</p>
                    <p className="text-[11px] text-white/75 font-semibold leading-tight mt-0.5">Yelp &<br />Google reviews</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── RIGHT: Form panel ── */}
            <div className="flex-1 p-7 md:p-9 bg-white">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1.5">Booking</p>
              <Editable id="booking-title" type="text">
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-5 leading-tight">
                  Get Your Estimate &<br />Book Now
                </h2>
              </Editable>

              {submitStatus === 'success' ? (
                <div className="py-10 text-center animate-in fade-in zoom-in duration-300">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-black text-slate-900 mb-2">Thank you!</h4>
                  <p className="text-slate-500 font-medium text-sm">Your request has been received. Our team will contact you shortly.</p>
                  <button
                    onClick={() => setSubmitStatus('idle')}
                    className="mt-6 bg-blue-600 text-white px-7 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all text-sm"
                  >
                    Submit Another Request
                  </button>
                </div>
              ) : (
                <form id="main-booking-form" className="space-y-3.5" onSubmit={handleSubmit}>
                  {submitStatus === 'error' && (
                    <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-sm font-bold text-center">
                      Something went wrong. Please try again.
                    </div>
                  )}
                  {attemptCount === 1 && (showWarnings.email || showWarnings.location) && (
                    <div className="bg-yellow-50 border border-yellow-100 text-yellow-700 p-3 rounded-xl text-sm font-bold text-center">
                      You can still submit without these fields. Click Submit again to continue.
                    </div>
                  )}

                  {/* Row 1: Name + Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          className="w-full py-3 pl-10 pr-3 rounded-xl bg-slate-100 border-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                          placeholder="Enter name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="tel"
                          required
                          className="w-full py-3 pl-10 pr-3 rounded-xl bg-slate-100 border-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                          placeholder="Enter number"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Email + Location */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="email"
                          className="w-full py-3 pl-10 pr-3 rounded-xl bg-slate-100 border-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                          placeholder="Enter email"
                          value={formData.email}
                          onChange={(e) => {
                            setFormData({ ...formData, email: e.target.value });
                            if (e.target.value) setShowWarnings(prev => ({ ...prev, email: false }));
                          }}
                        />
                      </div>
                      {showWarnings.email && (
                        <p className="text-yellow-600 text-[10px] mt-1 font-bold leading-tight">Add email to receive future discounts.</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Location / Area</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          className="w-full py-3 pl-10 pr-20 rounded-xl bg-slate-100 border-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                          placeholder="Location"
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
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                        >
                          {isDetecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
                          Detect
                        </button>
                      </div>
                      {showWarnings.location && (
                        <p className="text-yellow-600 text-[10px] mt-1 font-bold leading-tight">Click Detect so our technician reaches you faster.</p>
                      )}
                    </div>
                  </div>

                  {/* Service Type */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Service Type</label>
                    <div className="relative">
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <select
                        className="w-full py-3 px-4 rounded-xl bg-slate-100 border-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none text-sm"
                        value={formData.serviceType}
                        onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                      >
                        <option value="" disabled>Select Service Type</option>
                        <option value="Service & Cleaning">Service & Cleaning</option>
                        <option value="Repair & Parts">Repair & Parts</option>
                        <option value="Installation/Uninstallation">Installation/Uninstallation</option>
                        <option value="Gas Refill">Gas Refill</option>
                      </select>
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Message (Optional)</label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                      <textarea
                        className="w-full py-3 pl-10 pr-3 rounded-xl bg-slate-100 border-none focus:ring-2 focus:ring-blue-500 transition-all h-24 resize-none text-sm"
                        placeholder="Describe your problem here......"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      />
                      <p className="text-[10px] text-slate-400 mt-1 ml-1">Describe your problem little bit here!</p>
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    id="main-booking-submit-btn"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-extrabold text-sm shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                    ) : (
                      <><span>Book My Slot Now</span><Send className="w-4 h-4" /></>
                    )}
                  </button>
                  <p className="text-center text-slate-400 text-xs mt-1 font-medium italic">
                    * 1-Month Repeat Visit Guarantee Included
                  </p>
                </form>
              )}
            </div>
            {/* end form panel */}

          </div>
        </div>
      </section>
    </Editable>
  );
};

export default BookingForm;
