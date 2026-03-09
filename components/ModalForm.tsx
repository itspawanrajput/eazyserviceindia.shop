import React, { useState, useEffect } from 'react';
import { X, Send, Clock, MapPin, Loader2, User, Phone, Mail, MessageSquare, ChevronDown, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { createLead, detectLocation } from '../services/api';

const ModalForm: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
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

  useEffect(() => {
    // Show popup after 15 seconds or on exit intent
    const timer = setTimeout(() => {
      if (!localStorage.getItem('popupShown')) {
        setIsOpen(true);
        localStorage.setItem('popupShown', 'true');
      }
    }, 15000);

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY < 0 && !localStorage.getItem('popupShown')) {
        setIsOpen(true);
        localStorage.setItem('popupShown', 'true');
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

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
        source: 'Popup Offer'
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

      // Auto close after 3 seconds on success
      setTimeout(() => {
        setIsOpen(false);
        setSubmitStatus('idle');
      }, 3000);
    } catch (err) {
      console.error('Failed to save lead', err);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden"
          >
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-6 top-6 z-10 p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-slate-400" />
            </button>

            <div className="p-8 md:p-10">
              {submitStatus === 'success' ? (
                <div className="py-12 text-center animate-in fade-in zoom-in duration-300">
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="text-2xl font-black text-slate-900 mb-2">Thank you!</h4>
                  <p className="text-slate-500 font-medium">Your request has been received. Our team will contact you shortly.</p>
                </div>
              ) : (
                <>
                  <div className="mb-8">
                    <h3 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">Exclusive Offer!</h3>
                    <p className="text-slate-500 font-medium">Book now and get a <span className="text-blue-600 font-bold">10% Discount</span> on your first service.</p>
                  </div>

                  <form id="popup-booking-form" className="space-y-4" onSubmit={handleSubmit}>
                    {submitStatus === 'error' && (
                      <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm font-bold text-center">
                        Something went wrong. Please try again.
                      </div>
                    )}

                    {attemptCount === 1 && (showWarnings.email || showWarnings.location) && (
                      <div className="bg-yellow-50 border border-yellow-100 text-yellow-700 p-4 rounded-xl text-sm font-bold text-center animate-pulse">
                        You can still submit without these fields. Click Submit again to continue.
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          className="w-full p-4 pl-12 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-blue-500 transition-all text-slate-900"
                          placeholder="Your Name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="tel"
                          required
                          className="w-full p-4 pl-12 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-blue-500 transition-all text-slate-900"
                          placeholder="Phone Number"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        className="w-full p-4 pl-12 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-blue-500 transition-all text-slate-900"
                        placeholder="Email Address"
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value });
                          if (e.target.value) setShowWarnings(prev => ({ ...prev, email: false }));
                        }}
                      />
                      {showWarnings.email && (
                        <p className="text-yellow-600 text-[10px] mt-1 font-bold leading-tight">
                          Add your email to receive future discounts and service updates.
                        </p>
                      )}
                    </div>

                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        className="w-full p-4 pl-12 pr-24 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-blue-500 transition-all text-slate-900"
                        placeholder="Your Location"
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
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-3 py-2 rounded-xl transition-colors flex items-center gap-1"
                      >
                        {isDetecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
                        Detect
                      </button>
                      {showWarnings.location && (
                        <p className="text-yellow-600 text-[10px] mt-1 font-bold leading-tight">
                          Click the blue Detect button. Location helps our technician reach you faster and accurately.
                        </p>
                      )}
                    </div>

                    <div className="relative">
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <select
                        className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-blue-500 transition-all appearance-none text-slate-900"
                        value={formData.serviceType}
                        onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                      >
                        <option value="" disabled>Select Service Type</option>
                        <option value="Service & Cleaning">Service & Cleaning</option>
                        <option value="Repair & Parts">Repair & Parts</option>
                        <option value="Installation/Uninstalltion">Installation/Uninstalltion</option>
                        <option value="Gas Refill">Gas Refill</option>
                      </select>
                    </div>

                    <button
                      id="popup-booking-submit-btn"
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          Claim My Discount Now
                          <Send className="w-5 h-5 ml-3" />
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-medium">
                      <Clock className="w-3 h-3" />
                      <span>Offer valid for next 30 minutes only!</span>
                    </div>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ModalForm;
